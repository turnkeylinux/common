var filterset = {};
var userdata = new properties(window.localStorage, default_userdata);
var patterns = new properties(window.localStorage, default_patterns);
var syncdata = new properties(window.localStorage, default_syncdata);

var time = {
    components: function(sec) {
        var s = isNaN(sec) || sec < 0 ? 0 : sec;
        var h = 0|(s / 3600);
        var m = 0|(s / 60) - (h * 60);
        var ss = s - (h * 3600) - (m * 60);
        return [h, m, ss];
    },

    seconds: function(hrs, mins) {
        var h = isNaN(hrs) || hrs < 0 ? 0 : hrs|0;
        var m = isNaN(mins) || mins < 0 ? 0 : mins|0;
        return h * 3600 + m * 60;
    }
};

var listbox = {
    clear: function(u) {
        var e = u.querySelectorAll('.list-item');
        for (var i = 0; i < e.length; i++)
            u.removeChild(e[i]);
    },

    create: function(t, b, s) {
        var e = listbox.template();
        e.title = t;
        e.enabled = b;
        e.placeholder = s;
        return e.element;
    },

    add: function(u, t, b, s) {
        var l = listbox.create(t, b, s);
        u.appendChild(l);
        if (u.classList.contains('filter-names')) {
            l.removeAttribute('placeholder');
            listbox.highlight(u, l);
        }
    },

    highlight: function(u, l) {
        var e = u.querySelector('li.highlighted');
        if (e)
            e.classList.remove('highlighted');
        if (l)
            l.classList.add('highlighted');
    },

    select: function(u, l) {
        var e = u.querySelector('li[selected]');
        if (e)
            e.removeAttribute('selected');
        if (l)
            l.setAttribute('selected', '');
    },

    focus: function(l) {
        var input = l.querySelector('input');
        input.value = l.querySelector('.text').innerText;
        input.focus();
    },

    rename: function(l, s) {
        l.querySelector('.text').innerText = s;
    },

    template: function() {
        var e = template('listitem').cloneNode(true).querySelector('.list-item');
        return {
            set title(s) {
                e.querySelector('.text').innerText = s;
            },
            set enabled(b) {
                e.querySelector('.action').innerText = b ? 'disable' : 'enable';
                if (!b)
                    e.classList.add('disabled');
            },
            set placeholder(s) {
                e.querySelector('.editable input').placeholder = s;
            },
            get title() {
                return e.querySelector('.text').innerText;
            },
            get enabled() {
                return e.querySelector('.action').innerText === 'disable';
            },
            get element() {
                return e;
            }
        };
    }
};

var modal2 = {
    el: null,

    'notify': function(title, content, onDismiss) {
        var el = modal2.el;
        el.querySelector('h1').innerText = title;
        el.querySelector('.content-area').innerText = content;
        onDismiss(function() {
            el.classList.add('transparent');
            window.setTimeout(modal2.hide, 250);
        });
    },

    show: function(type, var_args) {
        if (modal2.el)
            return;
        if (arguments[0] in modal2) {
            modal2.el = document.createElement('div');
            modal2.el.className = 'overlay';
            modal2.el.appendChild(template(arguments[0]).cloneNode(true));
            modal2.el.addEventListener('click', function(e) {
                if (modal2.el !== e.target)
                    return;
                var page = modal2.el.querySelector('.page');
                page.classList.add('pulse');
                page.addEventListener('webkitAnimationEnd', function(e) {
                    page.classList.remove('pulse');
                }, false);
            }, false);
            modal2[arguments[0]].apply(modal2, Array.prototype.slice.call(arguments, 1));
            document.body.appendChild(modal2.el);
        }
    },

    hide: function() {
        if (!modal2.el)
            return;
        document.body.removeChild(modal2.el);
        modal2.el = null;
    }
};

