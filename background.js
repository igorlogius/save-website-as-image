/* global browser */

const manifest = browser.runtime.getManifest();
const extname = manifest.name;
const aframes = "▖▘▝▗";
let nid = null;

function saveAs(tabTitle, tabURL, linkURL, isObjectURL) {
  const link = document.createElement("a");

  let dlfilename = getTimeStampStr() + " " + tabTitle + " " + tabURL;
  dlfilename = dlfilename.replaceAll(".", "_");

  link.setAttribute("download", dlfilename + ".cbz");
  link.setAttribute("href", linkURL);

  link.addEventListener("click", () => {
    setTimeout(() => {
      if (isObjectURL) {
        window.URL.revokeObjectURL(zipobjurl);
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

async function onBAClicked(tab) {
  start_processing();

  const stepHeight = await getFromStorage("number", "stepHeight", 10000);

  let tmp = "";

  try {
    tmp = await browser.tabs.executeScript(tab.id, {
      code: `var body = document.body,html = document.documentElement;
    var h = Math.max( body.scrollHeight, body.offsetHeight,  html.clientHeight, html.scrollHeight, html.offsetHeight );
    var w = Math.max( body.scrollWidth, body.offsetWidth,  html.clientWidth, html.scrollWidth, html.offsetWidth );
    [w,h,window.location.href, document.title];`,
    });

    if (tmp.length < 1) {
      throw "Error: failed to get page dimensions";
    }
    // executeScript returns an array with the first element being the result
    tmp = tmp[0];

    let dataURI = "";

    // only one image
    if (tmp[1] <= stepHeight) {
      // only generate one image

      dataURI = await browser.tabs.captureTab(tab.id, {
        format: "jpeg",
        quality: 90,
        rect: {
          x: 0,
          y: 0,
          width: tmp[0],
          height: tmp[1],
        },
      });

      saveAs(tab.title, tab.url, dataURI, false);
    } else {
      let zip = new JSZip();
      let i = 1;
      let y_offset = 0;
      while (tmp[1] > y_offset) {
        dataURI = await browser.tabs.captureTab(tab.id, {
          format: "jpeg",
          quality: 90,
          rect: {
            x: 0,
            y: y_offset,
            width: tmp[0],
            height:
              tmp[1] > y_offset + stepHeight ? stepHeight : tmp[1] - y_offset,
          },
        });

        y_offset = y_offset + stepHeight;

        let blob = await fetch(dataURI).then((r) => r.blob());
        zip.file(i + ".jpg", blob, { binary: true });
        i++;
      }

      const zipblob = await zip.generateAsync({ type: "blob" });
      const zipobjurl = window.URL.createObjectURL(zipblob);

      saveAs(tab.title, tab.url, zipobjurl, true);
    }
  } catch (e) {
    console.error(e);
  }
  stop_processing();
}

browser.browserAction.onClicked.addListener(onBAClicked);
browser.browserAction.setBadgeBackgroundColor({ color: "lightgray" });
browser.browserAction.setBadgeText({ text: "+" });
