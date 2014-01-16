paths('graph/', ['png', 'gif', 'jpg']);
paths('views/', ['html', 'css']);

var userdata = new properties(window.localStorage, default_userdata);
var syncdata = new properties(window.localStorage, default_syncdata);
var patterns = new properties(window.localStorage, default_patterns);

var sessions = Object.create(null);
var last_tab_id;

var rxStrict = /^(file|about|chrome):/;
var rxChrome = /^chrome(?:-[a-z]+):/;
var rxWebStore = /^https:\/\/chrome\.google\.com\/webstore\//;
var ignore = exclusion([rxStrict, rxChrome, rxWebStore]);

var prefs = {
    enabled: userdata.boolean('prefs.enabled'),
    omniicon: userdata.boolean('prefs.omniicon'),
    omnialways: userdata.boolean('prefs.omnialways'),
    tabfocus: userdata.number('prefs.tabfocus'),
    defaultmode: userdata.boolean('prefs.defaultmode')
};

var codes = {
    SCRIPT_BLOCK: 'FlashControl(\"block\",{0})\n//@ sourceURL=injected',
    SCRIPT_ENABLE: 'FlashControl(\"enable\",{0})\n//@ sourceURL=injected',
    SCRIPT_FILTER: 'FlashControl(\"filter\",\"{0}\",{1})\n//@ sourceURL=injected',
    SCRIPT_INVALIDATE: 'FlashControl(\"invalidate\",{0})\n//@ sourceURL=injected',
    SCRIPT_STATUS: 'FlashControl(\"{0}\",{1})\n//@ sourceURL=injected'
};

var idle = {
    detect: function(n) {
        if (!n) {
            if (chrome.idle.onStateChanged.hasListener(idle.event))
                chrome.idle.onStateChanged.removeListener(idle.event);
            return;
        }

        if (!chrome.idle.onStateChanged.hasListener(idle.event))
            chrome.idle.onStateChanged.addListener(idle.event);

        chrome.idle.setDetectionInterval(Math.max(n, 60));
    },

    event: function(s) {
        if (s === 'active') {
            var b = userdata.boolean('prefs.idletabs');
            chrome.tabs.query({url: '*://*/*'}, function(t) {
                for (var i = 0; i < t.length; i++) {
                    if (b && t[i].active)
                        continue;
                    if (!tabs[t[i].id].locked && !(origin(tabs[t[i].id].url) in sessions))
                        blockTab(t[i].id, true);
                }
            });
        }
    }
};

var cache = {
    load: function(k, d) {
        switch (k) {
        case 'patternlistA':
        case 'patternlistC':
            cache[k] = targets.extract(d || patterns.object('data.' + k));
            break;
        case 'patternlistB':
        case 'patternlistD':
        case 'patternlistE':
        case 'patternlistF':
            cache[k] = sources.extract(d || patterns.object('data.' + k));
            break;
        }
    },

    matchSite: function(k, u) {
        return cache[k].some(match(u));
    },

    matchGroup: function(k, u) {
        return sources.search(cache[k], u);
    },

    matchGlobal: function(k) {
        return cache[k];
    }
};

var extension_events = {
    'status': function(m, i, c) {
        c(tabs[i]);
    },

    'css': function(m, i, c) {
        c({'rules': placeholder.rules});
    },

    'omni': function(m, i, c) {
        var t = tabs[i];
        t.found = Math.max(0, t.found + m.val);
        if (!t.prerendered && prefs.enabled) {
            omni.tooltip(i);
            omni.show(i, prefs.omniicon * (prefs.omnialways || t.found));
        }
    }
};

function onTabCreated(i) {
    if (tabs[last_tab_id])
        tabs[last_tab_id].locked = true;
}

function onTabRemoved(i, x) {
    if (x.isWindowClosing || i === last_tab_id)
        last_tab_id = null;
}

