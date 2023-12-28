/* global browser */

const manifest = browser.runtime.getManifest();
const extname = manifest.name;

let nid = null;

async function notify(title, message = "", iconUrl = "icon.png") {
  try {
    if (nid !== null) {
      await browser.notifications.clear(nid);
    }
    nid = await browser.notifications.create("" + Date.now(), {
      type: "basic",
      iconUrl,
      title,
      message,
    });
  } catch (e) {
    //noop
  }
}

async function getFromStorage(type, id, fallback) {
  let tmp = await browser.storage.local.get(id);
  return typeof tmp[id] === type ? tmp[id] : fallback;
}

async function onBAClicked(tab) {
  browser.browserAction.disable();

  let zip = new JSZip();

  const tabs = (
    await browser.tabs.query({ highlighted: true, currentWindow: true })
  ).sort((a, b) => a.index - b.index);

  notify(extname, "Saving, ... ");

  const stepHeight = await getFromStorage("number", "stepHeight", 10000);

  let success = 0;
  let tmp = "";

  let msgs = [];

  for (const tab of tabs) {
    try {
      tmp = await browser.tabs.executeScript(tab.id, {
        code: `var body = document.body,html = document.documentElement;
    var h = Math.max( body.scrollHeight, body.offsetHeight,  html.clientHeight, html.scrollHeight, html.offsetHeight );
    var w = Math.max( body.scrollWidth, body.offsetWidth,  html.clientWidth, html.scrollWidth, html.offsetWidth );
    [w,h,window.location.href, document.title];`,
      });

      if (tmp.length < 1) {
        throw "Error: failed to get page width and height";
      }
      // executeScript returns an array with the first element being the result
      tmp = tmp[0];

      //console.debug(tmp[0],tmp[1]);

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

        const link = document.createElement("a");
        link.setAttribute("download", tab.title + tab.url);
        link.setAttribute("href", dataURI);
        link.click();
        link.remove();
      } else {
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

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, tab.title + tab.url + ".cbz");

        success++;
      }
    } catch (e) {
      msgs.push(" - Tab " + tab.url + " (" + e.toString() + ")");
    }
  } // for  tabs

  if (success === tabs.length) {
    notify(extname, "Done!");
  } else {
    notify(extname, "Failed! " + msgs.join("\n"));
  }
  browser.browserAction.enable();
}

browser.browserAction.onClicked.addListener(onBAClicked);
