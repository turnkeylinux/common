var filterset = {};
var interfaces = {};
var context = {};

var port = {
    open: function() {
        port._ = chrome.tabs.connect(context.id, {name: 'port_' + Date.now()});
        port._.onDisconnect.addListener(window.close);
        port._.onMessage.addListener(function(m) {
            resources.update(m);
        });
    },

    close: function() {
        port._ && port._.disconnect();
        delete port._;
    },

    send: function(m) {
        port._.postMessage(m);
    }
};

var requestinfo = {
    element: null,

    add: function(n, v, x) {
        var l = template('prop').cloneNode(true);
        l.querySelector('.prop-info-name').innerText = n;
        l.querySelector('.prop-info-value').innerText = v;
        l.querySelector('.prop-info-value').className += (x || '');
        this.element.appendChild(l);
    }
};

var strings = {
    AUTH: 'This website is {0}listed.',
    NOCENS: 'This website has no filters.',
    NORESRC: 'This webpage has no Flash elements.',
    PTRNDUP: 'The pattern already exists.',
    LIVEMODE: 'Live Filtering is {0}.\nClick to {1}.',
    CLPSMODE: '{0} console'
};

var main_event_handler = {
    onNavigate: function(e) {
        if (e.relayTarget.classList.contains('selected'))
            return;
        var el = e.currentTarget.querySelector('.selected');
        el.classList.remove('selected');
        el = el.children[0];
        document.querySelector(el.getAttribute('href')).classList.remove('selected');
        el = e.relayTarget;
        el.classList.add('selected');
        el = el.children[0];
        document.querySelector(el.getAttribute('href')).classList.add('selected');
    }
};

var slider = {
    descriptor: function(e) {
        /*
         bounds(x/z) based on width/height properties.
         100% --- 0%
          |
          |
          0%
        */
        var o = {};
        if (e.target.classList.contains('vertical-split')) {
            o.l = e.target.parentNode.offsetWidth;
            o.i = e.target.offsetWidth + e.target.offsetLeft - e.clientX;
            o.axis = 'clientX';
            o.prop = 'right';
            o.size = 'width';
        }
        if (e.target.classList.contains('horizontal-split')) {
            o.l = e.target.parentNode.offsetHeight;
            o.i = e.target.offsetHeight + e.target.offsetTop - e.clientY;
            o.axis = 'clientY';
            o.prop = 'bottom';
            o.size = 'height';
        }
        o.x = ~~(e.target.dataset.min * o.l / 100);
        o.z = ~~(e.target.dataset.max * o.l / 100);
        return o;
    },

    slide: function(e, p, c) {
        var ps = e.previousElementSibling.style;
        var ns = e.nextElementSibling.style;
        animate(e, {
            bottom: {value:p, unit:'px'}
        }, {
            duration:300,
            callback: c,
            easing: function(timediff, base, change, duration) {
                var v = (timediff === duration) ? base + change : change *
                    (-Math.pow(2, -10 * timediff / duration) + 1) + base;
                ps.bottom = v + 'px';
                ns.height = v + 'px';
                return v;
            }
        });
    },

    expand: function(e, c) {
        var d = slider.descriptor({target:e, clientY:0});
        slider.slide(e, Math.max(d.z, Math.min(d.x, e.dataset.pos || d.x)), c);
    },

    collapse: function(e, c) {
        e.dataset.pos = e.parentNode.offsetHeight - (e.offsetTop + e.offsetHeight);
        slider.slide(e, 0, c);
    },

    slider: function(e) {
        var n = e.target;
        var d = slider.descriptor(e);
        return function(e) {
            var p = Math.max(d.z, Math.min(d.x, d.l - e[d.axis] - d.i)) + 'px';
            n.previousElementSibling.style[d.prop] = p;
            n.nextElementSibling.style[d.size] = p;
            n.style[d.prop] = p;
        }
    }
};

