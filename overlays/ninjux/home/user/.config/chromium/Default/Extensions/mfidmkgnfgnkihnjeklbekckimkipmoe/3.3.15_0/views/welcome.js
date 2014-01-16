var step = 1;
var child3 = null;
var changed = {};
function $(id) {return document.querySelector(id)}
function $$(sel) {return document.querySelectorAll(sel)}
document.addEventListener('DOMContentLoaded', function() {
    document.body.addEventListener('change', function(e) {
        switch (e.target.id) {
        case 'behavior':
            changed['defaultmode'] = e.target.selectedIndex;
            break;
        case 'menu':
            changed['omniicon'] = !!e.target.selectedIndex;
            if (!!e.target.selectedIndex) {
                var el = $('#content > div:nth-child(2)');
                el.parentNode.insertBefore(child3, el.nextSibling);
            }
            else
                $('#content').removeChild(child3);
            displayIcon(!!e.target.selectedIndex);
            break;
        case 'omni':
            changed['omnialways'] = e.target.selectedIndex;
            break;
        case 'button':
            changed['toolbar'] = e.target.selectedIndex;
            changed['toolbaranimation'] = 3 * !e.target.selectedIndex;
            break;
        case 'interface':
            changed['optionsview'] = 2 * e.target.selectedIndex;
            break;
        }
    }, false);
    document.body.addEventListener('click', function(e) {
        switch (e.target.id) {
        case 'next':
            step = navigateWizard('#content', step, step + 1);
            updateButtons();
            break;
        case 'back':
            step = navigateWizard('#content', step, step - 1);
            updateButtons();
            break;
        case 'save':
            for (var k in changed)
                localStorage['prefs.' + k] = changed[k];
            closeTab();
            break;
        case 'cancel':
            closeTab();
            break;
        case 'wizard':
            var userdata = default_userdata;
            $('#title').classList.remove('welcome');
            $('#title').innerText = 'FlashControl setup';
            $('#behavior').selectedIndex = userdata['prefs.defaultmode'];
            $('#menu').selectedIndex = userdata['prefs.omniicon'];
            $('#omni').selectedIndex = userdata['prefs.omnialways'];
            $('#button').selectedIndex = userdata['prefs.toolbar'] === 1 &&
                userdata['prefs.toolbaranimation'] === 0;
            child3 = $('#content > div:nth-child(3)');
            if (!userdata['prefs.omniicon'])
                $('#content').removeChild(child3);
            step = navigateWizard('#content', step, 1);
            updateButtons();
            navigateWizard('body', 2, 3);
            displayIcon(userdata['prefs.omniicon']);
            break;
        }
    }, false);
    navigateWizard('body', 3, 2);
}, false);
function closeTab() {
    chrome.tabs.getCurrent(function(tab) {
        chrome.tabs.remove(tab.id);
    });
}
function displayIcon(val) {
    chrome.tabs.getCurrent(function(tab) {
        if (val) {
            var d = {tabId: tab.id, path: {}};
            d.path[19] = '../graph/icon19.png';
            d.path[38] = '../graph/icon38.png';
            chrome.pageAction.setIcon(d);
            chrome.pageAction.show(tab.id);
        }
        else
            chrome.pageAction.hide(tab.id);
    });
}
function updateButtons() {
    if (step == 1) {
        $('#back').setAttribute('disabled', 'disabled');
        $('#next').removeAttribute('disabled');
        $('#save').classList.remove('active');
    }
    else if (step == $$('#content > div').length) {
        $('#back').removeAttribute('disabled');
        $('#next').setAttribute('disabled', 'disabled');
        $('#save').classList.add('active');
    }
    else {
        $('#back').removeAttribute('disabled');
        $('#next').removeAttribute('disabled');
        $('#save').classList.remove('active');
    }
}
function navigateWizard(tag, prev, next) {
    var elm = $(tag + ' > div:nth-child(' + next + ')');
    if (elm) {
        $(tag + ' > div:nth-child(' + prev + ')').classList.remove('active');
        elm.classList.add('active');
        return next;
    }
    return prev;
}
