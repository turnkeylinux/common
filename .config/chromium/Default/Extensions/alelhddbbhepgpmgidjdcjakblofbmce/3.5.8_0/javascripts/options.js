$(document).ready(function() {
	if (localStorage['reset'] && localStorage['reset'] == 'true') {
		showTip('Options Reseted');
		localStorage.removeItem('reset');
	}

    var pluginObj = document.getElementById('pluginobj');

	
	buildSelect();
	restoreOptions();
	bindSelect();
	bindActionPanel();

    $('#browsePath').on('click',function(){
        pluginObj.SetSavePath(localStorage['savePath'], function(savePath) {
            $('#filePath').val(savePath);
            localStorage['savePath'] = savePath;
        }, "Browse...");
    });

    $('#goToFolder').on('click',function(){
        pluginObj.OpenSavePath(localStorage['savePath']);
    });
});

function buildSelect() {
	var keys = ['V', 'S', 'E'];

	var $select = $('<select disabled="disabled"></select>');
	for (var i=48; i<91; i++) {
		if (i>57 && i<65) continue;
		
		var c = String.fromCharCode(i);
		$('<option></option>').attr({value:c}).text(c)
			.appendTo($select);
	}
	$select.appendTo($('.select'))
		.each(function(i) {
			this.value = keys[i];
		});
	
}

function bindSelect() {
	$('#shortcuts_table').click(function(e) {
		var target = e.target;
		var $siblingsTd = $(target).parent().siblings('td');
		
		//select shortcut
		if (target.tagName == 'SELECT' && $('input', $siblingsTd).attr('checked')) {
			$('select', $('#menu_shortcuts')).not(target).each(function() {
				$('option[disabled]', $(this)).removeAttr('disabled');
				$('option[value='+this.value+']', $(target)).attr({disabled:'disabled'});
			});
		}
		//toggle if enable shortcut
		if (target.type == 'checkbox') {
			var $pairingSelect = $('select', $siblingsTd);
			if ($(target).attr('checked')) 
				$pairingSelect.removeAttr('disabled');
			else 
				$pairingSelect.attr({disabled:'disabled'});
		}
	});
}

function bindActionPanel() {
	$('#action_panel').click(function(e) {
		if (e.target.tagName == 'INPUT') {
			switch (e.target.value) {
			case 'Reset':
				localStorage.clear();
				localStorage['reset'] = true;
				location.href = location.href;
                localStorage['msObj'] = '{"visible":{"enable":true,"key":"V"},"selected":{"enable":true,"key":"S"},"entire":{"enable":true,"key":"E"}}';
                localStorage['format'] = "png";
                localStorage['savePath'] = 'C:/';
                localStorage['autoSave'] = 'false';
				break;
			case 'Save':
				if (checkDuplicateKeys()) {
					$('#tip').addClass('error');
					showTip('Shortcut Keys Conflict');
					return;
				}
				saveOptions(); 
				$('#tip').removeClass('error');
				showTip('Options Saved');
				break;
			case 'Close':
				chrome.extension.sendRequest({action:'exit'}); 
				break;
			}
		}
	});
}

function saveOptions() {
	localStorage['format'] = $('input[name="format"]:checked').attr('id');

    localStorage['autoSave'] = $('#autosave').is(":checked");
	
	//menu shortcuts
	var msObj = {};
	$('input:checkbox', $('#menu_shortcuts')).each(function() {
		var id = this.id,
			enable = this.checked,
			key = $('select', $(this).parent().siblings('td.select')).attr('value');
		
		msObj[''+id] = {enable:enable, key:key};
	});
	//menu features
	$('input:checkbox', $('#menu_features')).each(function() {
		var id = this.id,
			enable = this.checked,
			key = $('select', $(this).parent().siblings('td.select')).attr('value');
		
		msObj[''+id] = {enable:enable, key:key};
	});
	
	localStorage['msObj'] = JSON.stringify(msObj);
	
	//send update changes -> bg.html
	chrome.extension.sendRequest({action:'update_shortcuts'});
	//chrome.extension.getBackgroundPage().star();
	//console.log(chrome.extension.getBackgroundPage());
}

function restoreOptions() {
	//image format
     if (localStorage['format']) {
		$('#'+localStorage['format']).attr({checked:'checked'})
			.siblings('input:checked').removeAttr('checked');
	} else {
         localStorage['format']='png';
         $('#png').attr({checked:'checked'})
             .siblings('input:checked').removeAttr('checked');
     }

    if (localStorage['savePath']) {
        $('#filePath').val(localStorage['savePath']);
    }

    if (localStorage['autoSave'] == 'true') {
        $('#autosave').prop('checked','checked');
    }
	
	//menu shortcuts
	if (msObj = localStorage['msObj']) {
		msObj = JSON.parse(msObj);
		for (var i in msObj) {
			var obj = msObj[i],
				$el = $('#'+i),
				$pairingSelect = $('select', $el.parent().siblings('td.select'));
			
			if (obj.enable) {
				$el.attr({checked:'checked'});
				$pairingSelect.removeAttr('disabled');
			}
			$pairingSelect.attr({value:obj.key});
		}
	}
}

function checkDuplicateKeys() {
	var keys = '', d = 0;
	$('select', $('td.select')).each(function() {
		var v = this.value;
		keys += v;
		
		if(keys.match(new RegExp(v, 'gi')).length > 1) {
			d = 1;
		}
	});
	return d;
}

function showTip(text) {
	$('#tip').slideDown('fast').delay(2000).fadeOut('slow')
		.find('span').text(text);
}