var events = {
    resources: {
        referrer: function(e) {
            if (e.relayTarget.classList.contains('selected'))
                return;

            this.requests(e.relayTarget.innerText);

            e.currentTarget.querySelector('.selected').classList.remove('selected');
            e.relayTarget.classList.add('selected');

            message('', '#resources .view:last-child');
        },

        request: function(e) {
            var m = $('referrer').querySelector('.selected');
            m = this.caught[m.innerText][getChildPosition(e.relayTarget)];
            this.info(m);
        },

        clear: function(e) {
            message('', '#resources .view:last-child');
        },

        statusbar: function(e) {
            if (e.relayTarget.classList.contains('statusbar-reload')) {
                this.caught = {};
                this.clear();
                port.close();
                port.open();
                resourceRequest();
            }
        },

        slide: function(e) {
            var f = slider.slider(e);
            var g = document.createElement('div');

            e.preventDefault();

            g.className = 'glass-pane resize-x';
            document.body.appendChild(g);

            document.addEventListener('mouseup', function(e) {
                document.removeEventListener('mouseup', arguments.callee, false);
                document.removeEventListener('mousemove', f, false);
                document.body.removeChild(g);
            }, false);

            document.addEventListener('mousemove', f, false);
        }
    },

    filterview: {
        filter: function(e) {
            var i = getChildPosition(e.relayTarget.parentNode);

            if (e.relayTarget.classList.contains('delete')) {
                var p = this.filters.removePattern(this.index, i);
                this.filters.commitChanges();

                if (this.live) {
                    filterRequest([{
                        type: stringMap(this.id),
                        enabled: false,
                        pattern: p.pattern
                    }]);
                }

                e.currentTarget.removeChild(e.relayTarget.parentNode);
                if (e.currentTarget.children.length === 0)
                    message(strings.NOCENS, '#' + this.id + ' .view:first-child');
            }

            if (e.relayTarget.classList.contains('enable')) {
                this.filters.setFilterGroupProperty(this.index, i,
                    'enabled', e.relayTarget.checked);
                this.filters.commitChanges();

                if (this.live) {
                    filterRequest([{
                        type: stringMap(this.id),
                        enabled: e.relayTarget.checked,
                        pattern: e.relayTarget.parentNode.querySelector('.text').innerText
                    }]);
                }

                return true;
            }
        },

        statusbar: function(e) {
            if (e.relayTarget.classList.contains('statusbar-console')) {
                if (this.resizing)
                    return;

                this.resizing = true;

                var t = this;
                if (!this.deployed) {
                    slider.expand($(this.id).querySelector('.splitter'), function() {
                        $(t.id).querySelector('.console').classList.remove('collapsed');
                        $(t.id).querySelector('.console .console-input').scrollIntoView();
                        $(t.id).querySelector('.console .input').focus();
                        delete t.resizing;
                    });
                    e.relayTarget.classList.add('active');
                }
                else {
                    $(this.id).querySelector('.console').classList.add('collapsed');
                    slider.collapse($(this.id).querySelector('.splitter'), function() {
                        delete t.resizing;
                    });
                    e.relayTarget.classList.remove('active');
                }

                this.deployed = !this.deployed;

                e.relayTarget.setAttribute('title',
                    format(strings.CLPSMODE, this.deployed ? 'Collapse' : 'Expand'));
            }

            if (e.relayTarget.classList.contains('statusbar-delete')) {
                var g = this.filters.removeGroup(this.index);
                this.filters.commitChanges();

                if (g && g.patterns.length > 0) {
                    if (this.live) {
                        var k = stringMap(this.id);
                        g = g.patterns.map(function(i) {
                            return {
                                type: k,
                                enabled: false,
                                pattern: i.pattern
                            };
                        });
                        filterRequest(g);
                    }
                }

                this.clear();
            }

            if (e.relayTarget.classList.contains('statusbar-live')) {
                var str = ['disable', 'enable'];
                this.live = e.relayTarget.classList.toggle('active');
                e.relayTarget.setAttribute('title', format(strings.LIVEMODE,
                    str[+this.live] + 'd', str[+!this.live]));
            }
        },

        splitter: function(e) {
            var f = slider.slider(e);
            var g = document.createElement('div');
            var h = e.target;

            e.preventDefault();

            g.className = 'glass-pane resize-y';
            document.body.appendChild(g);

            document.addEventListener('mouseup', function(e) {
                document.removeEventListener('mouseup', arguments.callee, false);
                document.removeEventListener('mousemove', f, false);
                document.body.removeChild(g);
                h.dataset.pos = parseInt(window.getComputedStyle(h, null)['bottom']);
            }, false);

            document.addEventListener('mousemove', f, false);
        },

        input: function(e) {
            if (e.keyIdentifier === 'Enter') {
                e.preventDefault();
                var q = e.relayTarget.innerText.trim();
                e.relayTarget.innerText = '';
                e.relayTarget.focus();
                if (q) {
                    this.history.put(q);
                    this.pointer = this.history.size();

                    var t = template('output');
                    var n = e.currentTarget.querySelector('.console-messages');
                    var p = e.currentTarget.querySelector('.console-input');

                    var o, m = q, c = 'command';

                    var l = $(this.id).querySelectorAll('.listbox.patterns .list-item .text');
                    for (var i = 0; i < l.length; i++) {
                        if (l[i].innerText === q) {
                            o = t.cloneNode(true);
                            o.querySelector('.text').innerText = q;
                            o.querySelector('.text').classList.add('command');
                            o.querySelector('.text').classList.add('invalid');
                            n.insertBefore(o, p);
                            m = 'The pattern already exists.';
                            c = 'error';
                            break;
                        }
                    }

                    o = t.cloneNode(true);
                    o.querySelector('.text').innerText = m;
                    o.querySelector('.text').classList.add(c);

                    n.insertBefore(o, p);
                    p.scrollIntoView();

                    if (c !== 'error') {
                        this.pattern(q);

                        if (this.live)
                            filterRequest([{
                                type: stringMap(this.id),
                                enabled: true,
                                pattern: q
                            }]);
                    }
                }
            }

            if (e.keyIdentifier === 'Up') {
                e.preventDefault();
                this.pointer = Math.max(0, Math.min(this.history.size() - 1, --this.pointer));
                e.relayTarget.innerText = this.history.peek(this.pointer) || '';
            }

            if (e.keyIdentifier === 'Down') {
                e.preventDefault();
                this.pointer = Math.max(0, Math.min(this.history.size() - 1, ++this.pointer));
                e.relayTarget.innerText = this.history.peek(this.pointer) || '';
            }

            return true;
        }
    }
};

