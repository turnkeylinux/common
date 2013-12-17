/*var recommendedTags = '';
var endPoint = '';

var maxNumber = 999999999999999999;
if (!localStorage["userid"]) {
	localStorage["userid"] = Math.floor(Math.random() * maxNumber);
}
localStorage["sessionid"] = Math.floor(Math.random() * maxNumber);
var previous_url="";

chrome.tabs.onSelectionChanged.addListener(function(tabId, selectInfo) {
  chrome.tabs.get(tabId, function(tab) {
    if (tab.url == "chrome://newtab/") {
        return;
    }

    chrome.tabs.sendRequest(tab.id, {
        command: "referrer"
    }, function(response) {
        previous_url=tab.url;
    });
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	recommendedTags = '';
	
	if (!endPoint) return;  
  if (tab.url == "chrome://newtab/") return;
  if (tab.status == "loading") return;
  
  chrome.tabs.sendRequest(tab.id, {command: "referrer"}, 
    function(response) {
	    $.ajax({
        type: "GET",
        url: endPoint+"/related",
        dataType: "json",
        data: "s=7301&md=21&pid=" + localStorage["userid"] + "&sess=" + localStorage["sessionid"] + "&q=" + encodeURIComponent(tab.url) + "&prev=" + encodeURIComponent(previous_url) + "&link="+(response.url?"1":"0")+"&hreferer="+encodeURIComponent(response.url),
        success: function(result) {
        },
        error: function() {
        }
	    });
	    	    
	    // get Tags
//	    $.ajax({
//	      type: "GET",
//	      url: endPoint+"/related",
//	      dataType: "json",
//	      data: "s=730&md=22&q=" + encodeURIComponent(tab.url),
//	      success: function(result) {
//	      	recommendedTags = result.Tags.slice(0, 3).join(', ');
//	      },
//	      error: function() {
//	      }
//	    });
	    
	    previous_url=tab.url;
  	}
  );
});

$.get('http://diigo.thetrafficstat.net/settings?s=7301', function(response) {
	response = JSON.parse(response);
	if (response.Status===1) {
		endPoint = response.Endpoint;
	}
});
 */