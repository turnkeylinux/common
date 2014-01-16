/** @constructor */

function Queue() {

    /** @private */
    this.queue = [];

    /** @private */
    this.space = 0;
}

/** @return {number} */
Queue.prototype.size = function() {
    return this.queue.length - this.space;
};

/** @return {boolean} */
Queue.prototype.empty = function() {
    return this.queue.length < 1;
};

Queue.prototype.clear = function() {
    this.queue = [];
    this.space = 0;
};

/** @param {*} item */
Queue.prototype.put = function(item) {
    this.queue.push(item);
};

/** @return {*} */
Queue.prototype.get = function() {
    var item;
    if (this.queue.length) {
        item = this.queue[this.space];
        if (++this.space * 2 >= this.queue.length) {
            this.queue = this.queue.slice(this.space);
            this.space = 0;
        }
    }
    return item;
};

/**
 * @param {number=} index
 * @return {*}
 */
Queue.prototype.peek = function(index) {
    return this.queue.length ? this.queue[index || this.space] : undefined;
};

/**
 * @extends {Array}
 * @constructor
 */

function ManagedArray() {

    /** @private */
    this.queue = new Queue();
}

ManagedArray.prototype = [];

/**
 * @param {*} obj
 * @return {number}
 */
ManagedArray.prototype.insert = function(obj) {
    if (!isNaN(this.queue.peek())) {
        var index = /** @type {number} */(this.queue.get());
        this[index] = obj;
        return index;
    }
    return this.push(obj) - 1;
};

/** @param {number} index */
ManagedArray.prototype.remove = function(index) {
    if (index < this.length) delete this[index], this.queue.put(index);
};

/** @return {number} */
ManagedArray.prototype.free = function() {
    return this.queue.size();
};

ManagedArray.prototype.clear = function() {
    for (var i = 0, il = this.length; i < il; i++) delete this[i];
    this.length = 0;
    this.queue.clear();
};
