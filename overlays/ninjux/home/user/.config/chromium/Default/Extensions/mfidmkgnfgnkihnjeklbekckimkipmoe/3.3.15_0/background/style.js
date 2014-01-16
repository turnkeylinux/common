var scriptdata = Object.create(null);
var placeholder;

var rules = new css();
var buttonStyle = new rule('.fc-toolbar-button');
var buttonFadeStyle = new rule('.fc-panel-animation-fade');
var buttonUnloadStyle = new rule('.fc-toolbar-buttonunload');
var fadeStyle = new rule('.fc-toolbar-animation-fade');
var hoverButtonStyle = new rule('.fc-panel-animation-fade:hover');
var hoverZoomStyle = new rule('.fc-rectangle:hover > .fc-toolbar-animation-zoom');
var hoverFadeStyle = new rule('.fc-rectangle:hover > .fc-toolbar-animation-fade');
var iconStyle = new rule('.fc-icon');
var noneStyle = new rule('.fc-toolbar-animation-none');
var panelButtonStyle = new rule('.fc-panel-button');
var panelTransStyle = new rule('.fc-trans');
var panelStyle = new rule('.fc-panel');
var toolbarStyle = new rule('.fc-toolbar');
var zoomStyle = new rule('.fc-toolbar-animation-zoom');

function updatePlaceholderStyle(k, v) {
    switch (k) {
    case 'animation':
        var animate = v !== 3;
        var toolbar = userdata.object('prefs.toolbar');
        updatePlaceholderStyle('toolbar', animate ? toolbar : 0);
        updatePlaceholderStyle('rectangle', animate && toolbar ? v : -1);
        updatePlaceholderStyle('button', animate && toolbar ? userdata.boolean('prefs.clickpanel') : false);
        animate && toolbar ? scriptdata['toolbaranimation'] = v : delete scriptdata['toolbaranimation'];
        break;
    case 'rectangle':
        switch (v) {
        case 0:
            rules.remove(zoomStyle);
            rules.remove(hoverZoomStyle);
            rules.add(fadeStyle);
            rules.add(hoverFadeStyle);
            break;
        case 1:
            rules.remove(fadeStyle);
            rules.remove(hoverFadeStyle);
            rules.add(zoomStyle);
            rules.add(hoverZoomStyle);
            break;
        case 2:
            rules.remove(fadeStyle);
            rules.remove(zoomStyle);
            rules.remove(hoverFadeStyle);
            rules.remove(hoverZoomStyle);
            break;
        default:
            rules.remove(fadeStyle);
            rules.remove(zoomStyle);
            rules.remove(hoverFadeStyle);
            rules.remove(hoverZoomStyle);
            break;
        }
        break;
    case 'toolbar':
        if (v & 0x05) {
            rules.add(toolbarStyle);
            rules.add(buttonStyle);
            v & 0x01 ? rules.add(buttonUnloadStyle) : rules.remove(buttonUnloadStyle);
            scriptdata['toolbar'] = v;
            scriptdata['toolbarposition'] = userdata.object('prefs.toolbarposition');
        }
        else {
            rules.remove(toolbarStyle);
            rules.remove(buttonStyle);
            rules.remove(buttonUnloadStyle);
            delete scriptdata['toolbar'];
            delete scriptdata['toolbarposition'];
        }
        v & 0x04 ? scriptdata['filterctrl'] = userdata.object('prefs.filterctrl') : delete scriptdata['filterctrl'];
        break;
    case 'button':
        if (v) {
            rules.add(panelButtonStyle);
            rules.add(buttonFadeStyle);
            rules.add(hoverButtonStyle);
        }
        else {
            rules.remove(panelButtonStyle);
            rules.remove(buttonFadeStyle);
            rules.remove(hoverButtonStyle);
        }
        v ? scriptdata['clickpanel'] = v : delete scriptdata['clickpanel'];
        break;
    case 'icon':
        if (v) {
            var size = userdata.object('prefs.panelicon');
            var image = userdata.object('prefs.panelimage');
            var desat = userdata.boolean('prefs.desaturate');
            var suff = size + (image > 2 ? (desat ? 'd' : '') : 'f');
            var path = paths('icon' + suff + '.png');
            iconStyle.add('background', format('transparent url({0}) no-repeat center', path));
            scriptdata['panelicon'] = size;
        }
        else {
            iconStyle.add('background', 'none');
            delete scriptdata['panelicon'];
        }
        break;
    }
}

