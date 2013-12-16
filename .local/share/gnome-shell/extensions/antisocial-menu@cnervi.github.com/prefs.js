const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const SETTINGS_SHOW_NAME = 'show-name';

let settings;

function init() {
    settings = Convenience.getSettings();
}

function buildPrefsWidget() {
    let showName = settings.get_boolean(SETTINGS_SHOW_NAME);

    let frame = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, border_width: 10});
    let label = new Gtk.Label({label: "<b>Appearance</b>", use_markup: true, xalign: 0});
    frame.add(label);

    let vbox = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, margin_left: 20, margin_top: 10});
    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL});
    vbox.add(hbox)

    let label = new Gtk.Label({label: "Show name", use_markup: true, xalign: 0});
    let onoff = new Gtk.Switch({active: showName});

    hbox.pack_start(label, true, true, 0);
    hbox.add(onoff);

    onoff.connect('notify::active', function(widget) {
        settings.set_boolean(SETTINGS_SHOW_NAME, widget.active);
    });

    frame.add(vbox);
    frame.show_all();
    return frame;
}
