/** @interface */
function FilterStoreAdapter() {}

/** @return {Object} */
FilterStoreAdapter.prototype.getData = function() {};

/** @param {Array.<SimpleFilter|ContentFilter>} data */
FilterStoreAdapter.prototype.setData = function(data) {};

/**
 * @param {FilterStoreAdapter} adapter
 * @constructor
 */
var filters = function(adapter) {
    /** @private */
    this.adapter = adapter;

    /** @private */
    this.cache = [];
};

/**
 * @param {number} group
 * @param {string} key
 * @param {string|boolean|Array.<SimpleFilter|ContentFilter>} val
 */
filters.prototype.setFilterProperty = function(group, key, val) {
    this.cache[group][key] = val;
};

/**
 * @param {number} group
 * @param {number} index
 * @param {string} key
 * @param {string|boolean} val
 */
filters.prototype.setFilterGroupProperty = function(group, index, key, val) {
    this.cache[group]['patterns'][index][key] = val;
};

/** @param {SimpleFilter|ContentFilter} group */
filters.prototype.addGroup = function(group) {
    this.cache.push(group);
};

/**
 * @param {number} group
 * @param {SimpleFilter|ContentFilter} pattern
 */
filters.prototype.addPattern = function(group, pattern) {
    this.cache[group]['patterns'].push(pattern);
};

/**
 * @param {number} group
 * @return {SimpleFilter|ContentFilter}
 */
filters.prototype.getGroup = function(group) {
    return this.cache[group];
};

/**
 * @param {number} group
 * @param {number} pattern
 * @return {SimpleFilter|ContentFilter}
 */
filters.prototype.removePattern = function(group, pattern) {
    return this.cache[group]['patterns'].splice(pattern, 1)[0];
};

/**
 * @param {number} group
 * @return {SimpleFilter|ContentFilter}
 */
filters.prototype.removeGroup = function(group) {
    return this.cache.splice(group, 1)[0];
};

/** @return {boolean} */
filters.prototype.empty = function() {
    return this.cache.length == 0;
};

filters.prototype.clear = function() {
    this.cache = [];
};

/**
 * @param {function((SimpleFilter|ContentFilter), number)} func
 * @param {Object=} context
 */
filters.prototype.each = function(func, context) {
    this.cache.forEach(func, context);
};

/**
 * @param {function((SimpleFilter|ContentFilter), number)} func
 * @param {Object=} context
 */
filters.prototype.some = function(func, context) {
    return this.cache.some(func, context);
};

/**
 * @param {function((SimpleFilter|ContentFilter), number)} func
 * @param {Object=} context
 */
filters.prototype.every = function(func, context) {
    return this.cache.every(func, context);
};

filters.prototype.list = function() {
    return this.cache;
};

filters.prototype.update = function() {
    this.cache = this.adapter.getData() || [];
};

filters.prototype.commitChanges = function() {
    this.adapter.setData(/** @type {Array.<SimpleFilter|ContentFilter>} */(this.cache));
};