placeholder = Object.create({
    get rules() {
        Object.defineProperty(this, 'rules', {
            value: rules.format(),
            configurable: true,
            enumerable: true
        });
        return this.rules;
    },

    init: function() {
        var r = panelStyle, s = userdata.copy(Object.keys(default_userdata));
        // panel
        if (s['prefs.flashborder'])
            r.add('outline', format('#{0} solid 1px', color.RGB_HEX(s['prefs.panelcolor'])));
        r.add('background-color', color.RGBA_STR(s['prefs.panelcolor']));
        r.add('border', 'none');
        r.add('cursor', 'pointer');
        r.add('display', 'block', true);
        r.add('min-width', '48px');
        r.add('min-height', '16px');
        r.add('overflow', 'hidden');
        r.add('padding', 0);
        r.add('position', 'relative', true);
        r.add('visibility', 'visible');
        // placeholder icon
        r = iconStyle;
        if (s['prefs.showicon']) {
            s['prefs.panelimage'] = s['prefs.panelicon'] + (s['prefs.panelimage'] > 2 ?
                (s['prefs.desaturate'] ? 'd' : '') : 'f');
            r.add('background',
                format('transparent url({0}) no-repeat center',
                    paths(format('icon{0}.png', s['prefs.panelimage']))));
            scriptdata['panelicon'] = s['prefs.panelicon'];
        }
        else
            r.add('background', 'none');
        // panel button
        r = panelButtonStyle;
        r.add('border-radius', '7px');
        r.add('padding', '12px');
        r.add('height', format('{0}px', s['prefs.panelicon']));
        r.add('width', format('{0}px', s['prefs.panelicon']));
        r.add('-webkit-box-shadow',
            'rgba(0,0,0,.5) 0px 0px 7px 0px inset, rgba(160,160,160,.1) 0px 0px 0px 1px');
        // toolbar
        r = toolbarStyle;
        r.add('background-color', 'transparent');
        r.add('cursor', 'default');
        r.add('display', 'block');
        r.add('min-height', '16px');
        r.add('min-width', '16px');
        r.add('max-height', '16px');
        r.add('max-width', '48px');
        r.add('margin', 0);
        r.add('opacity', '1');
        r.add('padding', '4px');
        r.add('position', 'absolute');
        r.add('visibility', 'visible');
        r.add('z-index', 'inherit');
        // toolbar buttons
        r = buttonStyle;
        r.add('background-color', 'inherit');
        r.add('background-image', format('url({0})', paths('icon16.png')));
        r.add('background-repeat', 'no-repeat');
        r.add('clear', 'none');
        r.add('cursor', 'pointer');
        r.add('display', 'inline-block');
        r.add('min-width', '16px');
        r.add('max-height', '16px');
        r.add('max-width', '16px');
        r.add('margin', 0);
        r.add('padding', 0);
        r.add('visibility', 'visible');
        // animation
        panelTransStyle.add('background', 'none');
        buttonUnloadStyle.add('background-position', '0 0');
        noneStyle.add('display', 'none');
        fadeStyle.add('opacity', 0);
        fadeStyle.add('-webkit-transition', 'opacity 460ms ease-in');
        zoomStyle.add('opacity', 0);
        zoomStyle.add('-webkit-transform', 'scale(0)');
        zoomStyle.add('-webkit-transition',
            '-webkit-transform 250ms ease-out, opacity 250ms ease-out');
        hoverFadeStyle.add('opacity', 1);
        hoverFadeStyle.add('-webkit-transition', 'opacity 30ms ease-out');
        buttonFadeStyle.add('opacity', 0.5);
        buttonFadeStyle.add('-webkit-transition', 'opacity 180ms linear');
        hoverButtonStyle.add('opacity', 1);
        hoverButtonStyle.add('-webkit-transition', 'opacity 130ms linear');
        hoverZoomStyle.add('opacity', 1);
        hoverZoomStyle.add('-webkit-transform', 'scale(1)');
        hoverZoomStyle.add('-webkit-transition',
            '-webkit-transform 250ms ease-out, opacity 250ms ease-out');
        rules.add(iconStyle);
        rules.add(panelStyle);
        rules.add(panelTransStyle);
        if (s['prefs.toolbaranimation'] < 3) {
            if (s['prefs.clickpanel']) {
                scriptdata['clickpanel'] = true;
                rules.add(panelButtonStyle);
                rules.add(buttonFadeStyle);
                rules.add(hoverButtonStyle);
            }
            if (s['prefs.toolbar'] & 0x05) {
                scriptdata['toolbar'] = s['prefs.toolbar'];
                scriptdata['toolbaranimation'] = s['prefs.toolbaranimation'];
                scriptdata['toolbarposition'] = s['prefs.toolbarposition'];
                s['prefs.toolbar'] & 0x04 && (scriptdata['filterctrl'] = s['prefs.filterctrl']);
                rules.add(toolbarStyle);
                rules.add(buttonStyle);
                s['prefs.toolbar'] & 0x01 && rules.add(buttonUnloadStyle);
                switch (s['prefs.toolbaranimation']) {
                case 0:
                    rules.add(fadeStyle);
                    rules.add(hoverFadeStyle);
                    break;
                case 1:
                    rules.add(zoomStyle);
                    rules.add(hoverZoomStyle);
                    break;
                }
            }
        }
        s['prefs.paneltooltip'] && (scriptdata['paneltooltip'] = true);

        Object.defineProperty(this, 'init', {
            value: nop
        });
    }
}, {
    updateAnimation: {
        value: function() {
            updatePlaceholderStyle('animation', userdata.object('prefs.toolbaranimation'));
            delete this.rules;
        }
    },

    updateBorder: {
        value: function(v) {
            if (v) {
                var h = color.RGB_HEX(userdata.object('prefs.panelcolor'));
                panelStyle.add('outline', format('#{0} solid 1px', h));
            }
            else
                panelStyle.remove('outline');
            delete this.rules;
        }
    },

    updateColor: {
        value: function(v) {
            panelStyle.add('background-color', color.RGBA_STR(v));
            if (userdata.boolean('prefs.flashborder'))
                panelStyle.add('outline', format('#{0} solid 1px', color.RGB_HEX(v)));
            delete this.rules;
        }
    },

    updateIcon: {
        value: function(v) {
            if (v != null) {
                panelButtonStyle.add('height', format('{0}px', v));
                panelButtonStyle.add('width', format('{0}px', v));
            }
            updatePlaceholderStyle('icon', userdata.boolean('prefs.showicon'));
            delete this.rules;
        }
    },

    updateTooltip: {
        value: function(v) {
            v ? scriptdata['paneltooltip'] = true : delete scriptdata['paneltooltip'];
            delete this.rules;
        }
    }
});
