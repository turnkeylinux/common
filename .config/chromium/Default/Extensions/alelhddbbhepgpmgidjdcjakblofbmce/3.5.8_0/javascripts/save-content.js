var customEvent = document.createEvent('Event');
customEvent.initEvent('myCustomEvent', true, true);

function fireCustomEvent(data) {
  hiddenDiv = document.getElementById('messageChannel');
  hiddenDiv.innerText = data;
  hiddenDiv.dispatchEvent(customEvent);
}

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	if (request.action==='return_image_data') {
		fireCustomEvent(JSON.stringify(request));
	}
});