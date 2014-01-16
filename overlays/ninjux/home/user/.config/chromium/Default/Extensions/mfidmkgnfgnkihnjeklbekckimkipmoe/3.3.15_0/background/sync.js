var sync_events = {
    'send': function() {
        var d = sync.local.get(sync.changes);
        sync.remote.set(d, sync_events.confirm);
        sync.sent = Object.keys(d);
        sync.changes = [];
    },

    'recieve': function(c, a) {
        if (a === sync.area)
            sync.local.set(c);
    },

    'confirm': function() {
        sync.response(sync.sent, chrome.runtime.lastError);
        delete sync.sent;
    }
};

var throttle = {
    ops: 0,
    wpm: chrome.storage.sync.MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE,
    period: 60000,
    tick: Date.now(),

    measure: function() {
        var t = throttle, n = Date.now(), e = n - t.tick;
        if (e > t.period) {
            t.tick = n;
            t.ops = 0;
        }
        if (t.ops < t.wpm) {
            t.ops += 1;
            return 0;
        }
        return t.period - e;
    }
};

var sync = Object.create({
    area: 'sync',

    connect: function(o) {
        if (chrome.storage.onChanged.hasListener(sync_events.recieve))
            return;

        chrome.storage.onChanged.addListener(sync_events.recieve);

        sync.local = o;
        sync.remote = chrome.storage[sync.area];
        sync.changes = [];
    },

    disconnect: function() {
        if (!chrome.storage.onChanged.hasListener(sync_events.recieve))
            return;

        chrome.storage.onChanged.removeListener(sync_events.recieve);

        window.clearTimeout(sync.id);

        delete sync.local;
        delete sync.remote;
        delete sync.changes;
        delete sync.id;
    },

    record: function(k) {
        if (!sync.changes)
            return;

        var l = sync.changes.length;
        for (var i = 0; i < k.length; i++)
            if (sync.changes.indexOf(k[i]) === -1)
                sync.changes.push(k[i]);

        return sync.changes.length > l;
    },

    get: function(k, c) {
        sync.remote.get(k, c);
    },

    set: function(k) {
        if (!sync.record(k) || sync.id != null)
            return;

        var l = throttle.measure();
        if (l > 0) {
            sync.id = window.setTimeout(function() {
                sync_events.send();
                delete sync.id;
            }, l);
            return;
        }

        sync_events.send();
    },

    response: function(keys, err) {}
});
