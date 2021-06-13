//const options = { format: "png" };

(async () => {
	const extId = "tab2img";
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

	let tmp = await browser.tabs.executeScript({ code: 
`var body = document.body,html = document.documentElement;
var h = Math.max( body.scrollHeight, body.offsetHeight,  html.clientHeight, html.scrollHeight, html.offsetHeight );
var w = Math.max( body.scrollWidth, body.offsetWidth,  html.clientWidth, html.scrollWidth, html.offsetWidth );
[w,h,document.title];`
	});

	tmp = tmp[0];
	if (tmp.length > 0) {
		//console.log(JSON.stringify(tmp));
		const dataURI = await browser.tabs.captureTab({rect: {x:0,y:0,width: tmp[0], height: tmp[1]}});
		let filename = getFilename();
		if(tmp[2].length > 0){ 
			filename = filename + " " + tmp[2];
		}
		link.setAttribute('download', filename);
		link.setAttribute('href', dataURI);
		simulateClick(link);
	}

})();
