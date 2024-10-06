/* global browser */

//const manifest = browser.runtime.getManifest();
//const extname = manifest.name;
const aframes = "▖▘▝▗";

async function captureTab(tabId, y, width, height, outputFormat) {
  let config = {
    format: outputFormat,
    rect: {
      x: 0,
      y,
      width,
      height,
    },
  };

  if (outputFormat === "jpeg") {
    config["quality"] = 90;
  }
  return await browser.tabs.captureTab(tabId, config);
}

function saveAs(tabTitle, tabURL, linkURL, isObjectURL) {
  const link = document.createElement("a");

  let dlfilename = getTimeStampStr() + " " + tabTitle + " " + tabURL;
  dlfilename = dlfilename.replaceAll(".", "_");

  link.setAttribute("download", dlfilename + ".cbz");
  link.setAttribute("href", linkURL);

  link.addEventListener("click", () => {
    setTimeout(() => {
      if (isObjectURL) {
        window.URL.revokeObjectURL(linkURL);
      }
      link.remove();
    }, 5000);
  });
  link.click();
}

function getTimeStampStr() {
  const d = new Date();
  let ts = "";
  [
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate() + 1,
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
  ].forEach((t, i) => {
    ts = ts + (i !== 3 ? "-" : "_") + (t < 10 ? "0" : "") + t;
  });
  return ts.substring(1);
}

let workingIntervalId = null;

async function start_processing() {
  browser.browserAction.disable();

  clearInterval(workingIntervalId);
  workingIntervalId = setInterval(async () => {
    let txt = await browser.browserAction.getBadgeText({});
    let tmp = aframes.indexOf(txt);
    if (tmp > -1 && tmp < aframes.length - 1) {
      browser.browserAction.setBadgeText({ text: aframes[tmp + 1] });
    } else {
      browser.browserAction.setBadgeText({ text: aframes[0] });
    }
  }, 500);
}

function stop_processing() {
  clearInterval(workingIntervalId);
  browser.browserAction.setBadgeText({ text: "+" });
  browser.browserAction.enable();
}

async function getFromStorage(type, id, fallback) {
  let tmp = await browser.storage.local.get(id);
  return typeof tmp[id] === type ? tmp[id] : fallback;
}

async function onBAClicked() {
  start_processing();

  const tabs = (
    await browser.tabs.query({ highlighted: true, currentWindow: true })
  ).map((t) => {
    return { id: t.id, title: t.title, url: t.url };
  });

  const stepHeight = await getFromStorage("number", "stepHeight", 10000);
  const outputFormat = await getFromStorage("string", "outputFormat", "jpeg");

  let tmp = "";

  for (const tab of tabs) {
    try {
      tmp = await browser.tabs.executeScript(tab.id, {
        code: `
    (() => {
        const body = document.body;
        const html = document.documentElement;
        const h = Math.max( body.scrollHeight, body.offsetHeight,  html.clientHeight, html.scrollHeight, html.offsetHeight );
        const w = Math.max( body.scrollWidth, body.offsetWidth,  html.clientWidth, html.scrollWidth, html.offsetWidth );
        return {"width": w, "height": h };
    })()`,
      });

      if (tmp.length < 1) {
        throw "Error: failed to get page dimensions";
      }
      // executeScript returns an array with the first element being the result
      tmp = tmp[0];

      let dataURI = "";

      // only one image
      if (tmp.height <= stepHeight) {
        // only generate one image

        dataURI = await captureTab(
          tab.id,
          0,
          tmp.width,
          tmp.height,
          outputFormat,
        );
        saveAs(tab.title, tab.url, dataURI, false);
      } else {
        let zip = new JSZip();
        let i = 1;
        let y_offset = 0;
        while (tmp.height > y_offset) {
          dataURI = await captureTab(
            tab.id,
            y_offset,
            tmp.width,
            tmp.height > y_offset + stepHeight
              ? stepHeight
              : tmp.height - y_offset,
            outputFormat,
          );

          y_offset = y_offset + stepHeight;

          const blob = await fetch(dataURI).then((r) => r.blob());
          zip.file(i + "." + outputFormat, blob, { binary: true });
          i++;
        }

        const zipblob = await zip.generateAsync({ type: "blob" });
        const zipobjurl = window.URL.createObjectURL(zipblob);

        saveAs(tab.title, tab.url, zipobjurl, true);
      }
    } catch (e) {
      console.error(e);
    }
  }
  stop_processing();
}

browser.browserAction.onClicked.addListener(onBAClicked);
browser.browserAction.setBadgeBackgroundColor({ color: "lightgray" });
browser.browserAction.setBadgeText({ text: "+" });