function onTabUpdated(i, c) {
    if (!c.status)
        return;

    var s = c.status == 'loading' && !c.url ? 'reload' : c.status;

    if (s == 'loading') {
        var u = tabs[i].url || '';
        if (u.replace(/#.*$/, '') !== c.url.replace(/#.*$/, '')) {
            loadTabFrame(i, c.url);
            tabs[i].session = origin(c.url) in sessions ? prefs.defaultmode : !prefs.defaultmode;
            tabs[i].focused && (tabs[i].focused = true);
        }
        return;
    }

    if (s == 'reload') {
        tabs[i].found = 0;
    }

    if (s == 'swapped') {
        if (tabs[i].revalidate) {
            chrome.tabs.executeScript(i, {allFrames: true,
                code: format(codes.SCRIPT_STATUS, tabs[i].status, tabs[i])});
            delete tabs[i].revalidate;
        }
    }

    if (!ignore(tabs[i].url) && !tabs[i].prerendered) {
        if (!prefs.enabled)
            omni.show(i, true);
        else if (prefs.omniicon)
            omni.show(i, prefs.omnialways || tabs[i].found);
    }
}

function onTabActivated(i) {
    var t = tabs[last_tab_id];
    var x = {allFrames: true};

    if (t && prefs.tabfocus & 0x02) {
        t.focused = false;
        if (!ignore(t.url)) {
            if (!t.locked && !(origin(t.url) in sessions)) {
                x.code = format(codes.SCRIPT_BLOCK, true);
                chrome.tabs.executeScript(last_tab_id, x);
            }
        }
    }

    t = tabs[i.tabId];
    t.locked = false;
    if (prefs.tabfocus & 0x01) {
        t.focused = true;
        if (t.url && !ignore(t.url)) {
            x.code = format(codes.SCRIPT_BLOCK, false);
            chrome.tabs.executeScript(i.tabId, x);
        }
    }

    last_tab_id = i.tabId;
}

function onTabCommitted(d) {
    if (d.frameId === 0 && tabs[d.tabId].prerendered)
        onTabUpdated(d.tabId, {status: 'loading', url: d.url});
}

function onTabReplaced(d) {
    if (!tabs[d.tabId].url) {
        tabs[d.tabId].prerendered = true;
        chrome.tabs.get(d.tabId, function(t) {
            onTabUpdated(d.tabId, {status: 'loading', url: t.url});
            tabs[d.tabId].revalidate = true;
            onTabUpdated(d.tabId, {status: 'swapped'});
        });
        return;
    }
    onTabUpdated(d.tabId, {status: 'swapped'});
}

function onTabMessage(m, s, c) {
    if (s.tab)
        extension_events[m['type']](m, s.tab.id, c);
}

function enableExtension(b) {
    userdata.set('prefs.enabled', b);
    profile.save({key:'prefs.enabled', newValue:b});
}

function inspectTab(i) {
    chrome.windows.create({
        'width': 740,
        'height': 380,
        'type': 'popup',
        'focused': true,
        'url': [
            paths('resources.html'),
            '?url=',
            encodeURIComponent(tabs[i].url),
            '&id=',
            i].join('')
    });
}

function viewOptions() {
    var p = paths('options.html');
    chrome.tabs.query({url:p}, function(t) {
        var d = {active:true};
        if (t.length === 0) {
            d.url = p;
            chrome.tabs.create(d);
        }
        else
            chrome.tabs.update(t[0].id, d);
    });
}

function blockTab(i, v) {
    chrome.tabs.executeScript(i, {
        'code': format(codes.SCRIPT_BLOCK, v),
        'allFrames': true
    }, function(a) {
        tabs[i].blocked = v;
        omni.update(i);
    });
}

function blockSession(i, v) {
    var o = origin(tabs[i].url);
    var s = o in sessions;
    var r = regexp.create(o + '/*');
    var x = {allFrames: true, code: format(codes.SCRIPT_BLOCK, v)};

    v == prefs.defaultmode ? !s && (sessions[o] = 1) : s && delete sessions[o];

    for (var i in tabs) {
        if (!ignore(tabs[i].url) && r.test(tabs[i].url)) {
            tabs[i].session = v;
            if (tabs[i].prerendered)
                tabs[i].revalidate = true;
            else {
                omni.update(+i);
                chrome.tabs.executeScript(+i, x);
            }
        }
    }
}

function blockContext(i, v) {
    var p = '*://' + host(tabs[i].url) + '/*';
    var r = regexp.create(origin(tabs[i].url) + '/*');
    var k = v.type === 'allow' ? 'data.patternlistA' : 'data.patternlistC';
    var g = targets.update(patterns.object(k), tabs[i].url, p, v.enable);
    var x = {allFrames: true, code: format(codes.SCRIPT_FILTER, v.type, v.enable)};

    patterns.set(k, g);
    profile.save({key: k, newValue:g});

    for (var i in tabs) {
        if (!ignore(tabs[i].url) && r.test(tabs[i].url)) {
            if (tabs[i].prerendered)
                tabs[i].revalidate = true;
            else {
                omni.update(+i);
                chrome.tabs.executeScript(+i, x);
            }
        }
    }
}

function filterTab(i, d) {
    var x = {allFrames: true, code: format(codes.SCRIPT_INVALIDATE, JSON.stringify(d))};
    chrome.tabs.executeScript(i, x);
}

placeholder.init();

cache.load('patternlistA');
cache.load('patternlistB');
cache.load('patternlistC');
cache.load('patternlistD');
cache.load('patternlistE');
cache.load('patternlistF');

profile.watch('data', syncdata.boolean('sync.filters'));
profile.watch('prefs', syncdata.boolean('sync.settings'));
profile.sync(syncdata.boolean('sync.enabled'));

idle.detect(userdata.number('prefs.idleseconds'));

chrome.tabs.query({}, function(t) {
    for (var i = 0; i < t.length; i++)
        onTabUpdated(t[i].id, {status: 'loading', url: t[i].url});

    if (prefs.tabfocus) {
        chrome.tabs.onActivated.addListener(onTabActivated);
        if (userdata.boolean('prefs.preservefocus'))
            if (prefs.tabfocus & 0x02) {
                chrome.tabs.onCreated.addListener(onTabCreated);
                chrome.tabs.onRemoved.addListener(onTabRemoved);
            }
    }
    if ('webNavigation' in chrome) {
        chrome.webNavigation.onCommitted.addListener(onTabCommitted,
            {url: [{schemes: ['http', 'https']}]});
        chrome.webNavigation.onTabReplaced.addListener(onTabReplaced);
    }
    chrome.tabs.onUpdated.addListener(onTabUpdated);

    chrome.runtime.onMessage.addListener(onTabMessage);

    /*chrome.runtime.onInstalled.addListener(function(d) {
        if (d.reason !== 'install')
            return;

        chrome.tabs.create({
            'url': paths('welcome.html'),
            'active': true
        });
    });*/
});
