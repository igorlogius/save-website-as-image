
function getFilename() {
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
	ts = ts + ((t<10)?"0":"") + t + "-";
	t = (d.getMinutes()+1);
	ts = ts + ((t<10)?"0":"") + t + "-";
	t = (d.getSeconds()+1);
	ts = ts + ((t<10)?"0":"") + t + "";
	// filetype
	ts = ts + ".png";
	// 
	return ts;
}

function simulateClick(elem) {
	const evt = new MouseEvent('click', {
		bubbles: false,
		cancelable: false,
		view: window
	});
	elem.dispatchEvent(evt);
}

const extId = "Simple-Screenshot";

//let link = document.createElement('a');
//link.style.display = 'none';
//link.setAttribute('target', '_blank');
//document.body.append(link);

const options = { format: "png" };
//const dataURI = 
browser.tabs.captureTab(options).then(function(dataURI) {
	const filename = getFilename();

	let link = document.querySelector('#link');
	link.setAttribute('download', filename);
	link.setAttribute('href', dataURI);
	simulateClick(link);
});