var modal = {
    el: null,

    'info': function(title, content) {
        var el = modal.el;
        el.querySelector('h1').innerText = title;
        el.querySelector('.content-area').innerText = content;
        el.querySelector('.cancel-button').addEventListener('click', function(e) {
            el.classList.add('transparent');
            window.setTimeout(modal.hide, 250);
            e.preventDefault();
        }, false);
        el.querySelector('.cancel-button').focus();
    },

    'reset': function(onSettings, onFilters, xtraInfo) {
        var el = modal.el;
        relayEvent(el, 'click', '.button-strip button, .close-button', function(e) {
            if (e.relayTarget.classList.contains('erase-button')) {
                var s = el.querySelector('.settings-checkbox').checked;
                var f = el.querySelector('.filters-checkbox').checked;
                if (s || f) {
                    modal2.show('notify', '', 'Erasing data...',
                        function(dismiss) {
                            var t = Date.now();
                            if (s)
                                onSettings();
                            if (f)
                                onFilters();
                            window.setTimeout(function() {
                                dismiss();
                                el.querySelector('button.cancel-button').click();
                            }, Math.max(2000 - (Date.now() - t), 0));
                        }
                    );
                    return;
                }
            }
            el.classList.add('transparent');
            window.setTimeout(modal.hide, 250);
            e.preventDefault();
        });
        if (xtraInfo)
            el.querySelector('.description').innerText += xtraInfo;
    },

    'sync': function(onSync, onSettings, onFilters) {
        var el = modal.el;
        relayEvent(el, 'click', '.button-strip button, .close-button, input[type=checkbox]', function(e) {
            if (e.relayTarget.classList.contains('sync-checkbox')) {
                onSync(e.relayTarget.checked);
                return true;
            }
            if (e.relayTarget.classList.contains('settings-checkbox')) {
                onSettings(e.relayTarget.checked);
                return true;
            }
            if (e.relayTarget.classList.contains('filters-checkbox')) {
                onFilters(e.relayTarget.checked);
                return true;
            }
            el.classList.add('transparent');
            window.setTimeout(modal.hide, 250);
            e.preventDefault();
        });
        el.querySelector('.sync-checkbox').checked = onSync();
        el.querySelector('.settings-checkbox').checked = onSettings();
        el.querySelector('.filters-checkbox').checked = onFilters();
    },

    'import': function(onImport, onExport) {
        var el = modal.el;
        relayEvent(el, 'click', '.button-strip button, .close-button, .content-area button', function(e) {
            if (e.relayTarget.classList.contains('import-button')) {
                var s = e.currentTarget.querySelector('.import-input').files[0];
                if (s) {
                    modal2.show('notify', '', 'Importing data...',
                        function(dismiss) {
                            var t = Date.now();
                            onImport(s);
                            window.setTimeout(function() {
                                dismiss();
                                el.querySelector('button.cancel-button').click();
                            }, Math.max(2000 - (Date.now() - t), 0));
                        }
                    );
                }
                return;
            }
            if (e.relayTarget.classList.contains('export-button')) {
                var i = e.currentTarget.querySelector('.export-input');
                onExport(i.value.trim() || i.placeholder);
            }
            el.classList.add('transparent');
            window.setTimeout(modal.hide, 250);
            e.preventDefault();
        });
    },

    'input': function(response) {
        var el = modal.el;
        relayEvent(el, 'click', 'button', function(e) {
            if (e.target.classList.contains('okay-button'))
                response(el.querySelector('input').value.trim());
            el.classList.add('transparent');
            window.setTimeout(modal.hide, 250);
            e.preventDefault();
        });
        var input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter a new file name';
        input.style.width = '100%';
        input.autofocus = true;
        input.addEventListener('keyup', function(e) {
            if (e.keyCode === 13)
                el.querySelector('button.okay-button').click();
            else if (e.keyCode === 27)
                el.querySelector('button.cancel-button').click();
        }, false);
        el.querySelector('.content-area').appendChild(input);
        el.querySelector('h1').innerText = 'Add script';
    },

    'colorpicker': function(onReset, onSave) {
        var el = modal.el;
        var picker = new colorpicker();
        picker.init(el.querySelector('canvas'));
        picker.colorize('set', onReset());
        relayEvent(el, 'click', '.button-strip button, .close-button', function(e) {
            if (e.relayTarget.classList.contains('reset-button')) {
                picker.colorize('set', onReset());
                return;
            }
            if (e.relayTarget.classList.contains('save-button'))
                onSave(picker.value());
            el.classList.add('transparent');
            window.setTimeout(modal.hide, 250);
            e.preventDefault();
        });
        el.querySelector('.content-area').appendChild(picker.element);
    },

    'controlbuttons': function() {
    },

    'placeholdericon': function(onDesaturate, onIcon) {
        var el = modal.el;
        relayEvent(el, 'click', '.button-strip button, .close-button, input[type=checkbox], input[type=radio]',
            function(e) {
                if (e.relayTarget.type === 'checkbox') {
                    var elms = e.currentTarget.querySelectorAll('label div img');
                    var str = e.relayTarget.checked ? '$1d.png' : '$1.png';
                    for (var i = 3; i < elms.length; i++)
                        elms[i].src = elms[i].src.replace(/(icon\d+)\w?\.png$/, str);
                    onDesaturate(e.relayTarget.checked);
                    return true;
                }
                if (e.relayTarget.type === 'radio') {
                    var img = e.relayTarget.previousElementSibling.children[0];
                    var size = +/icon(\d+)\w?\.png$/.exec(img.src)[1];
                    var elms = e.currentTarget.querySelectorAll('img');
                    for (var i = 0; i < elms.length; i++) {
                        if (elms[i] === img) {
                            onIcon(i, size);
                            break;
                        }
                    }
                    return true;
                }
                e.preventDefault();
                el.classList.add('transparent');
                window.setTimeout(modal.hide, 250);
            }
        );
        var desat = onDesaturate();
        el.querySelector('label input[type=checkbox]').checked = desat;
        el.querySelectorAll('label input[type=radio]')[onIcon()].checked = true;
        var elms = el.querySelectorAll('label div img');
        var str = desat ? '$1d.png' : '$1.png';
        for (var i = 3; i < elms.length; i++)
            elms[i].src = elms[i].src.replace(/(icon\d+)\w?\.png$/, str);
    },

    show: function(type, var_args) {
        if (modal.el)
            return;
        if (arguments[0] in modal) {
            modal.el = document.createElement('div');
            modal.el.className = 'overlay';
            modal.el.appendChild(template(arguments[0]).cloneNode(true));
            modal.el.addEventListener('click', function(e) {
                if (modal.el !== e.target)
                    return;
                var page = modal.el.querySelector('.page');
                page.classList.add('pulse');
                page.addEventListener('webkitAnimationEnd', function(e) {
                    page.classList.remove('pulse');
                }, false);
            }, false);
            modal[arguments[0]].apply(modal, Array.prototype.slice.call(arguments, 1));
            document.body.appendChild(modal.el);
        }
    },

    hide: function() {
        if (!modal.el)
            return;
        document.body.removeChild(modal.el);
        modal.el = null;
    }
};

