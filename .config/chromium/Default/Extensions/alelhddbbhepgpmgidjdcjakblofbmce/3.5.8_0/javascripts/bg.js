var win, menuType, type, dataURL = [];
var tabid, taburl, tabtitle;
var counter, ratio , scrollBar,
	centerW=0, centerH=0;
var currentversion= chrome.app.getDetails().version;	
//localStorage['version'] = '3.3.5';
var tabids = {};
var data;
var tempDataUrl;

// defalut options
if (!localStorage['msObj']) {
    localStorage['msObj'] = '{"visible":{"enable":true,"key":"V"},"selected":{"enable":true,"key":"S"},"entire":{"enable":true,"key":"E"}}';
}
if (!localStorage['format']) {
    localStorage['format'] = "png";
}

$(document).ready(function(){
    if (!localStorage['savePath'] || localStorage['savePath'] == 'C:/') {
        var plugin = document.getElementById('pluginobj');
        localStorage['savePath'] = plugin.GetDefaultSavePath();

    }
});

if (!localStorage['autoSave']) {
    localStorage['autoSave'] = 'false';
}
 
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	//get screenshot type
	console.log(request.action,menuType,sender);
	if (!sender.tab || sender.tab.id == -1) {
		menuType = request.action;
	}
	//console.log(request,menuType);
	switch(request.action) {
		case 'visible':
			if (menuType == 'selected') {
				type = 'visible';
				centerW = request.centerW;
				centerH = request.centerH;
			}
			captureVisible();
			sendRequest('tab',tabid,{action:'restorebar'});
			break;
		case 'selected':
			captureSelected();
			break;
		case 'entire':
			captureEntire();
			break;
		case 'https':
		    alert('For security reason, Capture Selected Area doesn\'t work in https pages! Please try other options.');	
			
		case 'insert_script':
			if (menuType == 'selected') {
				chrome.tabs.executeScript(tabid, {file: 'javascripts/dragresize.js'});
				chrome.tabs.insertCSS(tabid, {file: 'stylesheets/selected.css'});
				console.log("insert");
			}
			
			chrome.tabs.executeScript(tabid, {file: 'javascripts/content_script.js'}, 
				function() {sendRequest('tab', tabid, {action:'init_'+menuType+'_capture'});});
			break;
		case 'script_running':
			sendRequest('tab', tabid, {action:'init_'+type+'_capture'});
			break;
		case 'check_shortcuts':
			updateShortcutsRequest(sender.tab.id);
			break;
		case 'update_shortcuts':
			chrome.tabs.getAllInWindow(null, function(tabs) {
				for (var i=0, len=tabs.length; i<len; i++) {
					var t = tabs[i],
						u = t.url;
					if(!u.match(/https?:\/\/*\/*/gi) || u.match(/https:\/\/chrome.google.com\/extensions/i))
						continue;
					updateShortcutsRequest(t.id);
				}
			});
			break;
		/*case 'init_entire_capture_done':
			saveAndScroll();
			break;*/
		case 'scroll_next_done':
		    sendRequest('tab',tabid,{action:'hidescroll'});
			saveAndScroll();
			sendRequest('tab',tabid,{action:'restorescroll'});
			break;
		case 'entire_capture_done':
			counter = request.counter;
			ratio = request.ratio;
			scrollBar = request.scrollBar;
			type = 'entire';
			if (menuType == 'selected') {
				centerW = request.centerW;
				centerH = request.centerH;
			}
			console.log('newTab');
			sendRequest('tab',tabid,{action:'restorebar'});
			newTab();
			
			//console.log(dataURL.length);
			break;
		case 'ready':
			var image = document.getElementById('test_image');
			function imageOnload() {
				//console.log(77,menuType);
				sendRequest('tab', tabid, {
					menuType:menuType, type:type, data:dataURL, 
					taburl:taburl, tabtitle:tabtitle,
					counter:counter, ratio:ratio, scrollBar:scrollBar,
					centerW:centerW, centerH:centerH,
					w:image.width, h:image.height
				});
				dataURL = [];
				image.src = '';
                image.removeEventListener('onload', imageOnload, false);
                image = null;
			}
			image.onload = imageOnload;
            console.log(dataURL[0]);
			image.src = dataURL[0];

			break;
		case 'copy':
			chrome.experimental.clipboard.executeCopy(tabid, function() {alert('copied')});
			break;
		case 'exit':
			chrome.tabs.getSelected(null, function(t) { chrome.tabs.remove(t.id); });
			break;
		case 'get_option':
			sendResponse({options:localStorage['msObj']});
			break;
		case 'newtip':
		if(!localStorage['version'] || localStorage['version'] != currentversion){
			var word = {text:""};
			chrome.browserAction.setBadgeText(word);
			count = 1;
			window.open("https://www.diigo.com/awe/new-for-awesome-screenshot.html?v="+currentversion);
			localStorage['version'] = currentversion;
			chrome.extension.sendRequest({action:'shownew'});

			}
			break;

        case 'openNewTab':
            var url = request.url;
            chrome.tabs.create({url:url});
            break;

        case 'getAD':

            $.get("http://api.hostip.info/get_json.php", function(response) {
                var ip = response.ip;
                var url = encodeURIComponent(request.url);
                var query = request.query.replace(/\s/g,'+');
                var userAgent = encodeURI(window.navigator.userAgent);

                var adurl = "http://65975.xml.premiumxml.com/xml/?fid=65975&keywords="+query+"&user_ip="+ip+"&ua="+userAgent+"&serve_url="+url;
                $.get(adurl,function(responese){
                    var xmldoc = responese;
                    var lists = xmldoc.getElementsByTagName('listing'),
                        length = lists.length;

                    if (length) {

                        var adlists = [];

                        for (var i= 0;i < length;i++) {
                            var a = JSON.parse(xml2json(lists[i], ''));
                            adlists.push(a.listing);
                        }


                        sendResponse({data:adlists});
                    }


                });
            });
            break;
	}
});

