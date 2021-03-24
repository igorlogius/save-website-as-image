//const options = { format: "png" };
const extId = "Simple-Screenshot";
const link = document.querySelector('#link');

function getFilename() {
	const d = new Date();
	let ts = extId;
	// YYYY-MM-DD-hh-mm-ss
	[d.getFullYear(), d.getMonth()+1, d.getDate()+1, 
	    d.getHours(), d.getMinutes(), d.getSeconds()].forEach((t,i) => {
		ts = ts + ((i!==3)?"-":"_") + ((t<10)?"0":"") + t;
	});
	return ts;
}

function simulateClick(elem) {
	const evt = new MouseEvent('click', {
		 bubbles: false
		,cancelable: false
		,view: window
	});
	elem.dispatchEvent(evt);
}

browser.tabs.captureTab(/*options*/).then(function(dataURI) {
	const filename = getFilename();
	link.setAttribute('download', filename);
	link.setAttribute('href', dataURI);
	simulateClick(link);
});