var ui = {
    get: function(input) {
        if (typeof input === 'string') {
            if (input in ui.elemOther)
                ui.elemOther[input]();
            return;
        }
        return (ui.elmIds[input.id] || ui.elmTypes[input.type])(input, true);
    },

    set: function(input) {
        (ui.elmIds[input.id] || ui.elmTypes[input.type])(input);
    },

    elmTypes: {
        'text': function(input, retrieve) {
            if (retrieve)
                return input.value = userdata.get('prefs.' + input.id);
            userdata.set('prefs.' + input.id, input.value);
        },

        'checkbox': function(input, retrieve) {
            if (retrieve)
                return input.checked = userdata.boolean('prefs.' + input.id);
            userdata.set('prefs.' + input.id, +input.checked);
        },

        'select-one': function(input, retrieve) {
            if (retrieve)
                return input.selectedIndex = userdata.number('prefs.' + input.id);
            userdata.set('prefs.' + input.id, input.selectedIndex);
        }
    },

    elmIds: {
        'foreground': function(input, retrieve) {
                if (retrieve)
                    return input.checked = userdata.get('prefs.tabfocus') & 0x01;
                userdata.set('prefs.tabfocus', (userdata.get('prefs.tabfocus') & 0x02) | input.checked);
        },
        'background': function(input, retrieve) {
                if (retrieve)
                    return input.checked = userdata.get('prefs.tabfocus') & 0x02;
                userdata.set('prefs.tabfocus', (userdata.get('prefs.tabfocus') & 0x01) | (input.checked << 1));
        },
        'alltabs': function(input, retrieve) {
                if (retrieve)
                    return input.checked = userdata.get('prefs.idletabs') == 0x00;
                userdata.set('prefs.idletabs', input.checked ^ 0x01);
        },
        'bgtabs': function(input, retrieve) {
                if (retrieve)
                    return input.checked = userdata.get('prefs.idletabs') == 0x01;
                userdata.set('prefs.idletabs', input.checked ^ 0x00);
        },
        'idlehours': function(input, retrieve) {
                if (retrieve)
                    return input.value = time.components(userdata.number('prefs.idleseconds'))[0] || '';
                var comps = time.components(userdata.number('prefs.idleseconds'));
                userdata.set('prefs.idleseconds', time.seconds(input.value, comps[1]));
        },
        'idleminutes': function(input, retrieve) {
                if (retrieve)
                    return input.value = time.components(userdata.number('prefs.idleseconds'))[1] || '';
                var comps = time.components(userdata.number('prefs.idleseconds'));
                userdata.set('prefs.idleseconds', time.seconds(comps[0], input.value));
        },
        'toolbar': function(input, retrieve) {
            if (retrieve)
                return input.checked = userdata.get('prefs.toolbar') & 0x01;
            userdata.set('prefs.toolbar', (userdata.get('prefs.toolbar') & 0x06) | (input.checked ? 0x01 : 0x00));
            userdata.set('prefs.toolbaranimation', input.checked ? 0x00 : 0x03);
        },
        'version': function(input, retrieve) {
            if (retrieve)
                return input.innerText = chrome.runtime.getManifest().version;
        },
        'flash': function(input, retrieve) {
            if (retrieve) {
                var i = window.navigator.plugins['Shockwave Flash'];
                return input.innerText = format('{0} {1}', i.description.replace('Shockwave Flash ', ''), i.filename);
            }
        }
    },

    elemOther: {
        'idleseconds': function() {
            ui.get($('idlehours'));
            ui.get($('idleminutes'));
        },

        'idletabs': function() {
            ui.get($('alltabs'));
            ui.get($('bgtabs'));
        },

        'tabfocus': function() {
            ui.get($('foreground'));
            ui.get($('background'));
        }
    }
};

