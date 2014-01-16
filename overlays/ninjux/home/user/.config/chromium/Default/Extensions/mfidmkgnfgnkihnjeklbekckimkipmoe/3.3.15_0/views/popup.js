var tab;
var prefs;
var events;

prefs = chrome.extension.getBackgroundPage().userdata.copy([
    'prefs.enabled',
    'prefs.optionsview'
]);

events = {
    'toggle': function() {
        chrome.extension.getBackgroundPage().blockTab(tab.id, !tab.blocked);
    },
    'block': function() {
        chrome.extension.getBackgroundPage().blockSession(tab.id, !tab.session);
    },
    'whitelist': function() {
        chrome.extension.getBackgroundPage().blockContext(tab.id, {
            type: 'allow',
            enable: !tab.whitelisted
        });
    },
    'blacklist': function() {
        chrome.extension.getBackgroundPage().blockContext(tab.id, {
            type: 'deny',
            enable: !tab.blacklisted
        });
    },
    'resources': function() {
        chrome.extension.getBackgroundPage().inspectTab(tab.id);
    },
    'extension': function() {
        chrome.extension.getBackgroundPage().enableExtension(!prefs['prefs.enabled']);
    },
    'preferences': function() {
        chrome.extension.getBackgroundPage().viewOptions();
    },

    handleEvent: function(e) {
        if (e.type == 'DOMContentLoaded') {
            chrome.tabs.query({
                'currentWindow': true,
                'active': true
            }, function(tabs) {
                var d = document.getElementById('toggle');
                var e = document.getElementById('block');
                var f = document.getElementById('whitelist');
                var g = document.getElementById('blacklist');
                var b = chrome.extension.getBackgroundPage();
                if (b.ignore(tabs[0].url)) {
                    e.style.display = 'none';
                    document.getElementById('resources').style.display = 'none';
                    return;
                }
                tab = b.getTabState(tabs[0].id);
                tab.id = tabs[0].id;
                if (tab.whitelisted || tab.blacklisted) {
                    e.classList.add('disabled');
                    d.classList.add('disabled');
                    tab.whitelisted && (f.innerText = '-Whitelist') && g.classList.add('disabled');
                    tab.blacklisted && (g.innerText = '-Blacklist') && f.classList.add('disabled');
                }
                d.innerText = (tab.blocked ? 'Allow' : 'Block') + ' This Page';
                e.innerText = (tab.session ? 'Allow' : 'Block') + ' This Session';
                var h = prefs['prefs.optionsview'];
                if (h === 0) {
                    e.style.display = 'none';
                    document.getElementById('resources').style.display = 'none';
                }
                else if (h === 1) {
                    document.getElementById('resources').style.display = 'none';
                    document.body.style.minHeight = '133px';
                }
                else document.body.style.minHeight = '158px';
                if (!prefs['prefs.enabled']) {
                    var j = document.querySelectorAll('.menuitem:not(#extension):not(#preferences)');
                    var i = j.length;
                    while (i--) j[i].classList.add('disabled');
                    document.getElementById('extension').innerText = 'Enable FlashControl';
                }
                document.removeEventListener('DOMContentLoaded', events, false);
                document.addEventListener('click', events, false);
            });
        }
        else if (e.type == 'click') {
            if (!e.target.classList.contains('disabled') && e.target.id in events) {
                document.removeEventListener('click', events, false);
                document.body.appendChild(document.createElement('div')).className = 'glasspane';
                events[e.target.id](e);
                window.close();
                return false;
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', events, false);
