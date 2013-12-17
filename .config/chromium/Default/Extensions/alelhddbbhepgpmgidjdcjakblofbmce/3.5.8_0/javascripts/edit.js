	var showCanvas; //var for cga.js
	var isPngCompressed = false; 
	var isSavePageInit = false;

	var offsetX, offsetY; //edit-area coordinates to document
	var editW, editH; //edit-area dimension
	var scrollbarWidth = 17; //scrollbar width
	var $editArea;
	var actions = [];
	var initFlag = 1;//edit page init state, use to indicate the start state in 'undo' function
	var requestFlag = 1;//init only once
	var textFlag = 1;//use for text input
	var uploadFlag = false;//use for uploading state
	
	var showCanvas, showCtx, drawCanvas, drawCtx;
	var drawColor = 'red';
	var taburl, tabtitle;
	var compressRatio = 80, resizeFactor = 100;
	var shift = false;
	var isGASafe = BrowserDetect.OS == 'Windows' || BrowserDetect.OS == 'Linux';
	var gDriveConfig = {
  			client_id: '250015934524.apps.googleusercontent.com',
  			client_secret: '0tL3OG9PhS_I7Zqp_8uH5qPl',
  			api_scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email'
		};


	var googleAuth = new OAuth2('google', gDriveConfig);

    // for promotion container size
    window.addEventListener('message',function(e){
       if (e.data.action == 'adjustPromotionSize') {
           $('#promotion-container').css({width: e.data.width,height: e.data.height});
           $('#promotion-container iframe').css({width: e.data.width,height: e.data.height});
       } else if (e.data.action == 'removeBanner') {
           $('#promotion-container-bottom').hide();
       }
    });
	
	function prepareEditArea(request) {

		var menuType = request.menuType;
		var type = request.type;
		var data = request.data;
		taburl = request.taburl;
		tabtitle = request.tabtitle;
		getEditOffset();
		//getInitDim();

		// for fix in retina display
		window.con = 1;
	    window.con2 = 1;
		
		scrollbarWidth = getScrollbarWidth();

		var w = request.w, 
			h = request.h; 
		switch(type) {
		case 'visible':
			$('#save-image').attr({src:data[0]}).load(function() { 
				if (menuType=='selected') {
					editW = request.centerW*window.devicePixelRatio;
					editH = request.centerH*window.devicePixelRatio;
					updateEditArea();
					updateShowCanvas();
					getEditOffset();
					addMargin();
					getEditOffset();
				} else {
					editW = (w-scrollbarWidth)/*/window.devicePixelRatio*/;
					editH = (h-scrollbarWidth)/*/window.devicePixelRatio*/;
					//editW = w;
					//editH = h;
					updateEditArea();
					updateShowCanvas();
				}
				w = editW;
				h = editH;
				
				showCtx.drawImage(this, 0, 0, w/**window.devicePixelRatio*/, h/**window.devicePixelRatio*/, 0, 0, w, h);
				$(this).unbind('load');
			});
			break;
		case 'entire':
			var counter = request.counter,
				ratio = request.ratio,
				scrollBar = request.scrollBar;
			
			var i = j = n = 0,
				len = data.length, hlen = counter, vlen = Math.round(len / hlen);

			
			//If we put prepareCanvasV, prepareCanvasH and prepareNextCol at this case's bottom,
			//we will get undefined error when we call these functions in compressed 
			//code which is compiled by Google Closure Compiler.
			
			//vertical 
			function prepareCanvasV(d, sx, sy, sw, sh, dx, dy, dw, dh) {
				console.log(d);
				dy = i*h;
				if (i == vlen-1) {
					sy = h-lastH;
					sh = dh = lastH;
				}
				console.log(i,vlen-1,sy,sh,dy);
				
				$('#save-image').attr({src:d}).load(function() { 
					$(this).unbind('load');
					console.log(this, sx, sy, sw, sh, dx, dy, dw, dh);
					//if(con == 1 && window.devicePixelRatio == 2){showCtx.scale(0.5,0.5);con = 0}
					showCtx.drawImage(this, sx, sy, sw, sh, dx, dy, dw, dh);
					//return;
					
					if (++i>vlen-1)
						prepareNextCol();
					else 
						prepareCanvasV(data[++n], sx, sy, sw, sh, dx, dy, dw, dh);
				});
			}
			
			//horizontal
			function prepareCanvasH(d, sx, sy, sw, sh, dx, dy, dw, dh, func) {
				dx = j*w;
				if (j == hlen-1) {
					sx = w-lastW;
					sw = dw = lastW;
				}
				
				$('#save-image').attr({src:d}).load(function() { 
					$(this).unbind('load');
					showCtx.drawImage(this, sx, sy, sw, sh, dx, dy, dw, dh);
					
					if (j<hlen-1) 
						prepareCanvasH(data[++j], sx, sy, sw, sh, dx, dy, dw, dh);
				});
			}
			
			//start a new col
			function prepareNextCol() {
				if (++j>hlen-1) return;
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
					editW = request.centerW*window.devicePixelRatio;
				} else editW = w;
				if (lastH) editH = (h * (vlen-1) + lastH);
				else editH = (h * vlen);
				updateEditArea();
				updateShowCanvas();
				getEditOffset();
				addMargin();
				getEditOffset();
				
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
					editH = request.centerH*window.devicePixelRatio;
				} else editH = h;
				if (lastW) editW = (w * (hlen-1) + lastW);
				else editW = (w * hlen);
				updateEditArea();
				updateShowCanvas();
				$editArea.addClass('add-margin');
				getEditOffset();
				
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
					editW = request.centerW*window.devicePixelRatio;
					editH = request.centerH*window.devicePixelRatio;
					//console.log(editW+'+'+editH);
				} else {
					if (lastW) editW = (w * (hlen-1) + lastW);
					else editW = (w * hlen);
					if (lastH) editH = (h * (vlen-1) + lastH);
					else editH = (h * vlen);
				}
				updateEditArea();
				updateShowCanvas();
				
				var sx = 0, sw = dw = w, dx = 0,
					sy = 0, sh = dh = h, dy = 0;
				prepareCanvasV(data[n], sx, sy, sw, sh, dx, dy, dw, dh);
			}
			
			break;
		}
	}
	
	function prepareTools() {//change
		//console.log('ready');
		$('#exit').click(function() {
			chrome.extension.sendRequest({action:'exit'});
		})
		$('#tool-panel>div').click(function(e) {
			var target = getTarget(e.target);
			if (target.nodeName == 'DIV') 
				return;
			tool(target.id);
			
			function getTarget(t) {
				var node = t.nodeName;
				if (node != 'A' && node != 'DIV') { 
					t = t.parentNode;
					getTarget(t);
				}
				return t;
			}
		});
		
		/*shortcuts
		if (localStorage['shortcuts']) bindShortcuts();
		*/	
	}
	
	function preparePromote() {
		$('#promote').click(function(e) {
			$(this).disableSelection();
			if (e.target.tagName != 'A')
			$(this).toggleClass('expanded')
				.find('#content').toggle();
		});
	}
	
	function bindShortcuts() {
		//*****bind annotate shortcut
		var ctrl = false;
		$('body').keydown(function(e) {
			var id = '';
			switch(e.which) {
			case 83://Save
				id = 'save';
				break;
			case 67://Crop
				id = 'crop';
				break;
			case 82://Rectangle
				id = 'rectangle';
				break;
			case 69://Ellipse
				id = 'ellipse';
				break;
			case 65://Arrow
				id = 'arrow';
				break;
			case 76://Line
				id = 'line';
				break;
			case 70://Free Line
				id = 'free-line';
				break;
			case 66://Blur
				id = 'blur';
				break;
			case 84://Text
				//$(this).unbind('keydown');
				id = 'text';
				break;
			case 17://Ctrl
				ctrl = true;
				break;
			case 90://Undo/Z
				if (ctrl) {
					id = 'undo';
				}
				break;
			case 16://Draw shape/Shift
				shift = true;
				break;
			case 13://Done/Enter
				id = 'done';
				break;
			case 27://Cancel/Esc
				id = 'cancel';
				break;
			}
			
			if (id) {
				if (!$('body').hasClass('selected')) {
					tool(id);
				} else {
					if (id == 'done' || 'cancel') 
					tool(id);
				}
				if (id != 'undo')
					ctrl = false;
			}
		}).keyup(function(e) {
			switch(e.which) {
			case 16://Shift
				shift = false;
				break;
			}
		});
	}
	
	function tool(id) {
		//save draw action
		if (drawCanvas.width * drawCanvas.height != 0 && id != 'color' && id != 'done' && id != 'cancel') {
			if (id == 'undo') {
				if ($('body').hasClass('draw_free_line')) 
					undo();
				else
					$(drawCanvas).attr({width:0, height:0}).unbind().css({'left':0,'top':0}); 
					
				if (actions.length == 0) 
					disableUndo(); 
				return; 
			}
			
			if (!$('body').hasClass('draw_free_line')) {
				saveAction({type:'draw'});
				showCtx.drawImage(drawCanvas, parseInt($(drawCanvas).css('left')), parseInt($(drawCanvas).css('top')));
			}
			$(drawCanvas).attr({width:0, height:0});
		}
		
		if (id != 'color') {
			saveText();
			if(id != 'undo' && id != 'resize') {
				$('#temp-canvas').remove();
				$('body').removeClass('justCropped draw draw-text draw-blur');
			}
		}
		updateBtnBg(id);
		
		switch (id) {
			case 'save': save(); break;
			case 'crop': crop(); break;
			case 'color': color(); break;
			case 'done': done(); break;
			case 'cancel': cancel(); break;
			case 'resize': 
				$('#resize select').unbind().change(function(e) {
					resize(this.value);
				}); 
				break;
			case 'undo': undo(); break;
			default: draw(id); break;
		}
	}
	
	function i18n() {//need refinement
		/*$('#tool-panel .tip').each(function(i) {
			$(this).text(chrome.i18n.getMessage('tip'+(i+1)));
		});*/
		$('#logo').text(chrome.i18n.getMessage('logo'));
		$('title').text(chrome.i18n.getMessage('editTitle'));
		document.getElementById('save').lastChild.data = chrome.i18n.getMessage('saveBtn');
		document.getElementById('done').lastChild.data = chrome.i18n.getMessage('doneBtn');
		document.getElementById('cancel').lastChild.data = chrome.i18n.getMessage('cancelBtn');
		document.getElementById('save_button').lastChild.data = chrome.i18n.getMessage('save_button');
		$('.title').each(function() { $(this).attr({title:chrome.i18n.getMessage(this.id.replace(/-/, ''))}); });
		$('.i18n').each(function() { $(this).html(chrome.i18n.getMessage(this.id.replace(/-/, ''))); });
		//v2.4 - share tooltip
		$('#share')[0].innerHTML += '<div class="tip">[?]<div>Images hosted on <a href="http://awesomescreenshot.com" target="_blank">awesomescreenshot.com</a></div></div>';
	}
	
	function save() {//change
		$('.content>.as, .content>.as').removeAttr('style');
		//$('#privacy').attr('checked', 'checked');
		$('#saveOnline .content .diigo input[name=title]').val(tabtitle);
		
		document.body.scrollTop = 0;
		$('#save-tip').hide();
		$('#image_loader').css({display:'inline-block'});
		$('#save-image, #re-edit').css({visibility:'hidden'}); 
		$('body').removeClass('crop draw-text').addClass('save');
		$('#save').removeClass('active');
		
		$('#show-canvas').toggle();
		$('#draw-canvas').attr({width:0, height:0});
		$('#share+dd').html(chrome.i18n.getMessage('savedShareDesc')); //clear the share button
		$('#upload').parent().html($('#upload')[0].outerHTML); //v2.4 - for clean interface
		$($editArea).enableSelection();
				
		//bind save button
//		$('#save_button').unbind().click(function() {
//			$('#pluginobj')[0].SaveScreenshot(
//			  $('#save-image')[0].src, 
//			  tabtitle.replace(/[�?$~!@%^&*();\'\"?><\[\]{}\|,:\/=+—�?”�?]/g, ' '), 				//filename			  
//			  '', 						//save directory 
//			  function(success) {
//				
//			  }, 
//			  'Save Image To' 			//prompt window title
//			);
//		});
		
		//bind upload button
		$('#upload').unbind().click(uploadImage);
		
		//bind re-edit 
		$('#re-edit').unbind().text(chrome.i18n.getMessage('reEdit')).click(function() {

			if(uploadFlag == true){
				$('#uploadingWarning').jqm().jqmShow();
				return;
			}
			// checkbox box
			//$('#privacy').removeAttr('checked');
			$('#saveOnline .content .diigo input[name=title]').val('');
			
			$('body').removeClass('save');
			$('#show-canvas').toggle();
			$($editArea).disableSelection();
			$('#share+dd div').hide();
			$('#save_local+dd>p').hide();

			$('#gdrive-share-link').hide();
			$('.sgdrive .saveForm').show();



		});
		
		//canvas to base64
		var imageData = '';
		
		setTimeout(prepareImage, 100);
		function prepareImage() {
			function prepareOptions() {
				$('#image_loader').hide();
				$('#save-image, #re-edit').css({visibility:'visible'});
				$('#save-tip').show();
			}
			
			/* function compress() {
				var CanvasPixelArray = showCtx.getImageData(0,0,editW,editH);
				var myThreadedEncoder = new JPEGEncoderThreaded('javascripts/jpeg_encoder_threaded_worker.js');
				myThreadedEncoder.encode(CanvasPixelArray, 100, buildImage, true);
			} */
			
			function buildImage(image) {
				if ($('#save-image')[0].src != image)
					$('#save-image').attr({src:image}).load(function() {
						$(this).css({width:'auto'});
						if (this.width>=parseInt($('#save_image_wrapper').css('width')))
							$(this).css({width:'100%'});
							
						prepareOptions();
						$(this).unbind();
					});
				else 
					prepareOptions();
			}
			
			/* if (localStorage['format'] && localStorage['format']=='jpg')
				compress();
			else  */
            if (localStorage['format'] =='jpg') {
                imageData = showCanvas.toDataURL('image/jpeg');
            } else {
                imageData = showCanvas.toDataURL();
            }

			buildImage(imageData);
			
			// send image data to background, then to flash.
			chrome.extension.sendRequest({action:'return_image_data',
				data: imageData.replace(/^data:image\/(png|jpeg);base64,/, ""),
				title: tabtitle.replace(/[#$~!@%^&*();'"?><\[\]{}\|,:\/=+-]/g, ' ')
			});
		}
		
		
		
		
		/* switch (localStorage['format']) {
		case 'png': 
			if (editW*editH<2170000) {
				setTimeout(buildImage, 300, showCanvas.toDataURL());
			} else {
				setTimeout(compress, 300);
				$('p', $('#save_local').next('dd')).show();
				isPngCompressed = true;
			}
			break;
		case 'jpg':
		default:
			compressRatio = editW*editH<2170000 ? 100 : 80;
			setTimeout(compress, 300); 
			break;
		}
		
		function compress() {
			var CanvasPixelArray = showCtx.getImageData(0,0,editW,editH);
			var myThreadedEncoder = new JPEGEncoderThreaded('javascripts/jpeg_encoder_threaded_worker.js');
			myThreadedEncoder.encode(CanvasPixelArray, compressRatio, buildImage, true);
			compressRatio = 80;
		} */
		
		function uploadImage() {
			//$('.content>.as').hide('fast');
			
			var src = $('#save-image').attr('src').replace(/^data:image\/(png|jpeg);base64,/, ""),
				manuelAbort = 0; //if ajax is aborted manuelly(1) or connect fault(0)
			//prepare data
			var cmd = 'imageUpload',
				pv = '1.0',
				ct = 'chrome',
				cv = getLocVersion(),
				postData = {
					src_url: taburl,
					src_title: tabtitle,
					image_md5 : $.md5(src),
					image_type: 'jpg',
					image_content: src
				},
				host = 'http://awesomescreenshot.com/client?';
			
			//post
			var ajaxObj;
			function postAjax() {
				if (localStorage['format'] && !isPngCompressed) //if image compressed, make it default to 'jpg'
					postData.image_type = localStorage['format'];
			
				ajaxObj = $.ajax({
					url: host+ 'cmd='+cmd+ '&pv='+pv+ '&ct='+ct+ '&cv='+cv,
					type: 'POST',
					data: JSON.stringify(postData),
					timeout: 300000,
					dataType: 'json',
					contentType: 'text/plain; charset=UTF-8',
					beforeSend: function() {
						$('#saveOnline .content').hide('fast');
						$('#legacySave').show();
						$('#loader').fadeIn('slow');
/*
						$('#upload').parent().hide('fast');
						$('#loader').fadeIn('slow').find('a').unbind('click').click(abortUpload);
*/
					},
					error: function(request, textStatus, errorThrown) {
						errorHandle();
					},
					success: function(data, textStatus, request) {
						
						$('#loader').hide();
						
						if (request.status == 200 && data.code == 1) {
							showShare(data.result.url);
							
							//track upload success time
							if (isGASafe) {
								_gaq.push(['_trackEvent', 'SavePageActions', 'upload_success', 'time']);
							}
						} else {
							errorHandle(); //when aborted, else been called
						}
					},
					complete: function(XMLHttpRequest, textStatus) {
					}
				});
			}
			postAjax();
			
			function showShare(imageURL) {
				$('#share-button, #email-link').show('slow')
				.click(function(e) {
					var t = e.target;
					$(t).addClass('visited');
				})
				.find('a').each(function() {
					var t = this;
					if (t.id == 'buzz') 
						t.href += 'message='+encodeURI(tabtitle)+'&url='+encodeURI(taburl)+'&imageurl='+imageURL;
					if (t.id == 'twitter') 
						t.href = 'http://twitter.com/share?url='+encodeURIComponent(imageURL)+'&via=awe_screenshot&text='+tabtitle;
					else 
						$(t).attr({href:t.href + imageURL});
				});
				
				$('#share-link').show('slow')
					.find('input[type="text"]').attr({value:imageURL}).bind('mouseup', function() {
						$(this).select();
						/* if (BrowserDetect.OS != 'Linux') {
							document.execCommand('Copy');
							$(this).next().show();
						} */
						//chrome.extension.sendRequest({action:'copy'});
						
					});
			}
			
			function errorHandle() {
				$('#loader').hide('fast');
				if (!manuelAbort) {
					$('#error').show().find('#retry').unbind('click').click(function() {
						$('#error').hide();
						$('#loader').show().find('a').unbind('click').click(abortUpload);
						postAjax();
					});
				}
			}
			
			function abortUpload() {
				manuelAbort = 1;
				ajaxObj.abort();
				$('#upload').parent().siblings().hide('fast').end().fadeIn('slow');
				manuelAbort = 0;
			}
			
			window.showShare = showShare;
			window.errorHandle = errorHandle;
			window.abortUpload = abortUpload;
		}
		
		// v3.0 - upload to diigo.com
		window.uploadImageToAS = uploadImage;
		if (!isSavePageInit) {
			SavePage.init();
			isSavePageInit = true;
		}
		
	}
	var cflag = 0;	
	function crop() {
		//disableEraser();
		$('body').addClass('selected');
		cflag = 1;
		$('body').removeClass('draw').addClass('crop');
		//$('#center').css({'outline':'none'});
		getEditOffset();
		$(showCanvas).unbind('mousedown click');
		$('#draw-canvas').css({ 'left': '0px', 'top': '0px' ,'cursor':'crosshair'}).unbind();
		drawCanvas.height = showCanvas.height;
        drawCanvas.width = showCanvas.width;
        if(cflag = 1){
        drawCtx.fillStyle = 'rgba(80,80,80,0.4)';
		drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
	    }
	    cflag = 0;
        //console.log("dddd");
		var sx, sy, //start coordinates
			mx, my, //move coordinates
			cw, ch, //center dimension
			dflag = mflag = 0; //mousedown and mousemove flag
		var $cropTip = $('#crop-tip'),
			$cropSize = $('#crop_size').hide();
		var winH;
			
		$('#draw-canvas')
			.hover(function() {
				    //console.log('aa');
					//$(this).css({cursor:'crosshair'});
					$cropTip.text(chrome.i18n.getMessage('cropTip')).show();
				}, function(e) {
					$cropTip.hide();
				})
			.mousedown(function(e) {
				//if (e.button != 0) return;
				//console.log('dd');
				$cropTip.hide();
				$cropSize.fadeIn('slow');
				//$('#center').css({'outline':'1px dashed #777'});
				sx = e.pageX-offsetX;
				sy = e.pageY-offsetY;
				placeCropSize();
				winH = window.innerHeight;
				dflag = 1;
				$('#cropdiv').css({'outline':'1px dashed #777'});
			})
			.mousemove(function(e) {
				mx = e.pageX-offsetX;
				my = e.pageY-offsetY;

				drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
				drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
				drawCtx.clearRect(sx, sy, mx - sx, my - sy);
				autoScroll(e);
				
				if (dflag) {
					cw = mx - sx;
					ch = my - sy;
					mflag = 1;
					//updateHelper();
					updateCropSize(cw,ch);
					return;
				}
				$cropTip.css({top:(my+5)+'px', left:(mx+5)+'px'});
			})
			.mouseup(function(e) {
				if (mflag) {
					$('body').addClass('selected');/*.keydown(function(e) {
						if (e.which == '27') {
							cancel();
							$(this).unbind('keypress');
						}
					});*/
			        //$('#helper').addClass('changed');
					ex = e.pageX - offsetX;
					ey = e.pageY - offsetY;
					$(this).unbind();
					dflag = mflag = 0;
					var ssx = sx < ex ? sx : ex;
					var ssy = sy < ey ? sy : ey;
					var cropwidth = Math.abs(ex - sx);
					var cropheight = Math.abs(ey - sy);
					//cw = Math.abs(cw);
					//ch = Math.abs(ch);
					$('#cropdiv').css({ 'left': ssx, 'top': ssy, 'width': cropwidth, 'height': cropheight,'display':'block'});
					bindCenter();
					//$('#draw-canvas').unbind();

				}
			});
		
		function bindCenter() {
			//use dragresize.js instead of jquery ui method
			// var center =document.getElementById("center");
			// var helper = document.getElementById("helper");
			var edit_area = document.getElementById('edit-area');
			//var helperW = helper.offsetWidth;
			//var helperH = helper.offsetHeight;


			dragresize = new DragResize('dragresize', {/*zIndex: 999,*/maxLeft:editW,maxTop:editH});
			//console.log('here');		
			dragresize.isElement = function(elm) {
			if (elm.className && elm.className.indexOf('drsElement') > -1) return true;
			};
			dragresize.isHandle = function(elm) {
			if (elm.className && elm.className.indexOf('drsMoveHandle') > -1) return true;
			};

			dragresize.apply(edit_area);
			//$('#cropdiv').css({ 'left': ssx, 'top': ssy, 'width': cropwidth, 'height': cropheight,'display':'block' });
			dragresize.select(cropdiv); 


			var cropdiv_top, cropdiv_left, cropdiv_width, cropdiv_height;
		    drawCtx.fillStyle = 'rgba(80,80,80,0.4)';		
			dragresize.ondragmove = function(isResize, ev){
			    cropdiv_top = parseInt($('#cropdiv').css('top'));
		        cropdiv_left = parseInt($('#cropdiv').css('left'));
		        cropdiv_width = parseInt($('#cropdiv').css('width'));
		        cropdiv_height = parseInt($('#cropdiv').css('height'));
				drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
		        drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
		        drawCtx.clearRect(cropdiv_left, cropdiv_top, cropdiv_width, cropdiv_height);
				//$('#helper').removeClass('changed');
				//$('#helper').addClass('changing');
				
				//$('#draw-canvas').unbind();
				// $('#top').css({'background-color': 'rgba(0, 0, 0, 0)'});
				// $('#bottom').css({'background-color': 'rgba(0, 0, 0, 0)'});
				// $('#right').css({'background-color': 'rgba(0, 0, 0, 0)'});
				// $('#left').css({'background-color': 'rgba(0, 0, 0, 0)'});	
				placeCropSize(cropdiv_top);
				updateCropSize(cropdiv_width,cropdiv_height)
				//updateHelper();
				autoScroll(ev);
				//console.log("update");
					
					
					
				};

			dragresize.ondragend = function(isResize) { 
    
                 //$('#helper').removeClass('changing');
                 //$('#helper').addClass('changed');
                

			};	
			
			/*//drag
			$.Draggable('#center', {
				beforeDrag: function(e) {
					if (e.target.id == 'crop_size') e.undraggable = true;	
				},
				onDrag: function(l, t, ox, oy) {
					sx = l + ox;
					sy = t + oy;
					placeCropSize();
					updateHelper();
				},
				afterDrag: function() {
					sx<0 ? sx=0 : '';
					sy<0 ? sy=0 : '';
					sx+cw>editW ? sx=editW-cw : '';
					sy+ch>editH ? sy=editH-ch : '';
					if (sx*sy*(sx+cw-editW)*(sy+ch-editH) == 0) updateHelper();
				}
			});
			
			//resize
			$('#center').disableSelection()
				.resizable({
					resize: function(e, ui) {
						sx = ui.position.left-document.body.scrollLeft;
						sy = ui.position.top;
						cw = ui.size.width;
						ch = ui.size.height;
						
						autoScroll(e);
						updateHelper();
						updateCropSize();
						placeCropSize();
					},
					stop: function(e, ui) {
						sx = ui.position.left;
						sy = ui.position.top;
						cw = ui.size.width;
						ch = ui.size.height;
						if (sx<0) {
							cw+=sx;
							sx=0;
						}
						if (sy<0) {
							ch+=sy;
							sy=0;
						}
						if (sx+cw>editW) {
							cw=editW-sx;
						}
						if (sy+ch>editH) {
							ch=editH-sy;
						}
						updateHelper();
						updateCropSize() 
					},
					handles: 'all'
				});*/
		}
		
		function updateHelper() {
			$('#top').width((cw>=0) ? (sx+cw) : sx).height((ch>=0) ? sy : (sy+ch));
			$('#right').width((cw>=0) ? (editW-sx-cw) : (editW-sx)).height((ch>=0) ? (sy+ch) : sy);
			$('#bottom').width((cw>=0) ? (editW-sx) : (editW-sx-cw)).height((ch>=0) ? (editH-sy-ch) : (editH-sy));
			$('#left').width((cw>=0) ? sx : (sx+cw)).height((ch>=0) ? (editH-sy) : (editH-sy-ch));
			$('#center').width(Math.abs(cw)).height(Math.abs(ch)).css({'left':((cw>=0) ? sx : (sx+cw)) + 'px', 'top':((ch>=0) ? sy : (sy+ch)) + 'px'});
		}
		
		function placeCropSize(top) {
			top<30 ? $cropSize.css({top:'5px'}) : $cropSize.css({top:'-25px'});
		}
		
		function updateCropSize(w,h) {
			$cropSize.html(Math.abs(w)+' X '+Math.abs(h));
		}
		
		function autoScroll(e) {
			var clientY = e.clientY;
			var restY = winH - clientY;
			if (clientY<80) document.body.scrollTop -= 25;
			if (restY<40) document.body.scrollTop += 60-restY; 
		}
	}
	function color() {
		//disableEraser();
		$('#color').find('ul').fadeIn()
			.hover(function(e) {$(this).show(); e.stopPropagation();}, function(e) {$(this).fadeOut(300);})
			.click(function(e) {
				var bgColor = $(e.target).css('background-color');
				$(this).prev('span').css({'background-color':bgColor});
				drawColor = bgColor;
				if ($('#text').hasClass('active')) {
					$('div[contenteditable]').css({'color':drawColor});
				}
				//$(this).hide();
				e.stopPropagation();
			});
	}
	function resize(value) {
		var relFactor = parseInt(value),  //absolute, relative factor
			absFactor = relFactor / 100;
		var imageData = showCtx.getImageData(0, 0, editW, editH);
		//var t = 'resize';
		
		//if ($('body').hasClass('justCropped')) t = 'crop';
		//if ($('body').hasClass('draw')) t = 'draw';
		$('body').removeClass('draw draw-text draw-blur');
		saveAction({type:'resize', data:imageData, relFactor:relFactor/*, absFactor:absFactor*/});
		
		var len = actions.length;
		if (len>1) {
			for (var i=len-1; i>=0; i--) {
				var action = actions[i];
				var type = action.type;
				
				if (type == 'resize' && (i == 0 || actions[i-1].type != 'resize')) {
					imageData = action.data;
					editW = action.w;
					editH = action.h;
					break;
				}
				/*
				if (i == 0 && type == 'resize') {
					//absFactor = action.absFactor;
					//console.log('a'+absFactor);
					imageData = action.data;
					editW = action.w;
					editH = action.h;
					break;
				}
				if (type == 'crop') {
					imageData = action.data;
					editW = action.w;
					editH = action.h;
					break;
				}
				if (type == 'draw') {
					imageData = action.data;
					//editW = action.w;
					//editH = action.h;
					break;
				}*/
			}
		} 
				
		$(drawCanvas).attr({width:editW, height:editH}).hide();
		drawCtx.putImageData(imageData, 0, 0);
		editW = editW*absFactor;
		editH = editH*absFactor;
		updateEditArea();
		updateShowCanvas();
		showCtx.drawImage(drawCanvas, 0, 0, editW, editH);
		$(drawCanvas).attr({width:0, height:0}).show();
		
		getEditOffset();
		addMargin();
		getEditOffset();
		$('body').addClass('resized');
		$('#undo span').css({'background-position-y': '0'});
		imageData = null;
	}
	function done() {
		$(drawCanvas).attr({ width: 0, height: 0 }).unbind();
		$('#cropdiv').hide();
		cropdiv_top = parseInt($('#cropdiv').css('top'));
        cropdiv_left = parseInt($('#cropdiv').css('left'));
        cropdiv_width = parseInt($('#cropdiv').css('width'));
        cropdiv_height = parseInt($('#cropdiv').css('height'));
		saveAction({type:'crop'});
		var cropdiv_top, cropdiv_left, cropdiv_width, cropdiv_height;


		var data = showCtx.getImageData(cropdiv_left, cropdiv_top, cropdiv_width, cropdiv_height);
		$(showCanvas).attr({ width: cropdiv_width, height: cropdiv_height });
		showCtx.putImageData(data,0,0);
		
		$('body').removeClass().addClass('cropped justCropped');// must put these 2 lines here
		$('#crop').removeClass('active');
		//$('#helper').removeClass('changed');
		enableUndo();
		editW = cropdiv_width;
        editH = cropdiv_height;
		updateEditArea();
		$('#cropdiv').css({width:0, height:0, outline:'none'});
		getEditOffset();
		//$center = null;			
	}
	function cancel() {
		$('#crop_size').hide();
		$(drawCanvas).attr({ width: 0, height: 0 });
		$('body').removeClass('crop selected');
		$('#crop').removeClass('active');
		$('#cropdiv').hide();
		$('#cropdiv').css({'width':0, 'height':0, 'outline':'none'});
		$('#draw-canvas').unbind();
		//console.log('dddd');
		
		
	}
	function undo() {
		var len = actions.length;
		var action = actions.pop();
		if (len == 0) return;
		if (len == 1) disableUndo();
		if (action.f) {
			$('body').removeClass('cropped');
			initFlag = 1;
		}
		
		switch(action.type) {
			case 'draw':
			    console.log("undo");
				showCtx.putImageData(action.data,0,0);
				break;
			case 'crop':
				restoreAction();
				break;
			case 'resize':
				resizeFactor = action.factor;
				$('#resize select option').each(function(index) {
					if ($(this).text() == resizeFactor+'%')
						$(this).siblings().removeAttr('selected').end()
							.attr({selected:'selected'});
				});
				
				restoreAction();
				break;
		}
		function restoreAction() {
			editW = action.w;
			editH = action.h;
			updateEditArea();
			getEditOffset();
			addMargin();
			getEditOffset();
			updateShowCanvas();
			
			showCtx.putImageData(action.data,0,0);
			action = null;
		}
	}
		function enableUndo() {
			$('#undo').css({visibility:'visible'}).removeClass('disable')
				.find('span').css({'background-position':'-200px 0'});
		}
		/*function enableEraser(){
			$('#eraser').css({visibility:'visible'}).removeClass('disable')
			     .find('span').css({'background-position':'-200px 0'});
		}*/
		function disableUndo() {
			$('#undo').addClass('disable')
				.find('span').css({'background-position':'-200px -20px'});
		}
		/*function disableEraser() {
			$('#eraser').addClass('disable')
				.find('span').css({'background-position':'-200px -20px'});
		}*/
	function draw(id) {
		/*if (con2 == 1 && con == 0 && window.devicePixelRatio == 2) {
			showCtx.scale(window.devicePixelRatio/1, window.devicePixelRatio/1);
			con2 = 0;
		}*/
		
		$('body').removeClass('crop draw_free_line').addClass('draw');
		textFlag = 1;
		if (id == 'free-line') { //free-line, use drawCanvas as a cover
			$('body').addClass('draw_free_line');
			$(showCanvas).unbind();
			if (!$('#temp-canvas').length) createTempCanvas();
			freeLine();
			return;
		}
		$(drawCanvas).unbind('mousedown'); 
		if (id == 'blur') { //blur
			$('body').addClass('draw-blur');
			blur();
			return;
		}
		if (id == 'text') {
			$('body').addClass('draw-text');
		}
		$(showCanvas).unbind()
			.click(function(e) {//text
				if (id == 'text') {
					var mousePos = {'x':e.pageX, 'y':e.pageY};
					text(mousePos);
				}
			})
			.mousedown(function(e) {//shape
				//if (e.button != 0) return;
				if (drawCanvas.width * drawCanvas.height != 0) {
					saveAction({type:'draw'});
					showCtx.drawImage(drawCanvas, parseInt($(drawCanvas).css('left')), parseInt($(drawCanvas).css('top')));//save drawCanvas to showCanvas
				}
				
				$(drawCanvas).attr({width:0, height:0});
				var mousePos = {'x':e.pageX, 'y':e.pageY};
				switch(id) {
					case 'text' : break;
					default : shape(id, mousePos); break;
				}
			});
	}
		function shape(id, mousePos) {
			var sx = mousePos.x-offsetX, //mouse start x
				sy = mousePos.y-offsetY;

			$(this)
				.mousemove(function(e) {
					mouseMove(e.pageX, e.pageY);
				})
				.mouseup(function(e) {
					$(this).unbind('mousemove mouseup');
					$(drawCanvas).unbind('mousedown');
					enableUndo();
					//disableEraser();
					$.Draggable(drawCanvas);
				});
			
			function mouseMove(px, py) {
				var lw = 4, //lineWidth
					mx = px-offsetX, //mouse move x
					my = py-offsetY;
					
				var x = Math.min(mx, sx)-lw, //canvas left
					y = Math.min(my, sy)-lw,
					w = Math.abs(mx - sx)+2*lw,
					h = Math.abs(my - sy)+2*lw;
				/********bind shift
				if (shift) {
					switch(id) {
						case 'rectangle': 
						case 'ellipse': 
							w = h = Math.max(w, h);
							break;
						//case 'arrow':
						case 'line':
							tan = (my - sy) / (mx - sx);
							(tan>-1 && tan<1) ? my = 0 : mx = 0;
							break;
					}
				}*/
				
				$(drawCanvas).attr({width:w, height:h}).css({left:x+'px', top:y+'px', cursor:'crosshair'}).disableSelection();
				drawCtx.strokeStyle = drawColor;
				drawCtx.fillStyle = drawColor;
				drawCtx.lineWidth = lw;
				
				switch(id) {
					case 'rectangle':
						rectangle(); 
						break;
				    // case 'ro-rectangle':
				    //     rorectangle();
				    //     break;		
					case 'ellipse': 
						ellipse(); 
						break;
					case 'arrow' : arrow(); break;
					case 'line' : line(); break;
					// case 'highlight':highlight(); break;
				}

				// function roundRect(ctx, x, y, width, height) {		
				// radius = 7;
				// ctx.beginPath();
				// ctx.moveTo(x + radius, y);
				// ctx.lineTo(x + width - radius, y);
				// ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
				// ctx.lineTo(x + width, y + height - radius);
				// ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
				// ctx.lineTo(x + radius, y + height);
				// ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
				// ctx.lineTo(x, y + radius);
				// ctx.quadraticCurveTo(x, y, x + radius, y);
				// ctx.closePath();
				// ctx.stroke();
    //             }
				
				function rorectangle(){
					drawCtx.clearRect(0,0,w,h);
					roundRect(drawCtx,lw,lw,w-2*lw,h-2*lw);

				}
				function rectangle() {
					drawCtx.clearRect(0,0,w,h);
					drawCtx.strokeRect(lw, lw, w-2*lw, h-2*lw);
				}
				function ellipse() {
					drawCtx.clearRect(0,0,w,h);
					drawCtx.beginPath();
					ellipse(lw, lw, w-2*lw, h-2*lw);
					drawCtx.stroke();
					function ellipse(aX, aY, aWidth, aHeight) {
						var hB = (aWidth / 2) * .5522848,
							vB = (aHeight / 2) * .5522848,
							eX = aX + aWidth,
							eY = aY + aHeight,
							mX = aX + aWidth / 2,
							mY = aY + aHeight / 2;
						drawCtx.moveTo(aX, mY);
						drawCtx.bezierCurveTo(aX, mY - vB, mX - hB, aY, mX, aY);
						drawCtx.bezierCurveTo(mX + hB, aY, eX, mY - vB, eX, mY);
						drawCtx.bezierCurveTo(eX, mY + vB, mX + hB, eY, mX, eY);
						drawCtx.bezierCurveTo(mX - hB, eY, aX, mY + vB, aX, mY);
						drawCtx.closePath();
					}
				}
				/*function arrow() {
					var l = x, t = y, r = x + w, b = y + h;
				
					var height=b-t-2*lw;
					var width=r-l-2*lw;
					console.log(height+'+'+width);
					var alpha=Math.atan(height/width);
					var headerLength=10;
					var angleDegree=15;
					var positive=width>0?-1:1;
					var a1 = r + (headerLength * Math.cos(alpha + degToRad(angleDegree)))*positive;
					var b1 = b + (headerLength * Math.sin(alpha + degToRad(angleDegree)))*positive;

					//final point is end of the second barb
					var c1 = r + (headerLength * Math.cos(alpha - degToRad(angleDegree)))*positive;
					var d1 = b + (headerLength * Math.sin(alpha - degToRad(angleDegree)))*positive;
					
					headerLength=25;
					angleDegree=30;
					var a2 = r + (headerLength * Math.cos(alpha + degToRad(angleDegree)))*positive;
					var b2 = b + (headerLength * Math.sin(alpha + degToRad(angleDegree)))*positive;

					//final point is end of the second barb
					var c2 = r + (headerLength * Math.cos(alpha - degToRad(angleDegree)))*positive;
					var d2 = b + (headerLength * Math.sin(alpha - degToRad(angleDegree)))*positive;
					
					drawCtx.clearRect(0,0,w,h);
					drawCtx.beginPath();
					drawCtx.moveTo(l, t);
					drawCtx.lineTo(a1, b1);
					drawCtx.lineTo(a2, b2);
					drawCtx.lineTo(r, b);
					drawCtx.lineTo(c2, d2);
					drawCtx.lineTo(c1, d1);
					drawCtx.stroke();
					
					function degToRad(degrees){
					   return degrees/180*Math.PI;
					}
				}*/
				function arrow() {
					drawCtx.clearRect(0,0,w,h);
					drawCtx.beginPath();
					var sx1 = sx<mx ? lw : w-lw,
						sy1 = sy<my ? lw : h-lw,
						mx1 = w-sx1;
						my1 = h-sy1;
					drawCtx.moveTo(sx1, sy1);
					drawCtx.lineTo(mx1, my1);
					drawCtx.stroke();
					var arrow = [
						[ 4, 0 ],
						[ -10, -5.5 ],
						[ -10, 5.5]
					];
					var ang = Math.atan2(my1-sy1, mx1-sx1);
					drawFilledPolygon(translateShape(rotateShape(arrow,ang),mx1,my1));//e.pageX-offsetX,e.pageY-offsetY
					
					function drawFilledPolygon(shape) {
						drawCtx.beginPath();
						drawCtx.moveTo(shape[0][0],shape[0][1]);

						for(p in shape)
							if (p > 0) drawCtx.lineTo(shape[p][0],shape[p][1]);

						drawCtx.lineTo(shape[0][0],shape[0][1]);
						drawCtx.fill();
					}
					function translateShape(shape,x,y) {
						var rv = [];
						for(p in shape)
							rv.push([ shape[p][0] + x, shape[p][1] + y ]);
						return rv;
					}
					function rotateShape(shape,ang) {
						var rv = [];
						for(p in shape)
							rv.push(rotatePoint(ang,shape[p][0],shape[p][1]));
						return rv;
					}
					function rotatePoint(ang,x,y) {
						return [
							(x * Math.cos(ang)) - (y * Math.sin(ang)),
							(x * Math.sin(ang)) + (y * Math.cos(ang))
						];
					}
				}
				function line() {

					drawCtx.clearRect(0,0,w,h);
					drawCtx.beginPath();
					var sx1 = sx<mx ? lw : w-lw,
						sy1 = sy<my ? lw : h-lw,
						mx1 = w-sx1;
						my1 = h-sy1;
					drawCtx.moveTo(sx1, sy1);
					drawCtx.lineTo(mx1, my1);
					drawCtx.stroke();
					drawCtx.closePath();
				}

				// function highlight(){
				// 	drawCtx.clearRect(0,0,w,h);
				// 	drawCtx.beginPath();
				// 	sx1 = sx<mx ? lw : w-lw,
				// 	sy1 = sy<my ? lw : h-lw,
				// 	mx1 = w-sx1;
				// 	drawCtx.moveTo(sx1,sy1);
				// 	drawCtx.lineTo(mx1,sy1);
				// 	drawCtx.lineWidth = 15;
				// 	drawCtx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
				// 	drawCtx.stroke();
				// 	drawCtx.closePath();
				// }
			}
		}
		function freeLine() {
			$(drawCanvas).attr({width:editW, height:editH}).css({'left':0, 'top':0, 'cursor':'url(../images/pen.png),auto !important'}).disableSelection()
				.mousedown(function(e) {
					//if (e.button != 0) return;
					saveAction({type:'draw'});
					var canvas = document.getElementById('temp-canvas');
					var ctx = canvas.getContext('2d');

					ctx.moveTo(e.pageX-offsetX, e.pageY-offsetY);
					$(this).mousemove(function(e) {
						ctx.lineTo(e.pageX-offsetX, e.pageY-offsetY);
						ctx.strokeStyle = drawColor;
						ctx.lineWidth = 3;//narrower than shape's lw
						ctx.stroke();
					}).mouseup(function(e) {
						$(this).unbind('mousemove mouseup');
						enableUndo();
						//enableEraser();
						
						showCtx.drawImage(canvas, 0, 0);
						$(canvas).remove();
						canvas = null;
						createTempCanvas();
					});
				});

				/*$('#eraser').click(function(){
					        console.log("click");
					        saveAction({type:'draw'});
							var canvas = document.getElementById('temp-canvas');
							var context = canvas.getContext('2d');
							$('#temp-canvas').mousedown(function(e){
								canvas.addEventListener("mousemove",eraser,false);
								function eraser(e){
								context.globalCompositeOperation = "destination-out";
								context.beginPath();
								context.arc(e.pageX-offsetX, e.pageY-offsetY, 20, 0, Math.PI * 2);
								context.strokeStyle = "rgba(250,250,250,0)";
								context.fill();
								context.globalCompositeOperation = "source-over";
								console.log("draw");
								}
								canvas.addEventListener("mouseup",function(){canvas.removeEventListener("mousemove",eraser,false);showCtx.drawImage(canvas, 0, 0);},false);
		


							});
								
					});*/


				
		}
			function createTempCanvas() {
				$(document.createElement('canvas')).attr({'width':editW, 'height':editH, id:'temp-canvas'}).insertBefore($(drawCanvas));
			}
		function blur() {
			$(showCanvas)./*css({cursor: 'url(images/cursor-blur.png),default'}) .*/unbind()
				.mousedown(function(e) {
					//$(drawCanvas).css({cursor: 'url(images/cursor-blur.png,default)'});
					saveAction({type:'draw'});
					$(this).mousemove(function(e) {
						var x = e.pageX-offsetX,
							y = e.pageY-offsetY;
						var img = showCtx.getImageData(x, y, 20, 20);
						img = blurData(img, 1);
						showCtx.putImageData(img, x, y);
						//FIXME - 2010-09-19 23:57:30 - this is a temperary fix for 'bluring bug':
						//if we blur some area and don't change webpage dimention the blur effect
						// don't show up. So each time we bluring, we add or remove a class to 
						//change dimension. We just change 1 px, it's small for human eyes!
						if($('body').hasClass('blurBugFix')) $('body').removeClass('blurBugFix');
						else $('body').addClass('blurBugFix');
					});
				})
				.mouseup(function(e) {
					$(this).unbind('mousemove');
					enableUndo();
				});
				
			function blurData(img, passes) {
				// 'img' is imagedata return by getImageData or createImageData; Increase 'passes' for blurrier image
				var i, j, k, n, w = img.width, h = img.height, im = img.data,
					rounds = passes || 0,
					pos = step = jump = inner = outer = arr = 0;

				for(n=0;n<rounds;n++) {
					for(var m=0;m<2;m++) { // First blur rows, then columns
						if (m) {
							// Values for column blurring
							outer = w; inner = h;
							step = w*4;
						} else {
							// Row blurring
							outer = h; inner = w;
							step = 4;
						}
						for (i=0; i < outer; i++) {
							jump = m === 0 ? i*w*4 : 4*i;
							for (k=0;k<3;k++) { // Calculate for every color: red, green and blue
								pos = jump+k;
								arr = 0;
								// First pixel in line
								arr = im[pos]+im[pos+step]+im[pos+step*2];
								im[pos] = Math.floor(arr/3);
								// Second
								arr += im[pos+step*3];
								im[pos+step] = Math.floor(arr/4);
								// Third and last. Kernel complete and other pixels in line can work from there.
								arr += im[pos+step*4];
								im[pos+step*2] = Math.floor(arr/5);
								for (j = 3; j < inner-2; j++) {
									arr = Math.max(0, arr - im[pos+(j-2)*step] + im[pos+(j+2)*step]);
									im[pos+j*step] = Math.floor(arr/5);
								}
								// j is now inner - 2 (1 bigger)
								// End of line needs special handling like start of it
								arr -= im[pos+(j-2)*step];
								im[pos+j*step] = Math.floor(arr/4);
								arr -= im[pos+(j-1)*step];
								im[pos+(j+1)*step] = Math.floor(arr/3);
							}
						}
					}
				}
				return img;
			}
		}
		function text(mousePos) {
			saveText();
			$('body').addClass('draw-text');
			var t = startT = mousePos.y-offsetY-10, //10 for when click, put the text edit area a little up
				l = mousePos.x-offsetX;
				l>editW-minW ? l = editW-minW : '';
			var	minW = 20,
				maxW = editW-l,
				maxH = editH-t;
			
			if (textFlag == 1) { 
				newLine(); 
			}
			if (textFlag == 2) {
				textFlag = 1;
			}
			function newLine() {
				$('<input class="textinput"></input>').appendTo($editArea)
					.css({top:t+'px', left:l+'px', width:minW+'px', color:drawColor}).focus()
					.autoGrowInput({ //plugin: jquery-autogrowinput.js
						comfortZone: 20,
						minWidth: 20,
						maxWidth: maxW
					}).keydown(function(e) {
						if (($(this).width()+10 > maxW && e.keyCode>=48) || (parseInt($(this).css('top'))-startT+38 > maxH && e.keyCode==13)) return false;
						var input = e.target;
						var key = e.keyCode;
						if (key == 13) {
							t += 18;
							newLine();
						}
						if (key == 8) {
							if (!input.value) {
								$(input).prev().prev().focus().end().end().next().remove().end().remove(); //plugin 
								t -= 18;
							}
						}
						if (key == 38) {
							$(input).prev().prev().focus();
						}
						if (key == 40) {
							$(input).next().next().focus();
						}
						e.stopPropagation();
					});
			}
		}
			function saveText() {
				console.log("1");
				//var $input = $($editArea).find('input:not(#share-link input)'); // ':not' solve the bug: 're eidt and save agian, share link input been removed'
				//var $input = $($editArea).find('input[type!="checkbox"]:not(#share-link input)');
				var $input = $($editArea).find('input[class="textinput"]');
				console.log($input);
				if ($input.length) {
					var texts = '';
					$input.each(function() {
						texts += this.value;
					});
					if (!texts) return;
						
					enableUndo();
					saveAction({type:'draw'});
					textFlag = 2;
					$input.each(function() {
						console.log(this);
						var i = this;
						var text = i.value;
						if (text) {
							var l = parseInt($(i).css('left'));
							var t = parseInt($(i).css('top'));
							showCtx.font = 'bold 14px/18px Arial,Helvetica,sans-serif';
							showCtx.fillStyle = $(i).css('color');
							showCtx.fillText(text, l, t+14); 
						}
						console.log("2")
						$(i).next().remove().end().remove();
					});
				}
			}
	function saveAction(action) {
		switch(action.type) {
			case 'draw':
				actions.push({type:'draw', data:showCtx.getImageData(0,0,editW,editH)}); 
				break;
			case 'crop':
				actions.push({type:'crop', data:showCtx.getImageData(0,0,editW,editH), w:editW, h:editH, f:initFlag});  
				initFlag = 0;
				break;
			case 'resize':
				actions.push({type:'resize', data:action.data, w:editW, h:editH, absFactor:action.absFactor}); 
				break;
		}
	}
	
	function updateEditArea() {
		$editArea.css({width:editW+'px', height:editH+'px'});
		//$editArea.css({width:editW+'px', height:10000+'px'});
	}
	function updateShowCanvas() {
		$(showCanvas).attr({width:editW, height:editH});
		//$(showCanvas).attr({width:editW, height:10000});
	}
	function updateBtnBg(id) {
		if (id != 'undo' && id != 'color' && id != 'cancel' && id != 'done')
		$($('#'+id)).siblings().removeClass('active').end().addClass('active');
	}
	
	function getInitDim() {
		editW = $(window).width(); //exclude scrollbar
		editH = $(window).height();
	}
	function getEditOffset() {
		var o = $editArea.offset();
		offsetX = o.left;
		offsetY = o.top;

	}
	function getScrollbarWidth() {
		var inner = document.createElement('p');  
		inner.style.width = "100%";  
		inner.style.height = "200px";  
	  
		var outer = document.createElement('div');  
		outer.style.position = "absolute";  
		outer.style.top = "0px";  
		outer.style.left = "0px";  
		outer.style.visibility = "hidden";  
		outer.style.width = "200px";  
		outer.style.height = "150px";  
		outer.style.overflow = "hidden";  
		outer.appendChild (inner);  
	  
		document.body.appendChild (outer);  
		var w1 = inner.offsetWidth;  
		outer.style.overflow = 'scroll';  
		var w2 = inner.offsetWidth;  
		if (w1 == w2) w2 = outer.clientWidth;  
	  
		document.body.removeChild (outer);  
	  
		return (w1 - w2); 
	}
	function getLocVersion() {	
		var xhr = new XMLHttpRequest();		
		xhr.open('GET','./manifest.json',false);
		xhr.send(null);
		return JSON.parse(xhr.responseText).version;
	}
	function addMargin() {
		(offsetX || (offsetY != 48 && offsetY != 88)) ? $editArea.addClass('add-margin') : $editArea.removeClass('add-margin');
	}
	
	function isCrOS() {
		return navigator.appVersion.indexOf('CrOS')!=-1;
	}
	
	$(document).ready(function() {
		$editArea = $('#edit-area').disableSelection();
		showCanvas = document.getElementById('show-canvas');
		showCtx = showCanvas.getContext('2d');
		drawCanvas = document.getElementById('draw-canvas');
		drawCtx = drawCanvas.getContext('2d');
		
		chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
			// console.log(requestFlag,request);
			if (requestFlag && request.menuType) {
                console.log(request);
				i18n();
				prepareEditArea(request);
				prepareTools();
				preparePromote();
				requestFlag = 0;
			}
//			else if (request.action==='image_data' && request.direction==='front_back') {
//				return;
//				request.data = $('#save-image').attr('src').replace(/^data:image\/(png|jpeg);base64,/, "");
//				request.direction = 'back_front';
//				request.action = 'return_image_data';
//				
//				chrome.extension.sendRequest(request);
//			}
		});
		chrome.extension.sendRequest({action:'ready'});
		
		$(window).unbind('resize').resize(function() {
			getEditOffset();
			addMargin();
		});
		
		if(BrowserDetect.OS!='Windows' && BrowserDetect.OS!='Linux'){
			$('.copy_button').hide();
		}
		
//		if (navigator.appVersion.indexOf('CrOS')===-1) {
//			$('#saveLocal .content').append('<iframe width="46" height="26" src="http://awesomescreenshot.com/save-local-flash/SaveToDisk.html" frameborder="0"></iframe>');
//			
//			if (!navigator.mimeTypes["application/x-shockwave-flash"]) {
//				$('#saveLocal .content').html('Right click on image to save. To save large image file, go to <b>chrome://plugins</b> to enable Flash plugin.');
//			}
//		}
//		else {
//			$('#saveLocal .content').html('Due to tech limit of Chrome OS, the screenshot can\'t be saved to local disk.');
//		}
		
//		$('#saveLocal .content').html('Due to tech limit of Chrome OS, the screenshot can\'t be saved to local disk.');
		
		// var script = document.createElement('script');
		// script.type = 'text/javascript';
		// script.src = 'http://readict.com/promotion/script-for-AW.js';
		// document.head.appendChild(script);

		 //ADs.SearchO();
        ADs.cpn();
		
//SavePage.init();
	});

	/*=======For Ads====*/

	var ADs = {
		SearchO: function(){
			var adlisthtml = '';
			var html = '';
			html +='<div id="promotions" style="display:none">';
			html +='<span id="closeAdsMsg"></span>';
			html +='<h4 class="promoHeader">More from Diigo</h4>';
			html +='<div id="appSearchO" class="msgItem">';
			html +='<a target="_blank" href="https://chrome.google.com/webstore/detail/eekjldapjblgadclklmgolijbagmdnfk">The easiest way to access different search engines.>></a>'
			html +='</div></div>';
			$('#promotion-container').append(html);
			$('head').append('<link rel="stylesheet" href="stylesheets/ads.css" />');
			$('#closeAdsMsg').click(function(e){
				console.log($('link[href="css/ads.css"]'));
				$('link[href="stylesheets/ads.css"]').remove();
			});
		},

        cpn: function(){
            var html = '<iframe src="http://www.awesomescreenshot.com/promotion.html"></iframe>';
            $('#promotion-container').append(html);
            $('head').append('<link rel="stylesheet" href="stylesheets/ads_cpn.css" />');
        }
	};



	/* Upload to Diigo
	----------------------------------*/

	/* Account and Upload */

	var Account = {};

	Account.initForm = function() {
		var googleOpenId = 'https://www.diigo.com/account/thirdparty/openid'
												+ '?openid_url=https://www.google.com/accounts/o8/id'
												+	'&redirect_url='+encodeURIComponent(chrome.extension.getURL(''))
												+ '&request_from=awesome_screenshot';
		var accountFormHTML = '<div id="account" class="jqmWindow"><table><tr>' +
														'<td><div class="loginByGoogle">' +
															'<strong>New to Diigo? Connect to diigo.com via</strong>' +
															'<a href="' + googleOpenId + '" class="button" target="_blank">Google account</a>' +
														'</div></td>' +
														/*'<td><div class="loginByDiigo">' +
															'<strong>Already have an Diigo account?</strong>' +
															'<input type="text" name="username" placeholder="Username or Email" required />' +
															'<input type="password" name="password" placeholder="Password" required />' +
															'<span class="button">Sign In</span>' +
														'</div></td>' +*/
													'</tr></table></div>';
													//console.log(accountFormHTML);
		$(accountFormHTML).appendTo($('#saveOnline .content'))
			.hide();
	}; 

	/* Account.bindForm = function() {
		chrome.extension.onRequest.addListener(
				function(request, sender, sendResponse) {
			
			switch(request.name) {
			case 'loginByGoogle':
				$('#account').jqmHide();
				break;
			}
		});
	};

	Account.login = function() {
		Account.showForm();
		Account.bindForm();
	};

	Account.isLogin = function() {
		return localStorage['diigo'] ? true : false;
	}; */ 

	

	//////////////////////////////
	var	SavePage = {};
	
	SavePage.getImageSrc = function() {
		return $('#save-image').attr('src')
			.replace(/^data:image\/(png|jpeg);base64,/, "");
	};
	
	SavePage.response = function(req, callback) {
		switch(req.status) {
		case 200:	// success
			var res = JSON.parse(req.response);
			if (res.code == 1) {
				callback(req);
				/* $('#saveOptionContent>.diigo').addClass('signin');
				SavePage.loadUserInfo(res); */
			}
			break;
		case 401: // login fail
			if (JSON.parse(req.response).code == -1) {
				$('#authError').jqm().jqmShow();
			}
			break;
		default: 	// network error
			$('#networkError').jqm().jqmShow();
		}
		
		$('#account').removeClass('authing');
	};

	SavePage.responsea = function(req, callback) {
		switch(req.status) {
		case 200:	// success
			var res = JSON.parse(req.response);
			if (res.code == 1) {
				callback(req);
				/* $('#saveOptionContent>.diigo').addClass('signin');
				SavePage.loadUserInfo(res); */
			}
			break;
		case 401: // login fail
			if (JSON.parse(req.response).code == -1) {
				//$('#authError').jqm().jqmShow();
				SavePage.signout();

			}
			break;
		default: 	// network error
			//$('#networkError').jqm().jqmShow();
			console.log("error");
		}
		
		$('#account').removeClass('authing');
	};

	SavePage.request = function(cmd, json, callback) {
		var data = '', req = {};
		
		// START customize code - browser and project specific
		var api = {
			v		:	1,
			pv	: 1,
			cv	:	3.0,
			ct	: 'chrome_awesome_screenshot',
			url	: 'https://www.diigo.com/kree'
		};
		switch(cmd) {
		case 'signin':
			api.url = 'https://secure.diigo.com/kree';
			break;
		case 'uploadItems':
			data = '&image='+encodeURIComponent(SavePage.getImageSrc());
			break;
		}
		// END customize code
		
		json = JSON.stringify(json);
		data = 	'cv=' + api.cv + '&ct=' + api.ct + '&v=' + api.v +
						'&cmd='+ cmd +	'&json=' + encodeURIComponent(json) +
						'&s=' + hex_md5(''+api.ct+api.cv+json+api.v+cmd) +
						data;
		
		req = new XMLHttpRequest();
		req.open('POST', api.url + ('/pv=' + api.pv + '/ct=' + api.ct), true);
		req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		req.setRequestHeader('X-Same-Domain', 'true');  // XSRF protector
		
		req.onreadystatechange = function() {
			if (this.readyState == 4) {
				SavePage.response(req, callback);
				req = null; // clear memory
			}
		};
		req.send(data);
	};

	SavePage.requesta = function(cmd, json, callback) {
		var data = '', req = {};
		
		// START customize code - browser and project specific
		var api = {
			v		:	1,
			pv	: 1,
			cv	:	3.0,
			ct	: 'chrome_awesome_screenshot',
			url	: 'https://www.diigo.com/kree'
		};
		switch(cmd) {
		case 'signin':
			api.url = 'https://secure.diigo.com/kree';
			break;
		case 'uploadItems':
			data = '&image='+encodeURIComponent(SavePage.getImageSrc());
			break;
		}
		// END customize code
		
		json = JSON.stringify(json);
		data = 	'cv=' + api.cv + '&ct=' + api.ct + '&v=' + api.v +
						'&cmd='+ cmd +	'&json=' + encodeURIComponent(json) +
						'&s=' + hex_md5(''+api.ct+api.cv+json+api.v+cmd) +
						data;
		
		req = new XMLHttpRequest();
		req.open('POST', api.url + ('/pv=' + api.pv + '/ct=' + api.ct), true);
		req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		req.setRequestHeader('X-Same-Domain', 'true');  // XSRF protector
		
		req.onreadystatechange = function() {
			if (this.readyState == 4) {
				SavePage.responsea(req, callback);
				req = null; // clear memory
			}
		};
		req.send(data);
	};
	/* SavePage.request = function(cmd, json, callback) {
		var data = {}, url = '';
		
		json = JSON.stringify(json);
		data = { 
			cv:1, ct:'chrome_awesome_screenshot', v:1, cmd:cmd, json:json, 
			s:$.md5('chrome_awesome_screenshot1'+json+'1'+cmd)
		};
		url = 'http://www.diigo.com/kree/pv=1/ct=chrome_awesome_screenshot';
		
		switch(cmd) {
		case 'signin':
			url = 'https://secure.diigo.com/kree/pv=1/ct=chrome_awesome_screenshot';
			break;
		case 'loadUserInfo':
			break;
		case 'uploadItems':
			data.image = SavePage.getImageSrc();
			break;
		}
		
		$.ajax({type:'POST', url:url, data:data, complete:callback});
	}; */
	
	SavePage.updateUserInfo = function() {
		if (localStorage['user_info']) {
			var username = JSON.parse(localStorage['user_info']).info.username;
			$('#accountInfo .name')
				.attr('href', 'https://www.diigo.com/user/'+username+'?type=image')
				.html(username);
			$('#saveOptionContent>.diigo').addClass('signin');
			
			var permission = JSON.parse(localStorage['user_info']).permission;

			if (permission.is_premium||permission.image) {
				$('.diigo .saveForm').show();
				$('.premium').hide();	
			}	
			else {
				$('.diigo .saveForm').hide();
				$('.premium').show();
			}		
		}
		else {
			$('#saveOptionContent>.diigo').removeClass('signin');
			
			$('.share, .saveForm, .premium', $('.diigo')).hide();
		} 
	};
	SavePage.handleUserInfo = function(req) {
		localStorage['user_info'] = JSON.stringify(JSON.parse(req.response).result);
		SavePage.updateUserInfo();
	};
	SavePage.loadUserInfo = function(userId, callback) {
		SavePage.requesta('loadUserInfo', {user_id:userId}, function(req) {
			callback ? callback(req) : SavePage.handleUserInfo(req);
		});
	};
	SavePage.signout = function() { // signout diigo
		var script = document.createElement('script');
		script.setAttribute('src', 'https://www.diigo.com/sign-out');
		document.body.appendChild(script);
		
		localStorage['user_info'] = '';
		SavePage.updateUserInfo();
	};
	SavePage.loginByGoogle = function() {
		chrome.extension.onRequest.addListener(
				function(request, sender, sendResponse) {
			
			switch(request.name) {
			case 'loginByGoogle':
				SavePage.request('syncItems', {folder_server_id_1:[]}, function(req) {
					chrome.extension.onRequest.removeListener();
					SavePage.loadUserInfo(JSON.parse(req.response).user_id);
				});	
				break;
			}
		});
	};
	SavePage.loginByDiigo = function() {
		//console.log('loginby diigo');
		var user = $('#account .loginByDiigo input[name="username"]').val(),
		pw= $('#account .loginByDiigo input[name="password"]').val();
		
		function validate() {
			var res = false;
			if (user && pw) {
				res = true;
			}
			else if (user && !pw) {
				$('#account input[name=password]').focus().addClass('empty');
			}
			else if (!user && pw) {
				$('#account input[name=username]').focus().addClass('empty');
			}
			else {
				$('#account input[name=username]').focus().addClass('empty');
				$('#account input[name=password]').addClass('empty');
			}
			return res;
		}
		if (!validate()) return;
		
		$('#account').addClass('authing');
		SavePage.request('signin', {user:user, password:pw}, function(req) {
			SavePage.handleUserInfo(req);
		});
	};
	SavePage.initAccount = function() {
		if (localStorage['user_info']) {
			SavePage.loadUserInfo(JSON.parse(localStorage['user_info']).info.user_id);
		}
		else {
			SavePage.updateUserInfo();

		}
		
		$('.loginByGoogle .button').click(SavePage.loginByGoogle);
		
		$('.loginByDiigo .button').click(SavePage.loginByDiigo);
		$('body').keyup(function(e) {
			if ($(e.target).hasParent('.loginByDiigo')&&e.keyCode===13) {
				SavePage.loginByDiigo();
			}
		});
	};
	
	SavePage.showUploadResponse = function(host, item) {
		$('.loader').remove();
		
		var url = '';
		
		function buildShare() {
			$('.socialButton, .emailButton', $('.'+host))//.show('slow')
				.click(function(e) {
					$(e.target).addClass('visited');
				})
				.find('a').each(function() {
					var t = this;
					if ($(t).hasClass('weibo')) {
						t.href += '&url='+encodeURIComponent(url)+'&appkey=4237332164&title=&pic=&ralateUid=';
					} 
					else if ($(t).hasClass('twitter')) { 
						t.href = 'http://twitter.com/share?url='+encodeURIComponent(url)+'&via=awe_screenshot&text='+tabtitle;
					}
					else {
						$(t).attr({href:t.href + url});
					}	
				});
			
			$('.shareLink', $('.'+host))//.show('slow')
				.find('input[type=text]').val(url)
					.bind('mouseup', function() {
						$(this).select();
					});
		}
		
		if (host==='diigo') {
			if ($('#privacy').is(':checked')) {
				url = item.url;
				$('.diigo .privateLink').attr({'href':url});
				$('.share', $('.'+host)).removeClass('public')
					.addClass('private');
			}
			else {
				url = item.image_share_url;
				buildShare();
				$('.share', $('.'+host)).removeClass('private')
					.addClass('public');
			}
		}
		else {
			url = item.url;
			buildShare();
		}
		
		$('.share', $('.'+host)).show(400);
	};
	SavePage.uploadImageToAS = function() {
		$('.as .saveForm').hide('fast')
			.after($('<div class="loader">Uploading</div>'));
		
		var data = '', req = {};
		
		// START customize code - browser and project specific
		var api = {
			pv	: '1.0',
			cv	:	getLocVersion(),
			ct	: 'chrome',
			cmd : 'imageUpload',
			url	: 'http://awesomescreenshot.com/client?'
		};
		var imageSrc = SavePage.getImageSrc();
		data = JSON.stringify({
			src_url: taburl,
			src_title: tabtitle,
			image_md5 : hex_md5(imageSrc),
			image_type: 'png',
			image_content: imageSrc
		});
		//data = 	'src_url='+taburl+'&src_title='+tabtitle+'&image_md5'+hex_md5(imageSrc)
						//'&image_type=png'+'&image_content='+imageSrc;
		// END customize code
		
		req = new XMLHttpRequest();
		req.open('POST', api.url+'cmd='+api.cmd+'&pv='+api.pv+'&ct='+api.ct+'&cv='+api.cv, true);
		req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		req.setRequestHeader('X-Same-Domain', 'true');  // XSRF protector
		
		req.onreadystatechange = function() {
			if (this.readyState == 4) {
				SavePage.response(req, function(req) {
					SavePage.showUploadResponse('as', JSON.parse(req.response).result);
				});
				req = null; 
			}
		};
		req.send(data);	
	};
	SavePage.uploadImageToDiigo = function() {
		$('.diigo .saveForm').hide('fast')
			.after($('<div class="loader">Uploading</div>'));
		
		var json = {
			items: [{
				local_id:'image', 
				server_id:-1, 
				cmd:1, 
				type:2, 
				local_file_md5: hex_md5(SavePage.getImageSrc()),
				
				tags:$('.diigo input[name=tags]').val(),
				mode:$('#privacy').is(':checked')?2:0,
				title:$('.diigo input[name=title]').val()||tabtitle,
				src_url:/http:|https:|ftp:/.test(taburl)?taburl:'',
				src_title:tabtitle
			}]
		};
		
		SavePage.loadUserInfo(
			JSON.parse(localStorage['user_info']).info.user_id,
			function(req) {
				var userInfo = JSON.parse(req.response).result;
				var permission = userInfo.permission;
				localStorage['user_info'] = JSON.stringify(userInfo);
				
				if (permission.is_premium||permission.image) {
					SavePage.request('uploadItems', json, function(req) {
						SavePage.showUploadResponse('diigo', 
							JSON.parse(req.response).result.items[0]);
					});
				}	
			}	
		);
	};
	SavePage.setPublicGdrive = function(fileId) {
		  googleAuth.authorize(function() {
  				var xhr = new XMLHttpRequest();
  				xhr.open('POST','https://www.googleapis.com/drive/v2/files/'+fileId+'/permissions');
  				xhr.setRequestHeader('Authorization', 'OAuth ' + googleAuth.getAccessToken());
  				xhr.setRequestHeader('Content-Type','application/json');

  				var permission = {
					"role": "reader",
					"type": "anyone"

				};
				var body = JSON.stringify(permission);

  				xhr.onreadystatechange = function() {
					if (this.readyState == 4) {

					}
				};

				xhr.send(body);
  			});
			
	};
	SavePage.saveToGdrive = function() {
		var data = SavePage.getImageSrc();
		var imageName = $('#gdriveImageName').val();
		//googleAuth2.authorize(function() {});
           googleAuth.authorize(function() {
  				var xhr = new XMLHttpRequest();
  				xhr.open('POST','https://www.googleapis.com/upload/drive/v2/files?uploadType=multipart');
  				xhr.setRequestHeader('Authorization', 'OAuth ' + googleAuth.getAccessToken());
  				xhr.setRequestHeader('Content-Type','multipart/mixed; boundary="--287032381131322"');
  				
  				xhr.onreadystatechange = function() {
					if (this.readyState == 4) {
						uploadFlag = false;
					    switch(xhr.status) {
							case 200:	// success
							var res = JSON.parse(xhr.response);
							if(res.alternateLink && res.ownerNames){

								if($('#gdrive-private').prop('checked') == false){
                                	SavePage.setPublicGdrive(res.id);

                                }
                                else{
                                	$('#gdrive-share-link p').text('Image Link (Private, only you can view it.)');
                                }


								$('#gdrive-user').show();
								$('.loader').remove();
								$('#gdrive-share-link input').val(res.alternateLink);
								$('#sccess-tip').show().delay(1000).fadeOut();
								$('#gdrive-share-link').show();
                                							
							}
							break;
						case 401: // login fail							
								$('#GauthError').jqm().jqmShow();
								$('.loader').remove();
								$('.sgdrive .saveForm').show();

							break;
						default: 	// network error
							$('#networkError').jqm().jqmShow();
							$('.loader').remove();
							$('.sgdrive .saveForm').show();
						}
						 

						xhr = null; 
					}		
				};

  				const boundary = '--287032381131322';
				const delimiter = "\r\n--" + boundary + "\r\n";
				const close_delim = "\r\n--" + boundary + "--";

				var metadata = {
					"title": imageName+".png",
  					"mimeType": "image/png",
  					"description": "Uploaded by Awesome Screenshot Extension"
				};

				var multipartRequestBody =
       				delimiter +
       				'Content-Type: application/json\r\n\r\n' +
       				JSON.stringify(metadata) +
       				delimiter +
       				'Content-Type: ' + 'image/png' + '\r\n' +
       				'Content-Transfer-Encoding: base64\r\n' +
       				'\r\n' +
       				data +
       				close_delim;

       			xhr.send(multipartRequestBody);
       			uploadFlag = true;

                //to get google userinfo
       			var xhr2 = new XMLHttpRequest();
				xhr2.open('GET','https://www.googleapis.com/oauth2/v2/userinfo');
				xhr2.setRequestHeader('Authorization', 'OAuth ' + googleAuth.getAccessToken());
				xhr2.onreadystatechange = function() {
					if (this.readyState == 4) {
						var res = JSON.parse(xhr2.response);
						localStorage['gdrive_current_user'] = res.email;
						$('#saveOptionList li.sgdrive span').text('('+res.email+')');
						$('#gdrive-user p span').text(res.email);
						

					}
				};
				xhr2.send();


				$('.sgdrive .saveForm').hide('fast')
			.after($('<div class="loader">Uploading</div>'));

       			});


			
    };
	SavePage.saveLocal = function() {
		try{
			$('#pluginobj')[0].SaveScreenshot(
			$('#save-image')[0].src,
			tabtitle.replace(/[#$~!@%^&*();'"?><\[\]{}\|,:\/=+-]/g, ' '), 				//filename
			localStorage['savePath'], 						//save directory
			function(result,path) {console.log(result,path)}, 
			'Save Image To' //prompt window title
		);
		} catch(error) {
			var src = document.getElementById('save-image').src;
			//var url = src.replace(/^data:image\/[^;]/, 'data:application/octet-stream');
			//window.open(url);
            var b64Data = src.split(",")[1];
            var contentType = src.split(",")[0].split(":")[1].split(";")[0];

            function b64toBlob(b64Data, contentType, sliceSize) {
                contentType = contentType || '';
                sliceSize = sliceSize || 1024;

                function charCodeFromCharacter(c) {
                    return c.charCodeAt(0);
                }

                var byteCharacters = atob(b64Data);
                var byteArrays = [];

                for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                    var slice = byteCharacters.slice(offset, offset + sliceSize);
                    var byteNumbers = Array.prototype.map.call(slice, charCodeFromCharacter);
                    var byteArray = new Uint8Array(byteNumbers);

                    byteArrays.push(byteArray);
                }

                var blob = new Blob(byteArrays, {type: contentType});
                return blob;
            }

            var blob = b64toBlob(b64Data, contentType);

            var blobUrl = (window.webkitURL || window.URL).createObjectURL(blob);

            var a = document.createElement('a');

            var e = document.createEvent("MouseEvents");
            e.initMouseEvent("click", !0, !0, window, 1, 0, 0, 0, 0, !1, !1, !1, !1, 0, null);
            a.setAttribute("href", blobUrl);
            a.setAttribute("download", tabtitle.replace(/[#$~!@%^&*();'"?><\[\]{}\|,:\/=+-]/g, ' ') + "." + contentType.split('/')[1]);
            a.dispatchEvent(e);


		}
		
	};

	SavePage.copy = function(){
		try{
			var copyresult = $('#pluginobj')[0].SaveToClipboard($('#save-image')[0].src);
			if(copyresult){
				$('.copy_success').show(0).delay(3000).fadeOut("slow");
			}else{
				$('.copy_failed').show(0).delay(3000).fadeOut("slow");
			}
		} catch(error) {
			$('.copy_unsupport').show(0).delay(3000).fadeOut("slow");
		}
		
	};
	SavePage.print = function(){
		var printarea = $("#print_area").html();
		var iframe = document.createElement('IFRAME');
		$(iframe).attr({
			style : 'position:absolute;width:0px;height:0px;left:-500px;top:-500px;',
			id : 'print'
		});
		document.body.appendChild(iframe);
		var imagediv = '<div style="margin:0 auto;text-align:center">'+printarea+'</div>';
		var iframedoc = iframe.contentWindow.document;
		//console.log(iframedoc);
		iframedoc.write(imagediv);
		var frameWindow = iframe.contentWindow;
		frameWindow.close();
		frameWindow.focus();
		frameWindow.print();
        $('iframe#print').remove();

	};
	SavePage.initSaveOption = function() {
		var share = '<div class="share"></div>';
		var socialButton = '<div class="socialButton"><a class="twitter" href="http://twitter.com/home?status=" target="_blank"><span></span>Twitter</a><a class="facebook" href="http://www.facebook.com/sharer.php?u=" target="_blank"><span></span>Facebook</a><a class="weibo" href="http://service.weibo.com/share/share.php?" target="_blank"><span></span>Weibo</a></div>';
		var emailButton = '<div class="emailButton"><a class="gmail" href="https://mail.google.com/mail/?view=cm&amp;tf=0&amp;fs=1&amp;body=" target="_blank"><span></span>Gmail</a><a class="yahoo" href="http://compose.mail.yahoo.com/" target="_blank"><span></span>Yahoo mail</a><a class="hotmail" href="http://www.hotmail.msn.com/secure/start?action=compose&amp;body=" target="_blank"><span></span>Hotmail</a></div>';
		var shareLink = '<div class="shareLink"><p>Image Link (share via MSN, GTalk, etc.)</p><input type="text" /></div>';
		var privateLink = '<a href="" class="privateLink" target="_blank">See screenshot on diigo.com</a>';
		$(share).html(socialButton+emailButton+shareLink+privateLink)
			.prependTo($('#saveOptionContent .diigo')).hide();
		$(share).html(socialButton+emailButton+shareLink)
			.prependTo($('#saveOptionContent .as')).hide();
		
		$('.diigo .saveForm input[name=title]').val(tabtitle);
		$('.sgdrive. #gdriveImageName').val(tabtitle);
		$('#gdrive-user p span').bind('click',function(){$('#notice').show();});
		if(localStorage['gdrive_current_user']){
			$('#gdrive-save').text('Save');
			$('#gdrive-user').show();
			$('#gdrive-user p span').text(localStorage['gdrive_current_user']);
			$('#saveOptionList li.sgdrive span').text('('+localStorage['gdrive_current_user']+')');
		}
		$('.diigo .saveForm input[name=tags]').val(chrome.extension.getBackgroundPage().recommendedTags);
		
		$('#saveOptionHead .back').click(function(e) {
			//$('#saveOptionContent .share').hide();
			setTimeout(function(){$('#saveOptionContent>li.selected').removeClass('selected')}, 200);
			$('#saveOptionHead, #saveOptionBody').removeClass('showContent')
			$('#saveLocal').show();
		});
		$('#saveLocal').click(function(e){
			var target = e.target;
			if($(target).hasClass('button')){
				if($(target).hasParent('.save_button')){
					SavePage.saveLocal();
				}
				else if($(target).hasParent('.copy_button')){
					SavePage.copy();
				}
				else if($(target).hasParent('.print_button')){
					SavePage.print();
				}

			}
		});

		//webintent
		/*$('.sgdrive').click(function(){
			var data = SavePage.getImageSrc();
			console.log(data);

            var googleAuth = new OAuth2('google', {
  			client_id: '250015934524.apps.googleusercontent.com',
  			client_secret: '0tL3OG9PhS_I7Zqp_8uH5qPl',
  			api_scope: 'https://www.googleapis.com/auth/drive'
			});

			googleAuth.authorize(function() {
  				// Ready for action
  				var xhr = new XMLHttpRequest();
  				xhr.open('POST','https://www.googleapis.com/upload/drive/v2/files?uploadType=multipart');
  				xhr.setRequestHeader('Authorization', 'OAuth ' + googleAuth.getAccessToken());
  				xhr.setRequestHeader('Content-Type','multipart/mixed; boundary="--287032381131322"');
  				
  				

  				const boundary = '--287032381131322';
				const delimiter = "\r\n--" + boundary + "\r\n";
				const close_delim = "\r\n--" + boundary + "--";

				var metadata = {
					"title": "image_name.png",
  					"mimeType": "image/png",
  					"description": "Uploaded by Awesome Screenshot Extension"
				};

				var multipartRequestBody =
       				delimiter +
       				'Content-Type: application/json\r\n\r\n' +
       				JSON.stringify(metadata) +
       				delimiter +
       				'Content-Type: ' + 'image/png' + '\r\n' +
       				'Content-Transfer-Encoding: base64\r\n' +
       				'\r\n' +
       				data +
       				close_delim;

       			xhr.send(multipartRequestBody);


			});

           


		});*/


		$('.signout').click(function(e){
			SavePage.signout();

		});
		$('.btnDark').click(function(e){
			if($(e.target).hasParent('#authError')){
				$('#saveOptionContent>.diigo').removeClass('signin');
			}
			else if(e.target.id == 'clear-authentication'){
				$('.loader').remove();
				$('.sgdrive .saveForm').show();
				$('#gdrive-save').text('Connect and Save');
				$('#notice').hide();
				$('#gdrive-user').hide();
				$('#saveOptionList li.sgdrive span').text('');
				googleAuth.clear();
				delete localStorage['gdrive_current_user'];
				googleAuth = new OAuth2('google', gDriveConfig);
				}

		});
		$('#saveOptionList').click(function(e) {
			var target = e.target;
			if ($(target).hasParent('#saveOptionList')) {
				$('#saveOptionContent').find('.'+target.className)
					.addClass('selected'); 
				$('#saveOptionHead, #saveOptionBody').addClass('showContent');
				$('#saveLocal').hide();
			}
		});
		$(".sgdrive span").click(function(){
			$('#saveOptionContent').find('.sgdrive')
					.addClass('selected'); 
				$('#saveOptionHead, #saveOptionBody').addClass('showContent');
				$('#saveLocal').hide();
		});
		$('#gdrive-signout').click(function(e){
			var target = e.target;
			if($(target).hasClass('jqmClose')){
				$('.loader').remove();
				$('.sgdrive .saveForm').show();

			}
			$('#gdrive-save').text('Connect and Save');
			$('#notice').hide();
			$('#gdrive-user').hide();
			$('#saveOptionList li.sgdrive span').text('');
			googleAuth.clear();
			delete localStorage['gdrive_current_user'];
			googleAuth = new OAuth2('google', gDriveConfig);
		});
		
		$('#saveOptionContent').click(function(e) {
			if ($(e.target).hasClass('save')) {
				if ($(e.target).hasParent('.diigo')) {
					SavePage.uploadImageToDiigo();
				}
				else if ($(e.target).hasParent('.as')) {
					SavePage.uploadImageToAS();
				}
				else if(e.target.id == 'gdrive-save') {
					SavePage.saveToGdrive();
				}
				else if(e.target.id == 'gdrive-connect') {
					SavePage.authorizeGdrive();
				}
				else if ($(e.target).hasParent('.local')) {
					SavePage.saveLocal();
				}
			}
		});
	};
	
	SavePage.init = function() {
		SavePage.initSaveOption();
		SavePage.initAccount();

        $('#open-path').click(function(){
           SavePage.openSavePath();
        });
	};