var main_event_handler = {
    onNavigate: function(e) {
        if (e.relayTarget.classList.contains('selected'))
            return;
        var parent;
        var where;
        if (e.currentTarget.classList.contains('horizontal')) {
            parent = e.currentTarget.parentNode.parentNode;
            where = '.subview';
        }
        else {
            parent = document;
            where = '.mainview';
        }
        parent.querySelector(where + ' > .selected').classList.remove('selected');
        e.currentTarget.querySelector('li.selected').classList.remove('selected');
        e.relayTarget.classList.add('selected');
        var href = e.relayTarget.children[0].getAttribute('href');
        document.querySelector(href).style.display = 'block';
        window.setTimeout(function() {
            document.querySelector(href).classList.add('selected');
        }, 0);
        window.setTimeout(function() {
            var els = parent.querySelectorAll(where + ' > :not(.selected)');
            for (var i = 0; i < els.length; i++)
                els[i].style.display = 'none';
        }, 100);
        window.setTimeout(function() {
            document.body.scrollTop = 0;
        }, 200);
    },

    onClick: function(e) {
        ui.set(e.target);
        return true;
    },

    onBlur: function(e) {
        var error = getError(e.target);
        if (error) {
            modal.show('info', 'Error', error);
            ui.get(e.target);
            return;
        }
        //e.target.value = +e.target.value.trim();// TODO fix '01' values
        ui.set(e.target);
    },

    onKey: function(e) {
        switch (e.keyIdentifier) {
            case 'U+001B':
                ui.get(e.target);
                e.preventDefault();
                break;
            case 'Enter':
                e.target.blur();
                break;
        }
    }
};

var loaders = {
    group_names: function(ul, items) {
        for (var i = 0; i < items.length; i++)
            ul.appendChild(listbox.create(items[i].name, items[i].enabled, 'Enter a name'));
    },
    group_patterns: function(ul, items) {
        for (var i = 0; i < items.length; i++)
            ul.appendChild(listbox.create(items[i].pattern, items[i].enabled, '*/example.swf'));
    }
};

