var AnimationUtil = {
    regexp: /#([a-f0-9]{1,2})([a-f0-9]{1,2})([a-f0-9]{1,2})|rgba?\((\d+)\D+(\d+)\D+(\d+)\D*\d*\)/i,

    easeLinear: function(timediff, base, change, duration) {
        return change * timediff / duration + base;
    },

    parse: function(value) {
        var val;
        if (val = AnimationUtil.regexp.exec(value)) {
            return {
                r: val[1] ? parseInt(val[1] + (val[1].length === 1 ? val[1] : ''), 16) : parseInt(val[4], 10),
                g: val[1] ? parseInt(val[2] + (val[2].length === 1 ? val[2] : ''), 16) : parseInt(val[5], 10),
                b: val[1] ? parseInt(val[3] + (val[3].length === 1 ? val[3] : ''), 16) : parseInt(val[6], 10)
            };
        }
    },

    init: function(elem, time) {
        var value, attr, obj, answer = [], isObj, fromValue;
        elem.fx.start = time;
        elem.fx.from = [];
        for (attr in elem.fx.queue[0].attr) {
            value = elem.fx.queue[0].attr[attr];
            isObj = typeof value === 'object';
            if (isObj && value.unit === 'color') {
                if (typeof value.value === 'string')
                    value.value = AnimationUtil.parse(value.value);
                fromValue = AnimationUtil.parse(window.getComputedStyle(elem, null)[attr]);
                elem.fx.from[elem.fx.from.length] = fromValue ? fromValue : {r:0, g:0, b:0};
            }
            else {
                if (!isObj) {
                    obj = {};
                    obj.value = value;
                    obj.unit = 'px';
                    value = obj;
                }
                else
                    value.unit = value.unit !== undefined ? value.unit : 'px';
                fromValue = parseFloat(window.getComputedStyle(elem, null)[attr]);
                elem.fx.from[elem.fx.from.length] = isNaN(fromValue) ? 0 : fromValue;
            }
            value.attr = attr;
            answer[answer.length] = value;
        }
        elem.fx.queue[0].attr = answer;
    }
};

function killAnimation(element) {
    var elem = element;
    if (elem.fx && elem.fx.timer) {
        window.clearTimeout(elem.fx.timer);
        elem.fx = false;
    }
    return elem;
}

function animate(element, attributes, options) {
    var elem = element, newRow = {};
    options = options || {};
    newRow.attr = attributes;
    newRow.callback = options.callback;
    newRow.duration = options.duration || 1000;
    newRow.easing = options.easing || AnimationUtil.easeLinear;
    if (elem.fx)
        elem.fx.queue.push(newRow);
    else {
        elem.fx = {};
        elem.fx.queue = [newRow];
        AnimationUtil.init(elem, Number(new Date));
        var step = function() {
            var timediff = Number(new Date) - elem.fx.start,
                current = elem.fx.queue[0],
                duration = current.duration,
                style = ';',
                i = 0,
                row, value, from;
            duration < timediff && (timediff = duration);
            for (; i < elem.fx.queue[0].attr.length; i++) {
                row = elem.fx.queue[0].attr[i];
                from = elem.fx.from[i];
                if (row.unit === 'color') {
                    style += row.attr +
                        ':rgb(' + 0|(current.easing(timediff, from.r, row.value.r - from.r, duration)) +
                        ',' + 0|(current.easing(timediff, from.g, row.value.g - from.g, duration)) +
                        ',' + 0|(current.easing(timediff, from.b, row.value.b - from.b, duration)) + ')';
                }
                else {
                    value = current.easing(timediff, from, row.value - from, duration);
                    style += row.attr === 'opacity' ?
                        'visibility:' + (value !== 0 ? 'visible;' : 'hidden') + ';opacity:' + value + ';' :
                        row.attr + ':' + value + row.unit + ';';
                }
            }
            elem.style.cssText += style;
            if (duration === timediff) {
                if (typeof elem.fx.queue[0].callback === 'function')
                    elem.fx.queue[0].callback.call(elem);
                elem.fx.queue.shift();
                if (elem.fx.queue.length === 0) {
                    elem.fx = false;
                    return;
                }
                else
                    AnimationUtil.init(elem, elem.fx.start + timediff);
            }
            elem.fx.timer = window.setTimeout(step, 30);
        };
        elem.fx.timer = window.setTimeout(step, 30);
    }
    return elem;
}
