/* global browser */

function onChange(evt) {
  let id = evt.target.id;
  let el = document.getElementById(id);

  let value = el.type === "checkbox" ? el.checked : el.value;
  let obj = {};

  //console.debug('value:', id,value, 'type:', el.type, 'min:', el.min, 'max', el.max);

  if (value === "") {
    return;
  }
  if (el.type === "number") {
    try {
      value = parseInt(value);
      if (isNaN(value)) {
        value = el.min;
      }
      if (value < el.min) {
        value = el.min;
      }
    } catch (e) {
      value = el.min;
    }
  }

  obj[id] = value;

  //console.debug(id,value);
  browser.storage.local.set(obj).catch(console.error);
}

function onLoad() {
  /*
	const manifest = browser.runtime.getManifest();
	const toolbarActionSelect = document.getElementById('toolbarAction');
	for(const cmd of Object.keys(manifest.commands)){
		toolbarActionSelect.add(new Option(manifest.commands[cmd].description, cmd));
	}
	*/

  ["stepHeight", "outputFormat"].map((id) => {
    browser.storage.local
      .get(id)
      .then((obj) => {
        let el = document.getElementById(id);
        let val = obj[id];
        //console.debug(id, val);
        if (typeof val !== "undefined") {
          if (el.type === "checkbox") {
            el.checked = val;
          } else {
            el.value = val;
          }
        } else {
          el.value = (() => {
            switch (id) {
              case "stepHeight":
                return 10000;
              case "outputFormat":
                return "jpeg";
              default:
                return 0;
            }
          })();
        }
      })
      .catch(console.error);

    let el = document.getElementById(id);
    el.addEventListener("input", onChange);
  });
}

document.addEventListener("DOMContentLoaded", onLoad);