var selective_event_handler = {
    onKeyup: function(e) {
        var elm;
        if (e.keyIdentifier === 'Enter') {
            var group = document.querySelector('.mainview > .selected .group-filter-set.selected');
            var f = filterset[group.id];
            var text = e.target.value.trim();
            if (e.relayTarget.classList.contains('template-list-item')) {
                if (!text) {
                    return;
                }
                if (e.currentTarget.classList.contains('filter-names')) {
                    var disabled = e.relayTarget.querySelector('.action').innerText !== 'enable';
                    f.addGroup({
                        root: '',
                        name: text,
                        enabled: disabled,
                        patterns: []
                    });
                    f.commitChanges();
                    listbox.add(e.currentTarget, text, disabled, 'Enter a name');
                    listbox.select(e.currentTarget);
                    elm = document.querySelector('#' + group.id + ' > :first-child > :last-child');
                    listbox.clear(elm.querySelector('.filter-group'));
                    elm.querySelector('.filter-group-host').value = '';
                    elm.classList.remove('hidden');
                    window.setTimeout(function() {
                        elm.classList.add('visible');
                    }, 0);
                }
                else if (e.currentTarget.classList.contains('filter-group')) {
                    elm = group.querySelector('.filter-names .list-item.highlighted');
                    var disabled = e.relayTarget.querySelector('.action').innerText !== 'enable';
                    f.addPattern(getChildPosition(elm) - 1, {
                        enabled: disabled,
                        pattern: text
                    });
                    f.commitChanges();
                    listbox.add(e.currentTarget, text, disabled, 'http://example.com/*');
                }
                e.target.value = '';
            }
            else if (e.relayTarget.classList.contains('list-item')) {
                if (e.currentTarget.classList.contains('filter-names'))
                    f.setFilterProperty(getChildPosition(e.relayTarget) - 1, 'name', text);
                else if (e.currentTarget.classList.contains('filter-group')) {
                    elm = group.querySelector('.filter-names .list-item.highlighted');
                    f.setFilterGroupProperty(getChildPosition(elm) - 1,
                        getChildPosition(e.relayTarget) - 1, 'pattern', text);
                }
                f.commitChanges();
                listbox.rename(e.relayTarget, text);
                e.target.value = '';
            }
            else if (e.relayTarget.classList.contains('filter-group-host')) {
                elm = group.querySelector('.filter-names .list-item.highlighted');
                f.setFilterProperty(getChildPosition(elm) - 1, 'root', text);
                f.commitChanges();
            }
            e.target.blur();
        }
        else if (e.keyIdentifier === 'U+001B')
            e.target.blur();
    },

    onMousedown: function(e) {
        if (e.target.classList.contains('text')) {
            listbox.highlight(e.currentTarget);
            listbox.select(e.currentTarget, e.relayTarget);
            listbox.focus(e.relayTarget);
            if (e.currentTarget.classList.contains('filter-names')) {
                var group = document.querySelector('.mainview > .selected .group-filter-set.selected');
                var elm = document.querySelector('#' + group.id + ' > :first-child > :last-child');
                var f = filterset[group.id].getGroup(getChildPosition(e.relayTarget) - 1);
                var l = elm.querySelector('.filter-group');
                listbox.clear(l);
                loaders.group_patterns(l, f.patterns);
                elm.querySelector('.filter-group-host').value = f.root;
                elm.classList.remove('hidden');
                window.setTimeout(function() {
                    elm.classList.add('visible');
                }, 0);
            }
            else if (e.currentTarget.classList.contains('filter-group')) {
            }
        }
        else
            return true;
    },

    onClick: function(e) {
        if (e.relayTarget.classList.contains('template-list-item')) {
            if (e.target.classList.contains('action'))
                e.target.innerText = e.target.innerText === 'disable' ? 'enable' : 'disable';
        }
        else if (e.relayTarget.classList.contains('list-item')) {
            var group = document.querySelector('.mainview > .selected .group-filter-set.selected');
            var f = filterset[group.id];
            if (e.target.classList.contains('delete')) {
                if (e.currentTarget.classList.contains('filter-names')) {
                    f.removeGroup(getChildPosition(e.relayTarget) - 1);
                    f.commitChanges();
                    if (e.relayTarget.hasAttribute('selected') || e.relayTarget.classList.contains('highlighted')) {
                        var elm = document.querySelector('#' + group.id + ' > :first-child > :last-child');
                        elm.classList.remove('visible');
                        window.setTimeout(function() {
                            elm.classList.add('hidden');
                        }, 200);
                    }
                }
                else if (e.currentTarget.classList.contains('filter-group')) {
                    var elm = group.querySelector('.filter-names .list-item.highlighted');
                    f.removePattern(getChildPosition(elm) - 1,
                        getChildPosition(e.relayTarget) - 1);
                    f.commitChanges();
                }
                e.currentTarget.removeChild(e.relayTarget);
            }
            else if (e.target.classList.contains('action')) {
                var elm = e.currentTarget.classList.contains('filter-names') ?
                    e.relayTarget : group.querySelector('.filter-names .list-item.highlighted');
                if (e.target.innerText === 'disable') {
                    if (e.currentTarget.classList.contains('filter-names')) {
                        f.setFilterProperty(getChildPosition(elm) - 1, 'enabled', false);
                        f.commitChanges();
                    }
                    else if (e.currentTarget.classList.contains('filter-group')) {
                        f.setFilterGroupProperty(getChildPosition(elm) - 1,
                            getChildPosition(e.relayTarget) - 1, 'enabled', false);
                        f.commitChanges();
                    }
                    e.target.innerText = 'enable';
                    e.relayTarget.classList.add('disabled');
                }
                else {
                    if (e.currentTarget.classList.contains('filter-names')) {
                        f.setFilterProperty(getChildPosition(elm) - 1, 'enabled', true);
                        f.commitChanges();
                    }
                    else if (e.currentTarget.classList.contains('filter-group')) {
                        f.setFilterGroupProperty(getChildPosition(elm) - 1,
                            getChildPosition(e.relayTarget) - 1, 'enabled', true);
                        f.commitChanges();
                    }
                    e.target.innerText = 'disable';
                    e.relayTarget.classList.remove('disabled');
                }
            }
        }
    },

    onBlur: function(e) {
        if (e.relayTarget.classList.contains('list-item')) {
            e.relayTarget.removeAttribute('selected');
            if (!e.currentTarget.querySelector('.list-item[selected]'))
                listbox.highlight(e.currentTarget, e.relayTarget);
        }

        if (e.relayTarget.classList.contains('filter-group-host')) {
            var group = document.querySelector('.mainview > .selected .group-filter-set.selected');
            var f = filterset[group.id];
            var g = group.querySelector('.filter-names .list-item.highlighted');
            f.setFilterProperty(getChildPosition(g) - 1, 'root', e.relayTarget.value.trim());
            f.commitChanges();
        }
    }
};

