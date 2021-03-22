(function(){
	if (typeof window.simplescreenshot_hasRun !== 'undefined'){
		return;
	}
	window.simplescreenshot_hasRun = true;

	// add empty data link
	let link = document.createElement('a');
	link.style.display = 'none';
	link.setAttribute('target', '_blank');
	document.body.append(link);

	function simulateClick(elem) {
		const evt = new MouseEvent('click', {
			bubbles: false,
			cancelable: false,
			view: window
		});
		elem.dispatchEvent(evt);
	}

	browser.runtime.onMessage.addListener( (message) => {
		mode = message.dataURI;
		link.setAttribute('download', message.filename);
		link.setAttribute('href',message.dataURI);
		simulateClick(link);
	});
}());
