const St = imports.gi.St;

const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const SETTINGS_SHOW_NAME = 'show-name';

let settings, userMenu, panelUserMenu, actors, icon, id;

function init() {
    settings = Convenience.getSettings();

    let statusArea = Main.panel.statusArea || Main.panel._statusArea;

    userMenu = statusArea.userMenu; 
    panelUserMenu = userMenu._iconBox.get_parent();
    actors = [userMenu._iconBox, userMenu._statusChooser.actor, userMenu._notificationsSwitch.actor];
    icon = new St.Icon({icon_name: 'system-shutdown-symbolic', style_class: 'system-status-icon'});

    userMenu.menu._getMenuItems().forEach(function(menuItem) {
        let label = menuItem.actor._delegate.label;

        if(label && _(label.get_text()) == _('Online Accounts'))
            actors.push(menuItem.actor);
    });
}

function enable() {
    let showName = settings.get_boolean(SETTINGS_SHOW_NAME);

    if(!showName) {
        userMenu._name.hide()
        panelUserMenu.insert_child_at_index(icon, -1);
    }

    actors.forEach(function(actor) {
        actor.hide();
    });

    id = settings.connect('changed::' + SETTINGS_SHOW_NAME, function() {
        disable();
        enable();
    });
}

function disable() {
    userMenu._name.show()
    panelUserMenu.remove_child(icon);

    actors.forEach(function(actor) {
        actor.show();
    });

    settings.disconnect(id);
}
