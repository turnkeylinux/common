var colorutil = {
    components: {
        'RGB': {
            'Red': 255,
            'Green': 255,
            'Blue': 255,
            'Alpha': 100
        },
        'HSV': {
            'Hue': 360,
            'Saturation': 100,
            'Value': 100
        },
        'rgb': {
            'R': 255,
            'G': 0,
            'B': 0,
            'A': 1
        },
        'hsv': {
            'H': 0,
            'S': 100,
            'V': 100
        }
    },

    pos: function(e, r, v, i) {
        var s = (i === 'Alpha');
        var cw = e.color_canvas_width + 1;
        var n = s ? (1 - r) * 100 : r;
        e.element.querySelector('#' + i + 'Cur').style.left =
            parseInt((cw - (n / colorutil.components[v][i]) * cw - 5), 10) + 'px';
        e.element.querySelector('#' + i + 'Val').innerText =
            Math.round(s ? 100 - n : n);
    },

    mode: function(r, s) {
        return (s ? r : {
            'R': r['R'],
            'G': r['G'],
            'B': r['B'],
            'A': r['A']
        });
    }
};

/** @constructor */
var colorpicker = function() {
    this.target_canvas = null;
    this.target_canvas_width = 0;
    this.target_canvas_height = 0;
    this.element = null;
    this.color_canvas_width = 150;
    this.color_canvas_height = 18;
    this.stop = true;
};

colorpicker.prototype.init = function(canvas) {
    this.target_canvas = canvas;
    this.target_canvas_width = canvas.width;
    this.target_canvas_height = canvas.height;

    this.element = document.createElement('div');
    this.element.classList.add('color-picker-box');
    this.element.onselectstart = function(e) {
        return false;
    };

    var this_ = this;
    var element = this.element;

    function cOff(e, o, x, y, F) {
        if (this_.stop) {
            var z = 0;
            var tf = element.querySelector('#' + o);
            if (element.offsetParent) {
                do {
                    z += tf.offsetLeft;
                } while (tf = tf.offsetParent);
            }

            var handler = {
                'handleEvent': function(e) {
                    if (e.type === 'mousemove') {
                        e.preventDefault();
                        if (!this_.stop)
                            F(Math.max(x, y ? Math.min(y, (e.clientX - z) + x) : (e.clientX - z) + x));
                    }
                    else {
                        e.preventDefault();
                        this_.stop = true;
                        document.removeEventListener('mousemove', /** @type {EventListener} */(handler), false);
                        document.removeEventListener('mouseup', /** @type {EventListener} */(handler), false);
                        F(Math.max(x, y ? Math.min(y, (e.clientX - z) + x) : (e.clientX - z) + x));
                    }
                }
            };
            this_.stop = false;
            document.addEventListener('mousemove', /** @type {EventListener} */(handler), false);
            document.addEventListener('mouseup', /** @type {EventListener} */(handler), false);
            F(Math.max(x, y ? Math.min(y, (e.clientX - z) + x) : (e.clientX - z) + x));
        }
    }

    function c(v, k) {
        return function(e) {
            e.preventDefault();
            e.stopPropagation();
            var glasspane = document.createElement('div');
            glasspane.classList.add('glass-pane');
            document.addEventListener('mouseup', function() {
                document.removeEventListener('mouseup', arguments.callee, false);
                glasspane.parentNode.removeChild(glasspane);
            }, false);
            element.insertBefore(glasspane, element.firstChild);
            cOff(e, k, 0, this_.color_canvas_width + 1, function(b) {
                var m = colorutil.components[v.toUpperCase()][k];
                var n = Math.max(0, b) / (this_.color_canvas_width + 1);
                colorutil.components[v.toLowerCase()][k[0]] = (k === 'Alpha') ?
                    n : Math.round((1 - n) * m);
                this_.colorize(k);
            });
        }
    }

    var area = element.appendChild(document.createElement('div'));
    area.classList.add('color-picker-area');

    var R = {
        'Hue': 'HSV',
        'Saturation': 'HSV',
        'Value': 'HSV',
        'Red': 'RGB',
        'Green': 'RGB',
        'Blue': 'RGB',
        'Alpha': 'RGB'
    };
    var label, elm, box;
    for (var i in R) {
        elm = label = area.appendChild(document.createElement('div'));
        elm.title = i[0].toUpperCase() + i.substr(1);

        elm = label.appendChild(document.createElement('div'));
        elm.classList.add('west');
        elm.innerText = i.substr(0, 1).toUpperCase();

        box = label.appendChild(document.createElement('div'));
        box.classList.add('color-picker-container');

        elm = box.appendChild(document.createElement('div'));
        elm.classList.add('cur');
        elm.id = i + 'Cur';
        elm.addEventListener('mousedown', c(R[i], i), true);

        elm = box.appendChild(document.createElement('canvas'));
        elm.classList.add('checkered');
        elm.id = i;
        elm.width = this.color_canvas_width;
        elm.height = 16;
        elm.addEventListener('mousedown', c(R[i], i), true);

        elm = label.appendChild(document.createElement('div'));
        elm.classList.add('east');
        elm.id = i + 'Val';
    }
};

