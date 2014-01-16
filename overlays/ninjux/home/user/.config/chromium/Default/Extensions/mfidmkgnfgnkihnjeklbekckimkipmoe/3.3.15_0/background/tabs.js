var CANCEL_COMMIT_TIMEOUT = 15 * 60000;
var state = Object.create(null);
var tabs = Object.create(null);

function createTabState(t) {
    if (!tabs[t.id])
        tabs[t.id] = createFrame();
    return tabs[t.id];
}

function replaceTabState(i, t) {
    var o = tabs[i];
    tabs[i] = t;
    return o;
}

function getTabState(i) {
    var t = tabs[i];
    return {
        blocked: t.blocked,
        session: t.session,
        whitelisted: t.status === 'allow',
        blacklisted: t.status === 'deny'
    };
}

function removeTabState(i) {
    delete tabs[i];
}

function createFrame(s, u, f) {
    return Object.create(state, {
        url: {
            writable: true,
            value: u
        },
        flags: {
            configurable: true,
            enumerable: true,
            writable: true,
            value: f
        },
        status: {
            enumerable: true,
            value: s
        },
        found: {
            writable: true,
            value: 0
        }
    });
}

function loadTabFrame(i, u) {
    var f, t = tabs[i];

    if (!prefs.enabled || ignore(u))
        f = createFrame('destroy', u, t.flags | 0);

    else if (cache.matchSite('patternlistA', u))
        f = createFrame('allow', u, t.flags | 0);

    else if (cache.matchSite('patternlistC', u))
        f = createFrame('deny', u, t.flags | 0);

    else {
        f = createFrame('capture', u, t.flags | 0);
        f.preferences = scriptdata;
        f.filterset = [
            cache.matchGroup('patternlistB', u),
            cache.matchGroup('patternlistD', u),
            cache.matchGlobal('patternlistE'),
            cache.matchGlobal('patternlistF')
        ];
    }

    if (t.prerendered)
        f.prerendered = true;

    return replaceTabState(i, f);
}

Object.defineProperties(state, {
    blocked: {
        get: function() {
            return !!(this.flags & 0x01);
        },
        set: function(v) {
            this.flags = this.flags & 0x06 | v;
        }
    },

    session: {
        get: function() {
            return !!(this.flags & 0x02);
        },
        set: function(v) {
            this.flags = this.flags & 0x04 | (v ? 0x03 : 0x00);
        }
    },

    focused: {
        get: function() {
            return !!(this.flags & 0x04);
        },
        set: function(v) {
            this.flags = this.flags & 0x02 | (v === -1 ? this.flags & 0x01 : (v ? 0x04 : 0x01));
        }
    },

    locked: {
        get: function() {
            var d = Object.getOwnPropertyDescriptor(this, 'flags');
            return d ? !d.writable : false;
        },
        set: function(v) {
            Object.defineProperty(this, 'flags', {
                value: this.flags,
                configurable: true,
                writable: !v
            });
        }
    },

    toString: {
        value: function() {
            return JSON.stringify(this)
        }
    }
});

Object.defineProperty(tabs, '-1', {
    value: Object.freeze(createFrame('', 'chrome:', 0))
});

chrome.tabs.onCreated.addListener(createTabState);
chrome.tabs.onRemoved.addListener(removeTabState);

if ('webNavigation' in chrome) {
    chrome.webNavigation.onCommitted.addListener(function(d) {
        if (d.frameId !== 0 || tabs[d.tabId])
            return;

        createTabState({id: d.tabId}).prerendered = true;

        window.setTimeout(function() {
            if (tabs[d.tabId] && tabs[d.tabId].prerendered)
               removeTabState(d.tabId);
        }, CANCEL_COMMIT_TIMEOUT);
    }, {
        url: [{schemes: ['http', 'https']}]
    });

    chrome.webNavigation.onTabReplaced.addListener(function(d) {
        delete createTabState({id: d.tabId}).prerendered;
        removeTabState(d.replacedTabId);
    });
}

chrome.tabs.query({}, function(l) {
    for (var i = 0; i < l.length; i++)
        createTabState(l[i]);
});
