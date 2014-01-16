var omni = {
    update: function(i) {
        omni.refresh(i);
        omni.tooltip(i);
    },

    show: function(i, v) {
        if (v) omni.refresh(i), omni.tooltip(i), chrome.pageAction.show(i);
        else chrome.pageAction.hide(i);
    },

    tooltip: function(i) {
        var t = tabs[i];
        var count = t.found | 0;
        var title = !prefs.enabled ? 'disabled' :
            (t.status === 'allow' ? 'whitelisted' :
                (t.status === 'deny' ? 'blacklisted' :
                    (t.blocked ? 'blocked' : 'unblocked')));
        chrome.pageAction.setTitle({
            'tabId': i,
            'title': format('{0}\r{1}', format('Status: {0}', title),
                format('Found: {0} object{1}', count, count != 1 ? 's' : ''))
        });
    },

    refresh: function(i) {
        var t = tabs[i], u = {tabId: i, path: {}};
        if (prefs.enabled) {
            if (t.status === 'allow') {
                u.path[19] = 'graph/whitelisted.png';
                u.path[38] = 'graph/whitelisted38.png';
            }
            else if (t.status === 'deny') {
                u.path[19] = 'graph/blacklisted.png';
                u.path[38] = 'graph/blacklisted38.png';
            }
            else {
                u.path[19] = 'graph/icon19.png';
                u.path[38] = 'graph/icon38.png';
            }
        }
        else {
            u.path[19] = 'graph/icond19.png';
            u.path[38] = 'graph/icond38.png';
        }
        chrome.pageAction.setIcon(u);
    }
};

function match(t) {
    return function(s) {
        return s.test(t);
    }
}

function exclusion(l) {
    return function(u) {
        return l.some(function(i) {
            return i.test(u);
        });
    }
}

function define(a, b, c, d) {
    var e = d || '';
    Object.defineProperty(a, b, {
        writable: /w/.test(e),
        enumerable: /e/.test(e),
        configurable: /c/.test(e),
        value: c
    });
    return a;
}

function rule(s) {
    this.selector = s;
    this.declarations = {};
}

rule.prototype.add = function(k, v, p) {
    this.declarations[k] = v + (p ? '' : '!important');
};

rule.prototype.remove = function(k) {
    delete this.declarations[k];
};

rule.prototype.format = function() {
    var arr = [];
    var declarations = this.declarations;
    for (var k in declarations)
        arr.push(k + ':' + declarations[k]);
    return format('{0}{{1}}', this.selector, arr.join(';'));
};

function css() {
    this.rules = {};
}

css.prototype.add = function(r) {
    this.rules[r.selector] = r;
};

css.prototype.remove = function(r) {
    delete this.rules[r.selector];
};

css.prototype.format = function() {
    var arr = [];
    var rules = this.rules;
    for (var k in rules)
        arr.push(rules[k].format());
    return arr.join('');
};

function fixStorageEvent(e) {
    var v = e.newValue;
    if (typeof v === 'string') {
        try {
            v = JSON.parse(v);
        }
        catch (err) {
            v = null;
        }
        finally {
            return {key:e.key, newValue:v, oldValue:e.oldValue};
        }
    }
    return e;
}