/**
 * @param {string} m
 * @param {Object=} r
 */
colorpicker.prototype.colorize = function(m, r) {
    var h;
    var l = (m === 'set' ? 'Red' : m);
    if (r) {
        r = colorutil.components['rgb'] = {
            'R': r[0],
            'G': r[1],
            'B': r[2],
            'A': r[3]
        };
        h = colorutil.components['hsv'] = color.RGB_HSV(r);
    } else {
        r = colorutil.components['rgb'];
        h = colorutil.components['hsv'];
    }
    if (colorutil.components['HSV'][l]) {
        var t = color.HSV_RGB(h);
        t['A'] = r['A'];
        r = colorutil.components['rgb'] = t;
    }
    else if (colorutil.components['RGB'][l]) {
        h = colorutil.components['hsv'] = color.RGB_HSV(r);
    }
    var R = {
        'Hue': [[0,
        {
            'H': 0,
            'S': h['S'],
            'V': h['V']}], [0.15,
        {
            'H': 300,
            'S': h['S'],
            'V': h['V']}], [0.30,
        {
            'H': 240,
            'S': h['S'],
            'V': h['V']}], [0.50,
        {
            'H': 180,
            'S': h['S'],
            'V': h['V']}], [0.65,
        {
            'H': 120,
            'S': h['S'],
            'V': h['V']}], [0.85,
        {
            'H': 60,
            'S': h['S'],
            'V': h['V']}], [1,
        {
            'H': 0,
            'S': h['S'],
            'V': h['V']}]],
        'Saturation': [[0,
        {
            'H': h['H'],
            'S': 100,
            'V': h['V']}], [1,
        {
            'H': h['H'],
            'S': 0,
            'V': h['V']}]],
        'Value': [[0,
        {
            'H': h['H'],
            'S': h['S'],
            'V': 100}], [1,
        {
            'H': h['H'],
            'S': h['S'],
            'V': 0}]],
        'Red': [[0,
        {
            'R': 255,
            'G': r['G'],
            'B': r['B'],
            'A': r['A']}], [1,
        {
            'R': 0,
            'G': r['G'],
            'B': r['B'],
            'A': r['A']}]],
        'Green': [[0,
        {
            'R': r['R'],
            'G': 255,
            'B': r['B'],
            'A': r['A']}], [1,
        {
            'R': r['R'],
            'G': 0,
            'B': r['B'],
            'A': r['A']}]],
        'Blue': [[0,
        {
            'R': r['R'],
            'G': r['G'],
            'B': 255,
            'A': r['A']}], [1,
        {
            'R': r['R'],
            'G': r['G'],
            'B': 0,
            'A': r['A']}]],
        'Alpha': [[0,
        {
            'R': r['R'],
            'G': r['G'],
            'B': r['B'],
            'A': 0}], [1,
        {
            'R': r['R'],
            'G': r['G'],
            'B': r['B'],
            'A': 1}]]
    };
    for (var i in R) {
        var c = this.element.querySelector('#' + i).getContext('2d');
        c.globalCompositeOperation = 'copy';
        var g = c.createLinearGradient(0, 0, this.color_canvas_width, this.color_canvas_height);
        for (var j in R[i]) {
            l = R[i][j];
            var k = l[1];
            if (colorutil.components['HSV'][i]) {
                k = color.HSV_RGB({
                    'H': k['H'],
                    'S': k['S'],
                    'V': k['V']
                });
                k['A'] = r['A'];
            }
            g.addColorStop(l[0], color.RGBA_STR(colorutil.mode(k, isNaN(k['A']) ? 1 : 0)));
        }
        c.rect(0, 0, this.color_canvas_width, this.color_canvas_height);
        c.fillStyle = g;
        c.fill();
        if (colorutil.components['HSV'][i])
            colorutil.pos(this, h[i[0]], 'HSV', i);
        else
            colorutil.pos(this, r[i[0]], 'RGB', i);
    }
    var rc = this.target_canvas.getContext('2d');
    rc.globalCompositeOperation = 'copy';
    rc.fillStyle = color.RGBA_STR(r);
    rc.fillRect(0, 0, parseInt(this.target_canvas_width, 10) * 2,
        parseInt(this.target_canvas_height, 10) * 2);
};

colorpicker.prototype.value = function() {
    return this.target_canvas.getContext('2d').fillStyle;
};
