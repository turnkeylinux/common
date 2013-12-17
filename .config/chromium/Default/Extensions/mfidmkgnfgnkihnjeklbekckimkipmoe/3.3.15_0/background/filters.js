var targets = {
    extract: function(l) {
        var n = [], i = l.length;
        while (i--)
            l[i].enabled && n.push(regexp.create(l[i].pattern));
        return n;
    },

    update: function(l, u, p, v) {
        var i = l.length;
        while (i--)
            if (regexp.create(l[i].pattern).test(u)) {
                l[i].enabled = v;
                return l;
            }
        l.push({
            'enabled': v,
            'pattern': p
        });
        return l;
    }
};

var sources = {
    extract: function(l) {
        var n = Object.create(null), i = l.length, e = [];
        while (i--)
            l[i].root && l[i].enabled && e.push(i);
        i = e.length;
        while (i--) {
            var p = [], x = l[e[i]], q = x.patterns;
            for (var j = 0, jl = q.length; j < jl; j++)
                q[j].enabled && p.push(q[j].pattern);
            n[x.root] = p;
        }
        return n;
    },

    update: function(s, l, u) {
        var i = l.length;
        while (i--) {
            var item = l[i];
            if (s === item.root) {
                var arr = item.patterns;
                for (var j = arr.length - 1; j >= 0; j--) {
                    if (u === arr[j].pattern)
                        return l;
                }
                arr.push({
                    'enabled': true,
                    'pattern': u
                });
                return l;
            }
        }
        l.push({
            'root': s,
            'patterns': [{
                'enabled': true,
                'pattern': u}],
            'name': 'new group',
            'enabled': true
        });
        return l;
    },

    search: function(g, u) {
        for (var k in g) {
            if (regexp.create(k).test(u)) {
                var f = g[k], i = f.length, l = [];
                while (i--)
                    l.push(f[i]);
                return l;
            }
        }
    }
};
