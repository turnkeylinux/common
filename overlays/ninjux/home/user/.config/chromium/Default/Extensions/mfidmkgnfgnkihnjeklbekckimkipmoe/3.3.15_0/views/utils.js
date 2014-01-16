function $(i) {return document.getElementById(i);}
function template(s) {return document.querySelector('template.'+s).content;}

function adapter(k) {
    this.key = 'data.' + k;
    this.patterns = new properties(window.localStorage, default_patterns);
}

adapter.prototype.getData = function() {
    return this.patterns.object(this.key);
};

adapter.prototype.setData = function(d) {
    this.patterns.set(this.key, d);
};

function relayEvent(elm, evt, sel, fn, capt) {
    var elem = typeof elm === 'string' ? document.querySelectorAll(elm) : [elm];
    for (var i = 0; i < elem.length; i++) {
        elem[i].addEventListener(evt, function(e) {
            var i = 0;
            var el;
            var target = e.target;
            var children = e.currentTarget.querySelectorAll(sel);
            while ((el = children[i++])) {
                if (el === target || el.contains(target)) {
                    var ret = fn.call(el, {
                        target: target,
                        relayTarget: el,
                        currentTarget: e.currentTarget,
                        keyIdentifier: e.keyIdentifier,
                        keyCode: e.keyCode,
                        preventDefault: function() {e.preventDefault();},
                        stopPropagation: function() {e.stopPropagation();}
                    });
                    if (!ret)
                        e.preventDefault();
                    return ret;
                }
            }
        }, !!capt);
    }
}

function getChildPosition(e) {
    var i = 0, el = e;
    while (el = el.previousElementSibling)
        i++;
    return i;
}

function getPlatform() {
    if (navigator.userAgent.match(/Windows NT/)) return 'windows';
    else if (navigator.userAgent.match(/Mac OS X/)) return 'mac';
    return 'linux';
}