var page_event_handler = {
    onClick: function(e) {
        if (e.relayTarget.classList.contains('template-list-item')) {
            if (e.target.classList.contains('action'))
                e.target.innerText = e.target.innerText === 'disable' ? 'enable' : 'disable';
        }
        else if (e.relayTarget.classList.contains('list-item')) {
            var f = filterset[e.currentTarget.parentNode.id];
            if (e.target.classList.contains('delete')) {
                f.removeGroup(getChildPosition(e.relayTarget) - 1);
                f.commitChanges();
                e.currentTarget.removeChild(e.relayTarget);
            }
            else if (e.target.classList.contains('action')) {
                var enabled = e.target.innerText === 'enable';
                f.setFilterProperty(getChildPosition(e.relayTarget) - 1, 'enabled', enabled);
                if (enabled) {
                    e.target.innerText = 'disable';
                    e.relayTarget.classList.remove('disabled');
                }
                else {
                    e.target.innerText = 'enable';
                    e.relayTarget.classList.add('disabled');
                }
                f.commitChanges();
            }
        }
    },

    onKeyup: function(e) {
        if (e.keyIdentifier === 'Enter') {
            var text = e.target.value.trim();
            if (!text)
                return;
            var f = filterset[e.currentTarget.parentNode.id];
            if (e.relayTarget.classList.contains('template-list-item')) {
                var disabled = e.relayTarget.querySelector('.action').innerText !== 'enable';
                f.addGroup({
                    pattern: text,
                    enabled: disabled
                });
                listbox.add(e.currentTarget, text, disabled, 'http://example.com/*');
            }
            else {
                f.setFilterProperty(getChildPosition(e.relayTarget) - 1, 'pattern', text);
                listbox.rename(e.relayTarget, text);
            }
            f.commitChanges();
            e.target.value = '';
            e.target.blur();
        }
        else if (e.keyIdentifier === 'U+001B')
            e.target.blur();
    },

    onMousedown: function(e) {
        if (e.target.classList.contains('text')) {
            listbox.select(e.currentTarget, e.relayTarget);
            listbox.focus(e.relayTarget);
        }
        else
            return true;
    },

    onBlur: function(e) {
        e.relayTarget.removeAttribute('selected');
    }
};

