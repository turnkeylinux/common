var profile;

function getStorageArea(k) {
    if (/^prefs/.test(k))
        return userdata;
    if (/^sync/.test(k))
        return syncdata;
    if (/^data/.test(k))
        return patterns;
}

function patternsetStorageHandler(e) {
    var k = e.key.substring(e.key.indexOf('.') + 1);
    var v = e.newValue == null ? [] : e.newValue;

    switch (k) {
    case 'patternlistA':
    case 'patternlistC':
    case 'patternlistB':
    case 'patternlistD':
    case 'patternlistE':
    case 'patternlistF':
        cache.load(k, v);
        for (var i in tabs) {
            loadTabFrame(i, tabs[i].url);
            if (tabs[i].prerendered)
                tabs[i].revalidate = true;
        }
        break;
    }
}

function userdataStorageHandler(e) {
    var k = e.key.substring(e.key.indexOf('.') + 1);
    var v = e.newValue == null ? userdata.object(e.key) : e.newValue;

    switch (k) {
    case 'enabled':
        prefs.enabled = v;
        var x = {allFrames: true, code: format(codes.SCRIPT_ENABLE, v)};
        for (var i in tabs) {
            loadTabFrame(i, tabs[i].url);
            if (tabs[i].prerendered)
                tabs[i].revalidate = true;
        }
        chrome.tabs.query({url: '*://*/*'}, function(t) {
            for (var i = 0; i < t.length; i++) {
                omni.update(t[i].id);
                chrome.tabs.executeScript(t[i].id, x);
            }
        });
        break;
    case 'omniicon':
        var a = prefs.omnialways;
        chrome.tabs.query({url: '*://*/*'}, function(t) {
            for (var i = 0; i < t.length; i++)
                omni.show(t[i].id, v * a || v * tabs[t[i].id].found);
        });
        prefs.omniicon = v;
        break;
    case 'omnialways':
        var a = prefs.omniicon;
        chrome.tabs.query({url: '*://*/*'}, function(t) {
            for (var i = 0; i < t.length; i++)
                omni.show(t[i].id, v * a || a * tabs[t[i].id].found);
        });
        prefs.omnialways = v;
        break;
    case 'idleseconds':
        idle.detect(v);
        break;
    case 'tabfocus':
        if (v & 0x03) {
            if (!chrome.tabs.onActivated.hasListener(onTabActivated))
                chrome.tabs.onActivated.addListener(onTabActivated);
            if (v & 0x02 && userdata.boolean('prefs.preservefocus')) {
                if (!chrome.tabs.onCreated.hasListener(onTabCreated)) {
                    chrome.tabs.onCreated.addListener(onTabCreated);
                    chrome.tabs.onRemoved.addListener(onTabRemoved);
                }
            }
            else {
                chrome.tabs.onCreated.removeListener(onTabCreated);
                chrome.tabs.onRemoved.removeListener(onTabRemoved);
            }
        }
        else {
            chrome.tabs.onActivated.removeListener(onTabActivated);
            chrome.tabs.onCreated.removeListener(onTabCreated);
            chrome.tabs.onRemoved.removeListener(onTabRemoved);
        }
        chrome.tabs.query({url: '*://*/*'}, function(t) {
            for (var i = 0; i < t.length; i++) {
                tabs[t[i].id].focused = -1;
                tabs[t[i].id].locked = false;
            }
        });
        prefs.tabfocus = v;
        break;
    case 'preservefocus':
        if (v && userdata.boolean('prefs.tabfocus') & 0x02) {
            if (!chrome.tabs.onCreated.hasListener(onTabCreated)) {
                chrome.tabs.onCreated.addListener(onTabCreated);
                chrome.tabs.onRemoved.addListener(onTabRemoved);
            }
        }
        else {
            chrome.tabs.onCreated.removeListener(onTabCreated);
            chrome.tabs.onRemoved.removeListener(onTabRemoved);
        }
        break;
    case 'defaultmode':
        var m = v === 0;
        prefs.defaultmode = !m;
        for (var i in tabs)
            if (!ignore(tabs[i].url) && !(origin(tabs[i].url) in sessions)) {
                tabs[i].session = m;
                if (tabs[i].prerendered)
                    tabs[i].revalidate = true;
            }
        break;
    case 'toolbar':
    case 'clickpanel':
    case 'filterctrl':
    case 'toolbaranimation':
    case 'toolbarposition':
        placeholder.updateAnimation();
        break;
    case 'flashborder':
        placeholder.updateBorder();
        break;
    case 'panelcolor':
        placeholder.updateColor(typeof v == 'string' ? JSON.parse(v) : v);
        break;
    case 'panelicon':
        placeholder.updateIcon(v);
        break;
    case 'showicon':
    case 'panelimage':
    case 'desaturate':
        placeholder.updateIcon();
        break;
    case 'paneltooltip':
        placeholder.updateTooltip(JSON.parse(v));
        break;
    }
}