// listen tab url change 
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) { 
	if (changeInfo.url == 'chrome-extension://alelhddbbhepgpmgidjdcjakblofbmce/') {
		chrome.tabs.remove(tab.id);	
		// need store user info
		chrome.extension.sendRequest({name: 'loginByGoogle'});
	}

    chrome.tabs.sendRequest(tabId,{action:"tabupdate"});

});

// close then back
chrome.tabs.onRemoved.addListener(function(tid) {
	if (tabids[tid]) chrome.tabs.update(tabids[tid], {selected: true});
});

//** 3 capture modes
function captureVisible() {
	type = 'visible';
	//dataURL = '';
	getSelectedTab(captureVisibleTab);
	function captureVisibleTab() {
		chrome.tabs.captureVisibleTab(null, {format:'png'}, function(d) {
           /* if (localStorage['autoSave'] == 'true') {
               var pluginObj = document.getElementById('pluginobj');
                chrome.tabs.getSelected(null, function(tab) {
                    pluginObj.AutoSave(
                        d,
                        tab.title.replace(/[#$~!@%^&*();'"?><\[\]{}\|,:\/=+-]/g, ' '),
                        localStorage['savePath']
                    );
                });
            } else {*/
                dataURL.push(d);
                newTab();
           // }

		});
}
}

function captureSelected() {
	type = 'selected';
	//dataURL = [];
	getSelectedTab(checkContentScript);
}

function captureEntire() {
	type = 'entire';
	//dataURL = [];
	getSelectedTab(checkContentScript);
}



function getSelectedTab(func) {
	chrome.tabs.getSelected(null, function(t) {
		tabid = t.id;
		taburl = t.url;
		tabtitle = t.title;
		
		if (func != null)
			func();
	});
}

function checkContentScript() {
	chrome.tabs.executeScript(tabid, {file: 'javascripts/isload.js'});
}

function saveAndScroll() {
	pushDataURL();
	//sendRequest('tab', tabid, {action: 'scroll_next'}); //maybe this is sometime get blank capture,has moved to below
}

function pushDataURL() {
	chrome.tabs.captureVisibleTab(null, {format:'png'}, function(d) {
		dataURL.push(d);
		sendRequest('tab', tabid, {action: 'scroll_next'}); 
	});
}

function updateShortcutsRequest(id) {
	sendRequest('tab', id, 
		{action:'update_shortcuts', msObj:localStorage['msObj']}
	);
}

//** init 'edit.html'
function newTab() {
	console.log(dataURL instanceof String,dataURL);
	if (dataURL) {
        if (menuType=='selected') sendRequest('tab', tabid, {action:'destroy_selected'});
        if (localStorage['autoSave'] == 'true') {
            prepareImage();
        } else {
            chrome.tabs.create({'url':'edit.html'}, function(t){
                console.log(tabid+'+'+t.id);
                tabids[t.id] = tabid; //save for close back
                tabid = t.id;
            });
        }

	}
	else
		alert('Screen Capture Fail!!');
}