function visitReportPage() {
    chrome.tabs.create({
        url: 'https://chrome.google.com/webstore/support/mfidmkgnfgnkihnjeklbekckimkipmoe#bug'
    });
}

function getError(i) {
    var m = '';
    switch (i.id) {
        case 'idlehours':
        case 'idleminutes':
            var value = i.value.trim();
            if (!/^(\d+|)$/.test(value))
                m = 'Invalid number';
            else if (value < +i.min)
                m = 'Min value is ' + i.min;
            else if (value > (+i.max || Infinity))
                m = 'Max value is ' + i.max;
            break;
    }
    return m;
}

function changePlaceholderColor() {
    modal.show('colorpicker',
        function() {
            return color.OBJ_ARR(userdata.object('prefs.panelcolor'));
        },
        function(col) {
            userdata.set('prefs.panelcolor', col[0] === '#' ?
                color.HEX_OBJ(col.substring(1)) : color.RGBA_OBJ(col));
        }
    );
}

function selectPlaceholderButtons() {
    modal.show('placeholdericon',
        function() {
            if (arguments.length === 0)
                return userdata.boolean('prefs.desaturate');
            userdata.set('prefs.desaturate', +arguments[0]);
        },
        function() {
            if (arguments.length === 0)
                return userdata.number('prefs.panelimage');
            userdata.set('prefs.panelimage', arguments[0]);
            userdata.set('prefs.panelicon', arguments[1]);
        }
    );
}

function resetSettings() {
    modal.show('reset',
        function() {
            userdata.keys().forEach(function(k) {
                userdata.set(k, null);
            });
            initSettingsUI();
        },
        function() {
            patterns.keys().forEach(function(k) {
                patterns.set(k, null);
                filterset[k.substring(k.indexOf('.') + 1)].clear();
            });
            initFiltersUI();
        },
        !syncdata.boolean('sync.enabled') ? '' :
        ' If Chrome is connected to your Google Account, any changes made will be synced.'
    );
}

function manageSync() {
    modal.show('sync',
        function() {
            if (arguments.length === 0)
                return syncdata.boolean('sync.enabled');
            syncdata.set('sync.enabled', +arguments[0]);
        },
        function() {
            if (arguments.length === 0)
                return syncdata.boolean('sync.settings');
            syncdata.set('sync.settings', +arguments[0]);
        },
        function() {
            if (arguments.length === 0)
                return syncdata.boolean('sync.filters');
            syncdata.set('sync.filters', +arguments[0]);
        }
    );
}

function importExportFilters() {
    modal.show('import',
        function(s) {
            var r = new FileReader();
            r.onload = function(e) {
                try {
                    var d = JSON.parse(e.target.result);
                    for (var k in filterset) {
                        if (k in d) {
                            var l = d[k];
                            for (var i = 0; i < l.length; i++)
                                filterset[k].addGroup(l[i]);
                            filterset[k].commitChanges();
                            if (/[AC]$/.test(k))
                                updatePageFiltersUI(k);
                            if (/[BDEF]$/.test(k))
                                updateGroupFiltersUI(k);
                        }
                    }
                }
                catch (err) {
                    console.error("error: couldn't read", s);
                }
            };
            r.readAsText(s, "UTF-8");
        },
        function(s) {
            var f = s + (!/\.txt$/i.test(s) ? '.txt' : '');
            var a = document.createElement("a");
            var d = {};
            'ABCDEF'.split('').forEach(function(c) {
                d['patternlist' + c] = filterset['patternlist' + c].list();
            });
            d = JSON.stringify(d);
            a.download = s;
            a.href = window.webkitURL.createObjectURL(new Blob([d], {type:'text/plain'}));
            a.click();
        }
    );
}

