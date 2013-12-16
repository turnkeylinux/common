/*
 * Copyright (C) 2011-2012 Marco Barisione <marco@barisione.org>
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */

const ExtensionUtils = imports.misc.extensionUtils;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;

const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const disableNotificationsSettingId = "disable-notifications";
const enableNotificationsSettingId = "enable-notifications";
const toggleNotificationsSettingId = "toggle-notifications";

let settings = null;

let debugEnabled = false;

function debug(message) {
    if (debugEnabled)
        log ("BOSS-MODE: " + message);
}

function getSwitch() {
    return Main.panel._statusArea.userMenu._notificationsSwitch;
}

function getStateString() {
    if (getSwitch().state)
        return "enabled";
    else
        return "disabled";
}

function toggleNotificationsReal() {
    let s = getSwitch();
    let originalNotify = Main.notify;
    // If we are disabling notifications we don't want a message telling
    // everybody we just did so.
    let needNotifySwap = s.state;

    if (needNotifySwap) {
        Main.notify = function(title, message) {
            debug("hiding notification: \"" + title + "\"");
        };
    }

    s.toggle();

    if (needNotifySwap)
        Main.notify = originalNotify;
}

function setNotificationsStatus(enable) {
    if (getSwitch().state != enable) {
        debug("currently notifications are " + getStateString() + ", " +
                (enable ? "enabling" : "disabling"));
        toggleNotificationsReal();
    } else {
        debug("currently notifications are " + getStateString() +
                ", not changing");
    }
}

function toggleNotifications() {
    debug ("currently notifications are " + getStateString() + ", toggling");
    toggleNotificationsReal();
}

function init() {
    if (GLib.getenv("BOSS_MODE_DEBUG")) {
        debugEnabled = true;
        debug ("initialising");
    }
}

function addKeybinding(id, callback)
{
    debug("using keybinding '" + settings.get_strv(id)[0] + "' for action '" +
            id + "'");
    global.display.add_keybinding(id, settings, Meta.KeyBindingFlags.NONE,
            callback);
}

function enable() {
    debug ("enabling");

    settings = Convenience.getSettings();

    addKeybinding(disableNotificationsSettingId,
            function() { setNotificationsStatus(false); });

    addKeybinding(enableNotificationsSettingId,
            function() { setNotificationsStatus(true); });

    addKeybinding(toggleNotificationsSettingId, toggleNotifications);
}

function disable() {
    debug ("disabling");

    global.display.remove_keybinding(disableNotificationsSettingId);
    global.display.remove_keybinding(enableNotificationsSettingId);
    global.display.remove_keybinding(toggleNotificationsSettingId);

    settings = null;
}
