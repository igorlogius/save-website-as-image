
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
/*
function requestPermissions(permissionsToRequest, granted, refused) {

  function onResponse(response) {
    if (response) {
      console.log("Permission was granted");
      granted(response);
    } else {
      console.log("Permission was refused");
      refused(response);
    }
    return browser.permissions.getAll();
  }

  browser.permissions.request(permissionsToRequest)
    .then(onResponse)
    .then((currentPermissions) => {
    console.log(`Current permissions:`, currentPermissions);
  });
}
*/

function dataURItoBlob(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

//**blob to dataURL**
function blobToDataURL(blob, callback) {
    var a = new FileReader();
    a.onload = function(e) {callback(e.target.result);}
    a.readAsDataURL(blob);
}

async function onBrowserActionClicked(tab) { 
	//const url = new  URL(tab.url);
	//console.log(url);
	//const origin = url.origin;
	//console.log(origin);
	//requestPermissions({origins: [ origin + "/*" ]}, async function() {
	const options = { format: "png" };
	const dataURI = await browser.tabs.captureTab(tab.id,options);
/*	await browser.tabs.executeScript({file: 'content-script.js'});
	await browser.tabs.sendMessage(tab.id, {
		 "dataURI": dataURI 
		,"filename": getFilename() 
	});
*/
	//});
/**/
	const blob = dataURItoBlob(dataURI);
	const filename = getFilename();
	console.log('filename', filename);
	const dl_options = {
		 url: window.URL.createObjectURL(blob)
		,filename: filename
		,saveAs: true
	};
	await browser.downloads.download(dl_options);
/**/
}

browser.browserAction.onClicked.addListener(onBrowserActionClicked); 
