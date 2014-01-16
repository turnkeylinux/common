var _paths = {};

function paths() {
    if (arguments.length === 2) {
        var p = arguments[0] === '/' ? arguments[0].substr(1) : arguments[0];
        p = !p || p[p.length - 1] === '/' ? p : p + '/';
        _paths[p] = Array.prototype.slice.call(arguments[1], 0);
        return;
    }

    var v = /\.(.*)$/.exec(arguments[0]);
    if (!v)
        return;
    for (var k in _paths) {
        if (_paths[k].indexOf(v[1]) !== -1)
            return chrome.extension.getURL('') + k + arguments[0];
    }
}
