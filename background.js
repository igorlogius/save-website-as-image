/* global browser */

const manifest = browser.runtime.getManifest();
const extname = manifest.name;

function notify(title, message = "", iconUrl = "icon.png") {
    return browser.notifications.create(""+Date.now(),
        {
           "type": "basic"
            ,iconUrl
            ,title
            ,message
        }
    );
}

function getFilename() {
	const d = new Date();
	let ts = extname;
	// YYYY-MM-DD-hh-mm-ss
[d.getFullYear(), d.getMonth()+1, d.getDate()+1,
    d.getHours(), d.getMinutes(), d.getSeconds()].forEach((t,i) => {
    ts = ts + ((i!==3)?"-":" ") + ((t<10)?"0":"") + t;
	});
	return ts;
}

async function getFromStorage(type, id, fallback) {
    let tmp = await browser.storage.local.get(id);
    return (typeof tmp[id] === type) ? tmp[id] : fallback;
}

async function onBAClicked() {

    const tabs = (await browser.tabs.query({ highlighted: true, currentWindow: true })).sort( (a,b) => (a.index - b.index));

    if(tabs.length < 0){
	    return;
    }
    notify(extname, "Capturing Images for " + tabs.length + " Tabs");

    const stepHeight = await getFromStorage('number', 'stepHeight',10000);

    let success = 0;
    let tmp = '';

    let msgs = [];
    const tsFilename = getFilename();

    for(const tab of tabs) {
        try {
            tmp = await browser.tabs.executeScript(tab.id, { code:
    `var body = document.body,html = document.documentElement;
    var h = Math.max( body.scrollHeight, body.offsetHeight,  html.clientHeight, html.scrollHeight, html.offsetHeight );
    var w = Math.max( body.scrollWidth, body.offsetWidth,  html.clientWidth, html.scrollWidth, html.offsetWidth );
    [w,h,window.location.href, document.title];`
            });

            if (tmp.length < 1) {
                throw 'Error: failed to get page width and height';
            }
            // executeScript returns an array with the first element being the result
            tmp = tmp[0];

	    //console.debug(tmp[0],tmp[1]);
	    
		let dataURI;

		// First Part (try to get entries page)

		let y_offset = 0;
			let i=1;

		    while(tmp[1] > y_offset){

			    dataURI = await browser.tabs.captureTab(tab.id,{
				rect: {
				    x:0,
				    y:y_offset,
				    width: tmp[0],
				    height: (tmp[1] > (y_offset+stepHeight))? stepHeight: (tmp[1]-y_offset)
				}
			    });
			    y_offset = y_offset + stepHeight;

			    	    let filename = tsFilename + " Tab " + success + " Part " + (i) ;
				    if(tmp[2].length > 0){
					filename = filename + " " + tmp[2];
				    }
				    if(tmp[3].length > 0){
					filename = filename + " " + tmp[3];
				    }
				    filename = filename.replaceAll('.','_');

				    const link = document.createElement('a');
				    link.setAttribute('download', filename);
				    link.setAttribute('href', dataURI);
				    link.click();
			    	    link.remove();
			    i++;
		    }
				
	    
	    success++;

        }catch(e) {
            msgs.push(' - Tab ' + (tab.index+1)  + ' (' + e.toString() + ')');
        }
    }

    if(success === tabs.length){
    	notify(extname, "Completed");
    }else{
    	notify(extname, "Completed with errors:\n " + msgs.join("\n") );
    }
}

browser.browserAction.onClicked.addListener(onBAClicked);