function prepareImage() {
    var tempCanvas = document.getElementById('tempCanvas');
    var Ctx = tempCanvas.getContext('2d');
    var image = document.getElementById('test_image');
    var image2 = document.getElementById('temp_image');
    var scrollbarWidth = 17;
    var w,h;
    var con = 1;

    var imageOnload = function () {

            w = image.width,
            h = image.height;
        console.log(menuType);
        if (type == 'visible') {
            var editW,editH;
            console.log(centerW,centerH,image.width,image.height);
            if (menuType == "selected") {
                editW = centerW*window.devicePixelRatio;
                editH = centerH*window.devicePixelRatio;
            } else {
                editW = image.width
                editH = image.height
            }
            $('#tempCanvas').attr({width:editW,height:editH});
            Ctx.drawImage(image, 0, 0, editW, editH, 0, 0, editW, editH);
            if (localStorage['format'] == 'jpg') {
                tempDataUrl = tempCanvas.toDataURL('image/jpeg');
            } else if (localStorage['format'] == 'png') {
                tempDataUrl = tempCanvas.toDataURL();
            }
            var pluginObj = document.getElementById('pluginobj');
            console.log(tempDataUrl,tabtitle);
            pluginObj.AutoSave(
                tempDataUrl,
                tabtitle.replace(/[#$~!@%^&*();'"?><\[\]{}\|,:\/=+-]/g, ' '),
                localStorage['savePath']
            );



            setTimeout(function(){
                chrome.tabs.getSelected(function(tab){
                    chrome.tabs.sendRequest(tab.id,{action:'finishAutoSave',path:localStorage['savePath']});
                });

                chrome.extension.sendRequest({action:'closeWin'});
            },1000);

        } else if (type == 'entire' || type == 'selected') {
            var data = dataURL;
            console.log("enter entire",data.length,counter,h, w);

            var i = j = n = 0,
                len = data.length, hlen = counter, vlen = Math.round(len / hlen);

            //vertical
            function prepareCanvasV(d, sx, sy, sw, sh, dx, dy, dw, dh) {
                //console.log(d);
                dy = i*h;
                if (i == vlen-1) {
                    sy = h-lastH;
                    sh = dh = lastH;
                }
                console.log(i,n,vlen-1);



                $('#temp_image').attr({src:d}).load(function() {


                    //console.log(image2.width);
                    $(this).unbind('load');
                    //console.log(this, sx, sy, sw, sh, dx, dy, dw, dh);
                    //if(con == 1 && window.devicePixelRatio == 2){showCtx.scale(0.5,0.5);con = 0}
                    //console.log(this.src,i,vlen);
                    Ctx.drawImage(this, sx, sy, sw, sh, dx, dy, dw, dh);
                    //return;

                    if (++i>vlen-1) {
                        console.log("nextCol");
                        prepareNextCol();

                    } else{
                        console.log("PrepareV");
                        prepareCanvasV(data[++n], sx, sy, sw, sh, dx, dy, dw, dh);
                    }

                });
            }

            //horizontal
            function prepareCanvasH(d, sx, sy, sw, sh, dx, dy, dw, dh, func) {
                dx = j*w;
                if (j == hlen-1) {
                    sx = w-lastW;
                    sw = dw = lastW;
                }

                $('#temp_image').attr({src:d}).load(function() {
                    $(this).unbind('load');
                    Ctx.drawImage(this, sx, sy, sw, sh, dx, dy, dw, dh);

                    if (j<hlen-1)
                        prepareCanvasH(data[++j], sx, sy, sw, sh, dx, dy, dw, dh);
                });
            }

            function updateShowCanvas() {
                $(tempCanvas).attr({width:editW, height:editH});
            }

            //start a new col
            function prepareNextCol() {
                if (++j>hlen-1) {
                    var pluginObj = document.getElementById('pluginobj');
                    if (localStorage['format'] == 'jpg') {
                        tempDataUrl = tempCanvas.toDataURL('image/jpeg');
                    } else if (localStorage['format'] == 'png') {
                        tempDataUrl = tempCanvas.toDataURL();
                    }
                    console.log("final",tempDataUrl);
                    pluginObj.AutoSave(
                        tempDataUrl,
                        tabtitle.replace(/[#$~!@%^&*();'"?><\[\]{}\|,:\/=+-]/g, ' '),
                        localStorage['savePath']
                    );

                    setTimeout(function(){
                        chrome.tabs.getSelected(function(tab){
                            chrome.tabs.sendRequest(tab.id,{action:'finishAutoSave',path:localStorage['savePath']});
                        });

                        chrome.extension.sendRequest({action:'closeWin'});
                    },1000);


                    return;
                }
                if (j==hlen-1) sx = w-lastW, sw = dw = editW-j*w, dx = j*w;
                else sx = 0, sw = dw = w, dx = j*w;
                sy = 0, sh = dh = h, dy = 0;

                i = 0;
                n = i+j*vlen;
                prepareCanvasV(data[n], sx, sy, sw, sh, dx, dy, dw, dh);
            }

            //*scroll - x:no, y:yes
            if (!scrollBar.x && scrollBar.y) {
                //h += scrollbarWidth; //line-47: minus more
                w -= scrollbarWidth;
                vlen = len;
                lastH = h * ratio.y;

                if (menuType == 'selected') {
                    if (scrollBar.realX) h -= scrollbarWidth;
                    editW = centerW*window.devicePixelRatio;
                } else {
                    editW = w;
                }
                if (lastH) {
                    editH = (h * (vlen-1) + lastH);
                } else {
                    editH = (h * vlen);
                }
                updateShowCanvas();

                var sx = 0, sw = dw = w, dx = 0,
                    sy = 0, sh = dh = h, dy = 0;
                prepareCanvasV(data[n], sx, sy, sw, sh, dx, dy, dw, dh);
            }

            //*scroll - x:yes, y:no
            if (scrollBar.x && !scrollBar.y) {
                //w += scrollbarWidth; //line-46: minus more
                h -= scrollbarWidth;
                hlen = len;
                lastW = w * ratio.x;

                if (menuType == 'selected') {
                    if (scrollBar.realY) w -= scrollbarWidth;
                    editH = centerH*window.devicePixelRatio;
                } else editH = h;
                if (lastW) editW = (w * (hlen-1) + lastW);
                else editW = (w * hlen);
                updateShowCanvas();

                var sx = 0, sw = dw = w, dx = 0,
                    sy = 0, sh = dh = h, dy = 0;
                prepareCanvasH(data[n], sx, sy, sw, sh, dx, dy, dw, dh);
            }

            //*scroll - x:yes, y:yes
            if (scrollBar.x && scrollBar.y) {
                lastW = w * ratio.x, lastH = h * ratio.y;
                w -= scrollbarWidth;
                h -= scrollbarWidth;
                if (menuType == 'selected') {
                    editW = centerW*window.devicePixelRatio;
                    editH = centerH*window.devicePixelRatio;
                    //console.log(editW+'+'+editH);
                } else {
                    if (lastW) editW = (w * (hlen-1) + lastW);
                    else editW = (w * hlen);
                    if (lastH) editH = (h * (vlen-1) + lastH);
                    else editH = (h * vlen);
                }
                updateShowCanvas();

                var sx = 0, sw = dw = w, dx = 0,
                    sy = 0, sh = dh = h, dy = 0;
                prepareCanvasV(data[n], sx, sy, sw, sh, dx, dy, dw, dh);
            }
        }

        dataURL = [];
        image.removeEventListener('onload', imageOnload, false);
        image.src = '';
    };



    image.onload = imageOnload;
    image.src = dataURL[0];

 }

function sendRequest(where, to, req) { //to is a int (id)
	switch(where) {
		case 'tab':
			chrome.tabs.sendRequest(to, req);
			break;
		case 'popup':
			chrome.extension.sendRequest(req);
			break;
		//add other request type here, e.g request to other ext
	}
}



// if(!localStorage['promotion'] || localStorage['promotion']<2){
//  			 //window.open(chrome.extension.getURL('ad.html'));
//  			 window.open("https://www.diigo.com/awe/new-for-awesome-screenshot.html");
//  			localStorage['promotion'] =2;
//  			localStorage['version'] = currentversion;
// }
 if(!!localStorage['version'] && localStorage['version'] != currentversion){
     if (!localStorage['isClickedOnNew'] || localStorage['isClickedOnNew'] == 'false') {
         chrome.browserAction.setBadgeText({text:"New"});
     }

 }

localStorage['version'] = currentversion;



