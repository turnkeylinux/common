/*
 * This file is part of the Adblock Plus build tools,
 * Copyright (C) 2006-2013 Eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

require.scopes.info = {
  get addonID()
  {
    return chrome.i18n.getMessage("@@extension_id");
  },
  addonName: "adblockpluschrome",
  addonVersion: "1.6.1",
  addonRoot: "",

  application: "chrome",
  get applicationVersion()
  {
    return this.platformVersion;
  },

  platform: "chromium",
  get platformVersion()
  {
    var match = /\bChrome\/(\S+)/.exec(navigator.userAgent);
    return (match ? match[1] : "0");
  }
};