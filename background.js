
const extId = "Simple-Screenshot";

function getFilename()
{
	const d = new Date();

	let ts = extId + "_";
	// date YYYY-MM-DD
	t = d.getFullYear();
	ts = ts + t + "-";
	t = (d.getMonth()+1);
	ts = ts + ((t<10)?"0":"") + t + "-";
	t = (d.getDate()+1);
	ts = ts + ((t<10)?"0":"") + t + "_";
	// time hh:mm:ss
	t = (d.getHours()+1);
	ts = ts + ((t<10)?"0":"") + t + ":";
	t = (d.getMinutes()+1);
	ts = ts + ((t<10)?"0":"") + t + ":";
	t = (d.getSeconds()+1);
	ts = ts + ((t<10)?"0":"") + t + "";
	// filetype
	ts = ts + ".png";
	// 
	return ts;
}

async function onBrowserActionClicked(tab) { 
	const options = { format: "png" };
	const dataURI = await browser.tabs.captureTab(tab.id,options);
	await browser.tabs.executeScript({file: 'content-script.js'});
	await browser.tabs.sendMessage(tab.id, {
		 "dataURI": dataURI 
		,"filename": getFilename() 
	});
}

browser.browserAction.onClicked.addListener(onBrowserActionClicked); 