function syncStorageHandler(e) {
    var k = e.key.substring(e.key.indexOf('.') + 1);
    var v = e.newValue == null ? syncdata.object(e.key) : e.newValue;

    switch (k) {
    case 'enabled':
        profile.sync(v);
        break;
    case 'settings':
        profile.watch('prefs', v);
        break;
    case 'filters':
        profile.watch('data', v);
        break;
    }
}

function syncResponse(keys, err) {
    if (err)
        console.error("Couldn't sync %s: %s", keys.toString(), err.message);
}

profile = {
    sync: function(b) {
        if (!b) {
            sync.disconnect();
            return;
        }

        sync.connect(profile);
        sync.response = syncResponse;

        var r = [];
        var l = [];// local changes
        if (profile._area.indexOf('prefs') !== -1) {
            l = userdata.keys().concat(l);
            r = Object.keys(userdata.defaults).concat(r);
        }
        if (profile._area.indexOf('data') !== -1) {
            l = patterns.keys().concat(l);
            r = Object.keys(patterns.defaults).concat(r);
        }

        // merge (theirs conflict)
        sync.get(r, function(o) {
            var i;
            for (var k in o) {
                profile.update(k, o[k]);
                (i = l.indexOf(k)) !== -1 && l.splice(i, 1);
            }
            sync.set(l);
        });
    },

    update: function(k, v) {
        var e = k;

        if (typeof e === 'string') {
            e = fixStorageEvent({key:k, newValue:v});

            if (e.newValue == null)
                return;

            getStorageArea(k).set(k, e.newValue);
        }

        switch (e.key.substring(0, e.key.indexOf('.'))) {
        case 'data':
            patternsetStorageHandler(e);
            break;
        case 'prefs':
            userdataStorageHandler(e);
            break;
        case 'sync':
            syncStorageHandler(e);
            break;
        }
    },

    save: function(e) {
        profile.update(e);

        // skip private
        if (/^sync\./.test(e.key))
            return;

        sync.set([e.key]);
    },

    get: function(k) {
        var d = {};
        for (var i = 0; i < k.length; i++)
            if (profile._area.indexOf(k[i].substring(0, k[i].indexOf('.'))) !== -1)
                d[k[i]] = getStorageArea(k[i]).object(k[i]);
        return d;
    },

    set: function(k, v) {
        for (var e in k)
            profile.update(e, k[e].newValue);
    },

    watch: function(a, b) {
        if (!b)
            profile._area = profile._area.filter(function(i) {return i !== a;});
        else {
            if (profile._area.every(function(i) {return i !== a;}))
                profile._area.push(a);
        }
    },

    _area: []
};

window.addEventListener('storage', function(e) {
    var f = fixStorageEvent(e);

    if (f.newValue == null)
        getStorageArea(f.key).set(f.key, null);

    profile.save(f);
}, false);
