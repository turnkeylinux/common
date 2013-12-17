/**
 * @param {...} var_args
 * @return {string}
 */
function format(var_args) {
    var v = Array.prototype.slice.call(arguments, 1);
    return arguments[0].replace(/\{\d+\}/g, function(c) {
        return v[c.match(/\d+/)];
    });
}

function type(o) {
    var v;
    if (v = /(undefined|string|number|boolean)/.exec(typeof o)) return v[1];
    var t = Object.prototype.toString.call(o).toLowerCase();
    return /\b([a-z]+).$/i.exec(t)[1];
}

function copy(t, s) {
    for (var p in s) {
        var q = s[p];
        if (q && q.constructor && q.constructor === Object)
            t[p] = arguments.callee({}, q);
        else
            t[p] = q;
    }
    return t;
}

function origin(u) {
    var m = /^((?:[a-z]+:(?:[a-z]*:)?\/\/))([^/]+)/i.exec(u);
    return m ? m[1] + m[2] : '';
}

function host(u) {
    var m = /^((?:[a-z]+:(?:[a-z]*:)?\/\/))([^/]+)/i.exec(u);
    return m ? m[2] : '';
}

function nop() {}
