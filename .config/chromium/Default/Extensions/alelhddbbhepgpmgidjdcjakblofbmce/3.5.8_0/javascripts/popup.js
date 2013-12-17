$(document).ready(function() {

    chrome.tabs.getSelected(window.id,function(tab){
        chrome.browserAction.getBadgeText({tabId:tab.id},function(text){
            if(text == 'New'){
                chrome.browserAction.setBadgeText({text:""});
                chrome.tabs.create({url:'https://www.diigo.com/awe/new-for-awesome-screenshot.html'});
                localStorage['isClickedOnNew'] = 'true';
                window.close();
            }
        });
    });
	
    //sendRequest({action:'newtip'});
    var url, enableSelected = true;
   
	i18n();

    addShortcut();
	
	chrome.windows.getCurrent(function(window) {
		chrome.tabs.getSelected(window.id, function(tab) {
			url = tab.url;
			var m = url.match(/https?:\/\/*\/*/gi);
			//alert(m);
			//alert(chrome.i18n.getMessage('disableEntireTitle'));
			if ( m == null || url.match(/https:\/\/chrome.google.com\/extensions/i) ) 
				$('#entire, #selected').attr({title:chrome.i18n.getMessage('disableEntireTitle')})
					.css({color:'#909090'}).unbind('click');
			if (tab.status!='complete') {
				$('#selected').attr({title:'Page still loading! Please wait.'})
					.css({color:'#909090'});
				enableSelected = false;
			}
			// if (tab.status=='complete' && url.match(/https:\/\/*\/*/gi)) {
			// 	$('#selected').attr({title:'For security reason, Capture Selected Area doesn\'t work in https pages!' })
			// 		.css({color:'#909090'});
			// 	enableSelected = false;
			// }
			
			if (!/http|https|file|ftp/.test(url.slice(0,5))) {
				$('#visible').css({color:'#909090'}).unbind('click');
			}
		});
	});

	chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
		switch(request.action) {
		case 'enable_selected':
			if (url.match(/https:\/\/*\/*/gi)) {
				$('#selected').attr({title:'For security reason, Capture Selected Area doesn\'t work in https pages!' });
				return;
			}
			enableSelected = true;
			$('#selected').attr({title:''}).css({color:'#000'});
			break;
			/* case 'script_not_running':
				//$('ul').hide().next('#capturing').hide();
				$('#script_off').siblings().hide().end().show().find('a').click(function() {
					//$('ul').show('slow');
					sendRequest({action:'reload_tab'});
					window.close();
					//$('#script_off').hide('fast');
				});
				break; */
			case 'shownew':
			 window.close();
			 break;

            case 'closeWin':
                window.close();
                break;
		}
	});

	$('a').click(function() {
		var id = this.id;
		
		if (id=='visible') {
			if (navigator.appVersion.indexOf('Chrome/11')!=-1 &&
				/^file:\/\/*/.test(url)) {
				
				alert('You can\'t capture local page\'s in Chrome beta!');
			}
			else {
				sendRequest({action:id});
			}
			window.close();
		}
		if (id == 'entire') {
			capturing();
			sendRequest({action:id});
			capturing();
			//alert("a");
			//window.close();
		}
		if (id == 'selected') {
			if (enableSelected) {
				window.close();
				sendRequest({action:id});
			} else {
				sendRequest({action:'https'});
				//alert('For security reason, Capture Selected Area doesn\'t work in https pages! Please try other options.');
			}
			window.close();
		}

        if (id == 'option') {
            var url = chrome.extension.getURL('') + "options.html";
            chrome.tabs.create({url:url});
            window.close();
        }

        if (id == 'help') {
            var url = chrome.extension.getURL('') + "help.html";
            chrome.tabs.create({url:url});
            window.close();
        }
		
		
		//window.close();
	});
	
	/*function msg(key) {
		document.write(chrome.i18n.getMessage(key));
	}*/

    function addShortcut () {
        if (localStorage['msObj']) {
            var obj = JSON.parse(localStorage['msObj']);

            var visibleKey = obj.visible.enable == true ? 'Ctrl+Shift+' + obj.visible.key : 'Not set';
            var selectedKey = obj.selected.enable == true ? 'Ctrl+Shift+' + obj.selected.key : 'Not set';
            var entireKey = obj.entire.enable == true ? 'Ctrl+Shift+' + obj.entire.key : 'Not set';

            $('#visible').find('.shortcut').remove().end().append("<span class='shortcut'>"+visibleKey+"</span>");
            $('#selected').find('.shortcut').remove().end().append("<span class='shortcut'>"+selectedKey+"</span>");
            $('#entire').find('.shortcut').remove().end().append("<span class='shortcut'>"+entireKey+"</span>");
        }
    }
	
	function i18n() {
		$('.i18n').each(function() {
			var a = this;
			var id = a.id;
			$(a).html(chrome.i18n.getMessage(id.replace(/-/, '')));
		});
		$('.title').each(function() {
			var a = this;
			var id = a.id;
			$(a).attr({title:chrome.i18n.getMessage(id.replace(/-/, '')+'_title')});
		});
	}
	
	function capturing() {
		$('ul').remove();
		$('#capturing').fadeIn('slow');
	}

	function sendRequest(r) {
		chrome.extension.sendRequest(r);
	}
});

