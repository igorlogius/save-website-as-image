/* global browser */

(async () => {

	const manifest = browser.runtime.getManifest();
	const extname = manifest.name;

	function getFilename() {
		const d = new Date();
		let ts = extname;
		// YYYY-MM-DD-hh-mm-ss
		[d.getFullYear(), d.getMonth()+1, d.getDate()+1,
			d.getHours(), d.getMinutes(), d.getSeconds()].forEach((t,i) => {
				ts = ts + ((i!==3)?"-":"_") + ((t<10)?"0":"") + t;
			});
		return ts;
	}

    const tabs = (await browser.tabs.query({ highlighted: true, currentWindow: true })).sort( (a,b) => (a.index - b.index));

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
    [w,h,document.title];`
            });

            if (tmp.length < 1) {
                throw 'Error: failed to get page width and height';
            }
            // executeScript returns an array with the first element being the result
            tmp = tmp[0];

            const dataURI = await browser.tabs.captureTab(tab.id,{
                rect: {
                    x:0,
                    y:0,
                    width: tmp[0],
                    height: tmp[1]
                }
            });
            let filename = tsFilename + "_" + success;
            if(tmp[2].length > 0){
                filename = filename + " " + tmp[2];
            }
            const link = document.createElement('a');
            link.setAttribute('download', filename);
            link.setAttribute('href', dataURI);
            link.click();
            success++;

        }catch(e) {
            const p = document.createElement('div');
            p.innerText = ' - Tab ' + (tab.index+1)  + ' (' + e.toString() + ')';
            msgs.push(p);
        }
    }
    document.body.innerText = '';

    if(success === tabs.length){
        document.body.style.backgroundColor = 'lightgreen';
        document.body.innerText = 'Saved Websites';
        setTimeout(window.close, 2700);
    }else{
        document.body.style.backgroundColor = 'lightpink';
        for(const m of msgs){
            document.body.appendChild(m);
        }
    }
})();