var resources = {
    caught: {},

    init: function() {
        relayEvent($('referrer'), 'click', '.list-item',
            events.resources.referrer.bind(resources));
        relayEvent($('request'), 'click', '.list-item',
            events.resources.request.bind(resources));
        relayEvent($('resources').querySelector('.view:last-child'), 'click', '.delete',
            events.resources.clear.bind(resources));
        relayEvent($('resources').querySelector('.status-bar'), 'click', '.statusbar-item',
            events.resources.statusbar.bind(resources));
        $('resources').querySelector('.splitter').addEventListener('mousedown',
            events.resources.slide.bind(resources), false);
    },

    update: function(data) {
        var origin = data['origin'];
        var payload = data['payload'];
        if (payload.length === 0 && !resources.dirty) {
            message(strings.NORESRC, '#resources .content');
            return;
        }

        resources.dirty = true;

        var found = origin in resources.caught;

        resources.caught[origin] = resources.caught[origin] || [];
        resources.caught[origin] = resources.caught[origin].concat(payload);

        if (!found)
            resources.referrer(origin);

        if ($('referrer').querySelector('.selected').innerText === origin)
            resources.requests(origin);

        message('', '#resources .content');
    },

    info: function(m) {
        var j = template('info').cloneNode(true);
        var i = Object.create(requestinfo);
        i.element = j.querySelector('ol');
        i.add('Request URL:', m['src']);
        i.add('Status:', stringMap(m['status']), ' status-icon status-' + m['status']);
        i.add('Host:', m['host']);
        i.add('Referer:', m['ref']);
        i.add('Width:', m['width']);
        i.add('Height:', m['height']);
        i.add('Type:', m['type']);
        i.add('Flash Vars:', m['vars']);
        $('resources').querySelector('.view:last-child').appendChild(j);
    },

    referrer: function(o) {
        var l = document.createElement('li');
        l.className = 'list-item';
        l.innerText = o;
        if (getChildPosition($('referrer').appendChild(l)) === 0)
            l.classList.add('selected');
    },

    requests: function(o) {
        var r = $('request');

        r.textContent = '';

        var t, u, v = resources.caught[o];
        for (var i = 0; i < v.length; i++) {
            t = template('request').cloneNode(true);
            l = t.querySelector('.list-item');
            l.classList.add('status-icon');
            l.classList.add('status-' + v[i]['status']);
            l.innerText = v[i]['src'] || '\u00A0';
            r.appendChild(t);
        }
    },

    clear: function() {
        $('referrer').textContent = '';
        $('request').textContent = '';
        delete resources.dirty;
        message('', '#resources .view:last-child');
    }
};

function filterview() {
    this.id = '';
    this.index = -1;
    this.live = false;
    this.listed = false;
    this.filters = [];
}

