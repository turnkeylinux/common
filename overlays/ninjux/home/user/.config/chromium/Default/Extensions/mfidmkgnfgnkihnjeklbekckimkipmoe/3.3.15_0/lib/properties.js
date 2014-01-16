function properties(s, d) {
    this.storage = s || {};
    this.defaults = copy({}, d || {});
}

properties.prototype.set = function(k, v) {
    if (v == null)
        return delete this.storage[k];
    this.storage[k] = typeof v !== 'string' ?
        JSON.stringify(v) : v;
};

properties.prototype.get = function(k, d) {
    var v = this.storage[k];
    return v != null ?
        v : (k in this.defaults ? this.defaults[k] : d);
};

properties.prototype.object = function(k, d) {
    var v = this.get(k, d);
    return v != null ?
        (typeof v === 'string' ? JSON.parse(v) : v) : v;
};

properties.prototype.boolean = function(k, d) {
    return Boolean(this.object(k, d));
};

properties.prototype.number = function(k, d) {
    return Number(this.object(k, d));
};


properties.prototype.keys = function() {
    var d = [], l = Object.keys(this.storage);
    for (var i = 0; i < l.length; i++)
        l[i] in this.defaults && d.push(l[i]);
    return d;
};

properties.prototype.copy = function(l) {
    var d = {};
    for (var i = 0; i < l.length; i++)
        d[l[i]] = this.object(l[i]);
    return d;
};