function initEvents() {
    relayEvent('.navigation', 'click', 'li', main_event_handler.onNavigate);

    relayEvent($('settings'), 'keyup', 'input[type=text]', main_event_handler.onKey);
    relayEvent($('settings'), 'change', 'select', main_event_handler.onClick);
    relayEvent($('settings'), 'blur', 'input[type=text]', main_event_handler.onBlur, true);
    relayEvent($('settings'), 'click', 'input[type=checkbox], input[type=radio]', main_event_handler.onClick);

    relayEvent('.filter-set .listbox', 'keyup', 'li', page_event_handler.onKeyup);
    relayEvent('.filter-set .listbox', 'mousedown', '.list-item', page_event_handler.onMousedown);
    relayEvent('.filter-set .listbox', 'blur', '.list-item', page_event_handler.onBlur, true);
    relayEvent('.filter-set .listbox', 'click', 'li', page_event_handler.onClick);

    relayEvent('.group-filter-set', 'keyup', '.filter-group-host', selective_event_handler.onKeyup);
    relayEvent('.group-filter-set', 'blur', '.filter-group-host', selective_event_handler.onBlur, true);
    relayEvent('.group-filter-set .listbox', 'keyup', 'li', selective_event_handler.onKeyup);
    relayEvent('.group-filter-set .listbox', 'mousedown', '.list-item', selective_event_handler.onMousedown);
    relayEvent('.group-filter-set .listbox', 'blur', '.list-item', selective_event_handler.onBlur, true);
    relayEvent('.group-filter-set .listbox', 'click', 'li', selective_event_handler.onClick);

    $('color').addEventListener('click', changePlaceholderColor, false);
    $('icon').addEventListener('click', selectPlaceholderButtons, false);
    $('reset').addEventListener('click', resetSettings, false);
    $('report').addEventListener('click', visitReportPage, false);
    $('sync').addEventListener('click', manageSync, false);
    $('import').addEventListener('click', importExportFilters, false);
}

function initData() {
    'ABCDEF'.split('').forEach(function(s) {
        filterset['patternlist' + s] = new filters(new adapter('patternlist' + s));
        filterset['patternlist' + s].update();
    });
}

function updatePageFiltersUI(type) {
    var l = document.querySelector('#' + type + ' .listbox');
    listbox.clear(l);
    filterset[type].each(function(item) {
        l.appendChild(listbox.create(item.pattern, item.enabled, 'http://example.com/*'));
    });
}

function updateGroupFiltersUI(type) {
    var elm = document.querySelector('#' + type + ' .filter-names');
    listbox.clear(elm);
    listbox.clear(document.querySelector('#' + type + ' .filter-group'));
    filterset[type].each(function(item) {
        elm.appendChild(listbox.create(item.name, item.enabled, 'Enter a name'));
    });
    elm = document.querySelector('#' + type + ' > :first-child > :last-child');
    elm.classList.remove('visible');
    elm.classList.add('hidden');
}

function initFiltersUI() {
    var elms = document.querySelectorAll('.group-filter-set > :first-child > :last-child');
    for (var i = 0; i < elms.length; i++)
        elms[i].classList.add('hidden');
    elms = document.querySelectorAll('.mainview > :not(.selected), .subview > :not(.selected)');
    for (var i = 0; i < elms.length; i++)
        elms[i].style.display = 'none';
    'AC'.split('').forEach(function(s) {
        updatePageFiltersUI('patternlist' + s);
    });
    'BDEF'.split('').forEach(function(s) {
        updateGroupFiltersUI('patternlist' + s);
    });
}

function initSettingsUI() {
    ui.get($('enabled'));
    ui.get($('omniicon'));
    ui.get($('omnialways'));
    ui.get($('showicon'));
    ui.get($('flashborder'));
    ui.get($('paneltooltip'));
    ui.get($('foreground'));
    ui.get($('background'));
    ui.get($('preservefocus'));
    ui.get($('alltabs'));
    ui.get($('bgtabs'));
    ui.get($('idlehours'));
    ui.get($('idleminutes'));
    ui.get($('defaultmode'));
    ui.get($('optionsview'));
    ui.get($('toolbar'));
    ui.get($('version'));
    ui.get($('flash'));
}

document.addEventListener('DOMContentLoaded', function() {
    document.body.classList.add('platform-' + getPlatform());
    initEvents();
    initData();
    initSettingsUI();
    initFiltersUI();
}, false);

window.addEventListener('storage', function(event) {
    var keys = event.key.split('.');
    if (keys[0] === 'data') {
        if (/patternlist[ABCDEF]/.test(keys[1]))
            filterset[keys[1]].update();
        if (/patternlist[AC]/.test(keys[1]))
            updatePageFiltersUI(keys[1]);
        if (/patternlist[BDEF]/.test(keys[1]))
            updateGroupFiltersUI(keys[1]);
        return;
    }

    if (keys[0] === 'prefs') {
        var e = $(keys[1]);
        if (e)
            ui.get(e);
        else
            ui.get(keys[1].substring(keys[1].indexOf('.') + 1));
    }
}, false);