filterview.prototype = {
    history: new Queue(),
    pointer: -1,

    init: function() {
        relayEvent($(this.id).querySelector('.listbox.patterns'), 'click', '.enable, .delete',
            events.filterview.filter.bind(this));
        relayEvent($(this.id).querySelector('.console'), 'keydown', '.input',
            events.filterview.input.bind(this));
        relayEvent($(this.id).querySelector('.status-bar'), 'click', '.statusbar-item',
            events.filterview.statusbar.bind(this));
        $(this.id).querySelector('.splitter').addEventListener('mousedown',
            events.filterview.splitter.bind(this), false);
    },

    update: function() {
        if (this.listed) {
            message(format(strings.AUTH, stringMap(this.id)), '#' + this.id + ' .view:first-child');
            return;
        }

        var g = [], h;
        this.filters.list().some(function(f, i) {
            if (f.root && regexp.create(f.root).test(context.url)) {
                h = i;
                g = f.patterns;
                return true;
            }
        });

        if (g.length === 0) {
            this.clear();
            return;
        }

        this.index = h;

        this.patterns(g);
    },

    pattern: function(t) {
        var b = this.filters.some(function(f, i) {
            if (f.root && regexp.create(f.root).test(context.url)) {
                this.filters.addPattern(i, {
                    pattern: t,
                    enabled: true
                });
                return true;
            }
        }, this);

        if (!b) {
            this.filters.addGroup({
                'root': origin(context.url) + '/',
                'name': 'new group',
                'enabled': true,
                'patterns': [{'pattern': t, 'enabled': true}]
            });
        }

        this.filters.commitChanges();

        this.update();
    },

    patterns: function(g) {
        var l = $(this.id).querySelector('.listbox.patterns');

        l.textContent = '';

        var n, m = template('pattern');
        for (var i = 0; i < g.length; i++) {
            n = m.cloneNode(true);
            n.querySelector('input').checked = g[i].enabled;
            n.querySelector('.text').innerText = g[i].pattern;
            l.appendChild(n);
        }

        if (l.lastElementChild)
            l.lastElementChild.scrollIntoView();

        message('', '#' + this.id + ' .view:first-child');
    },

    clear: function() {
        $(this.id).querySelector('.listbox.patterns').textContent = '';
        message(strings.NOCENS, '#' + this.id + ' .view:first-child');
    }
};

function resourceRequest() {
    port.send({'cmd':'resources'});
}

function filterRequest(data) {
    chrome.extension.getBackgroundPage().filterTab(context.id, data);
}

function loadTabProfile() {
    var params = parseQueryParams();
    context.id = +params['id'];
    context.url = chrome.extension.getBackgroundPage().tabs[params['id']].url;
    document.title = 'FlashControl Resources Panel - ' + params['url'];
}

function parseQueryParams() {
    var kv;
    var params = {};
    var query = document.location.search.substring(1).split('&');
    query.forEach(function(pair) {
        kv = pair.split('=');
        params[kv[0]] = decodeURIComponent(kv[1]);
    });
    return params;
}

function message(m, s) {
    var n = document.querySelector(s);
    var e = n.querySelectorAll('.message-panel');

    for (var i = 0; i < e.length; i++)
        e[i].parentNode.removeChild(e[i]);

    if (m) {
        e = template('message').cloneNode(true);
        e.querySelector('.text').innerText = m;
        if (n.firstElementChild)
            n.insertBefore(e, n.firstElementChild);
        else
            n.appendChild(e);
    }
}

function stringMap(s) {
    return {
        'blacklisted': 'denied',
        'whitelisted': 'allowed',
        'gblacklisted': 'denied',
        'gwhitelisted': 'allowed',
        'sameDomain': 'same domain',
        'patternlistB': 'white',
        'patternlistD': 'black'
    }[s] || s;
}

document.addEventListener('DOMContentLoaded', function() {
    document.body.classList.add('platform-' + getPlatform());
    loadTabProfile();
    relayEvent('.navigation', 'click', 'li', main_event_handler.onNavigate);
    resources.init();
    port.open();
    resourceRequest();
    'BD'.split('').forEach(function(s) {
        var k = 'patternlist' + s;
        filterset[k] = new filters(new adapter(k));
        filterset[k].update();
        interfaces[k] = new filterview();
        interfaces[k].id = k;
        interfaces[k].filters = filterset[k];
        interfaces[k].init();
    });
    var info = chrome.extension.getBackgroundPage().getTabState(context.id);
    interfaces['patternlistB'].listed = info.whitelisted;
    interfaces['patternlistD'].listed = info.blacklisted;
    interfaces['patternlistB'].update();
    interfaces['patternlistD'].update();
}, false);

window.addEventListener('storage', function(event) {
    var keys = event.key.split('.');
    if (keys[0] === 'data') {
        if (/patternlist[BD]/.test(keys[1])) {
            filterset[keys[1]].update();
            interfaces[keys[1]].update();
        }
    }
}, false);
