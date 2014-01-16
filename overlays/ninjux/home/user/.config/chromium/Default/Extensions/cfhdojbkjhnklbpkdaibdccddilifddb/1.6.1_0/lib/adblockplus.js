/*
 * This file is part of Adblock Plus <http://adblockplus.org/>,
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

//
// This file has been generated automatically, relevant repositories:
// * https://hg.adblockplus.org/adblockplus/
// * https://hg.adblockplus.org/jshydra/
//

require.scopes["prefs"] = (function()
{
  var exports = {};
  var defaults =
  {
    __proto__: null,
    enabled: true,
    data_directory: "",
    patternsbackups: 5,
    patternsbackupinterval: 24,
    savestats: false,
    privateBrowsing: false,
    subscriptions_fallbackerrors: 5,
    subscriptions_fallbackurl: "https://adblockplus.org/getSubscription?version=%VERSION%&url=%SUBSCRIPTION%&downloadURL=%URL%&error=%ERROR%&channelStatus=%CHANNELSTATUS%&responseStatus=%RESPONSESTATUS%",
    subscriptions_autoupdate: true,
    subscriptions_exceptionsurl: "https://easylist-downloads.adblockplus.org/exceptionrules.txt",
    documentation_link: "https://adblockplus.org/redirect?link=%LINK%&lang=%LANG%",
    notificationdata: {},
    notificationurl: "https://notification.adblockplus.org/notification.json",
    stats_total: {}
  };
  var listeners = [];

  function defineProperty(key)
  {
    var value = null;
    Prefs.__defineGetter__(key, function()
    {
      if (value === null)
      {
        if (key in localStorage)
        {
          try
          {
            value = JSON.parse(localStorage[key]);
          }
          catch (e)
          {
            Cu.reportError(e);
          }
        }
        if (value === null)
        {
          value = JSON.parse(JSON.stringify(defaults[key]));
        }
      }
      return value;
    });
    Prefs.__defineSetter__(key, function(newValue)
    {
      if (typeof newValue != typeof defaults[key])
      {
        throw new Error("Attempt to change preference type");
      }
      var stringified = JSON.stringify(newValue);
      if (stringified != JSON.stringify(defaults[key]))
      {
        localStorage[key] = stringified;
      }
      else
      {
        delete localStorage[key];
      }
      value = newValue;
      for (var _loopIndex0 = 0; _loopIndex0 < listeners.length; ++_loopIndex0)
      {
        var listener = listeners[_loopIndex0];
        listener(key);
      }
      return value;
    });
  }
  var Prefs = exports.Prefs =
  {
    addListener: function(listener)
    {
      if (listeners.indexOf(listener) < 0)
      {
        listeners.push(listener);
      }
    },
    removeListener: function(listener)
    {
      var index = listeners.indexOf(listener);
      if (index >= 0)
      {
        listeners.splice(index, 1);
      }
    }
  };
  for (var key in defaults)
  {
    defineProperty(key);
  }
  return exports;
})();
require.scopes["utils"] = (function()
{
  var exports = {};
  var runAsyncQueue;
  var Utils = exports.Utils =
  {
    systemPrincipal: null,
    getString: function(id)
    {
      return id;
    },
    runAsync: function(callback)
    {
      callback = callback.bind.apply(callback, Array.prototype.slice.call(arguments, 1));
      if (typeof runAsyncQueue == "undefined")
      {
        runAsyncQueue = document.readyState == "loading" ? [] : null;
        if (runAsyncQueue)
        {
          var loadHandler = function()
          {
            document.removeEventListener("DOMContentLoaded", loadHandler, false);
            var queue = runAsyncQueue;
            runAsyncQueue = null;
            for (var _loopIndex1 = 0; _loopIndex1 < queue.length; ++_loopIndex1)
            {
              var callback = queue[_loopIndex1];
              try
              {
                callback();
              }
              catch (e)
              {
                Cu.reportError(e);
              }
            }
          };
          document.addEventListener("DOMContentLoaded", loadHandler, false);
        }
      }
      if (runAsyncQueue)
      {
        runAsyncQueue.push(callback);
      }
      else
      {
        window.setTimeout(callback, 0);
      }
    },
    get appLocale()
    {
      var locale = chrome.i18n.getMessage("@@ui_locale").replace(/_/g, "-");
      this.__defineGetter__("appLocale", function()
      {
        return locale;
      });
      return this.appLocale;
    },
    generateChecksum: function(lines)
    {
      return null;
    },
    makeURI: function(url)
    {
      return Services.io.newURI(url);
    },
    checkLocalePrefixMatch: function(prefixes)
    {
      if (!prefixes)
      {
        return null;
      }
      var list = prefixes.split(",");
      for (var i = 0; i < list.length; i++)
      {
        if ((new RegExp("^" + list[i] + "\\b")).test(this.appLocale))
        {
          return list[i];
        }
      }
      return null;
    },
    chooseFilterSubscription: function(subscriptions)
    {
      var selectedItem = null;
      var selectedPrefix = null;
      var matchCount = 0;
      for (var i = 0; i < subscriptions.length; i++)
      {
        var subscription = subscriptions[i];
        if (!selectedItem)
        {
          selectedItem = subscription;
        }
        var prefix = require("utils").Utils.checkLocalePrefixMatch(subscription.getAttribute("prefixes"));
        if (prefix)
        {
          if (!selectedPrefix || selectedPrefix.length < prefix.length)
          {
            selectedItem = subscription;
            selectedPrefix = prefix;
            matchCount = 1;
          }
          else if (selectedPrefix && selectedPrefix.length == prefix.length)
          {
            matchCount++;
            if (Math.random() * matchCount < 1)
            {
              selectedItem = subscription;
              selectedPrefix = prefix;
            }
          }
        }
      }
      return selectedItem;
    },
    getDocLink: function(linkID)
    {
      var Prefs = require("prefs").Prefs;
      var docLink = Prefs.documentation_link;
      return docLink.replace(/%LINK%/g, linkID).replace(/%LANG%/g, Utils.appLocale);
    }
  };
  return exports;
})();
require.scopes["elemHideHitRegistration"] = (function()
{
  var exports = {};
  var AboutHandler = exports.AboutHandler = {};
  return exports;
})();
require.scopes["downloader"] = (function()
{
  var exports = {};
  var Utils = require("utils").Utils;
  var MILLIS_IN_SECOND = exports.MILLIS_IN_SECOND = 1000;
  var MILLIS_IN_MINUTE = exports.MILLIS_IN_MINUTE = 60 * MILLIS_IN_SECOND;
  var MILLIS_IN_HOUR = exports.MILLIS_IN_HOUR = 60 * MILLIS_IN_MINUTE;
  var MILLIS_IN_DAY = exports.MILLIS_IN_DAY = 24 * MILLIS_IN_HOUR;
  var Downloader = exports.Downloader = function Downloader(dataSource, initialDelay, checkInterval)
  {
    this.dataSource = dataSource;
    this._timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    this._timer.initWithCallback(function()
    {
      this._timer.delay = checkInterval;
      this._doCheck();
    }.bind(this), initialDelay, Ci.nsITimer.TYPE_REPEATING_SLACK);
    this._downloading = Object.create(null);
  };
  Downloader.prototype =
  {
    _timer: null,
    _downloading: null,
    dataSource: null,
    maxAbsenseInterval: 1 * MILLIS_IN_DAY,
    minRetryInterval: 1 * MILLIS_IN_DAY,
    maxExpirationInterval: 14 * MILLIS_IN_DAY,
    maxRedirects: 5,
    onExpirationChange: null,
    onDownloadStarted: null,
    onDownloadSuccess: null,
    onDownloadError: null,
    _doCheck: function()
    {
      var now = Date.now();
      for (var _loopIndex2 = 0; _loopIndex2 < this.dataSource().length; ++_loopIndex2)
      {
        var downloadable = this.dataSource()[_loopIndex2];
        if (downloadable.lastCheck && now - downloadable.lastCheck > this.maxAbsenseInterval)
        {
          downloadable.softExpiration += now - downloadable.lastCheck;
        }
        downloadable.lastCheck = now;
        if (downloadable.hardExpiration - now > this.maxExpirationInterval)
        {
          downloadable.hardExpiration = now + this.maxExpirationInterval;
        }
        if (downloadable.softExpiration - now > this.maxExpirationInterval)
        {
          downloadable.softExpiration = now + this.maxExpirationInterval;
        }
        if (this.onExpirationChange)
        {
          this.onExpirationChange(downloadable);
        }
        if (downloadable.softExpiration > now && downloadable.hardExpiration > now)
        {
          continue;
        }
        if (downloadable.lastError && now - downloadable.lastError < this.minRetryInterval)
        {
          continue;
        }
        this._download(downloadable, 0);
      }
    },
    cancel: function()
    {
      this._timer.cancel();
    },
    isDownloading: function(url)
    {
      return url in this._downloading;
    },
    download: function(downloadable)
    {
      Utils.runAsync(this._download.bind(this, downloadable, 0));
    },
    getDownloadUrl: function(downloadable)
    {
      var _tempVar3 = require("info");
      var addonName = _tempVar3.addonName;
      var addonVersion = _tempVar3.addonVersion;
      var application = _tempVar3.application;
      var applicationVersion = _tempVar3.applicationVersion;
      var platform = _tempVar3.platform;
      var platformVersion = _tempVar3.platformVersion;
      var url = downloadable.redirectURL || downloadable.url;
      if (url.indexOf("?") >= 0)
      {
        url += "&";
      }
      else
      {
        url += "?";
      }
      url += "addonName=" + encodeURIComponent(addonName) + "&addonVersion=" + encodeURIComponent(addonVersion) + "&application=" + encodeURIComponent(application) + "&applicationVersion=" + encodeURIComponent(applicationVersion) + "&platform=" + encodeURIComponent(platform) + "&platformVersion=" + encodeURIComponent(platformVersion) + "&lastVersion=" + encodeURIComponent(downloadable.lastVersion);
      return url;
    },
    _download: function(downloadable, redirects)
    {
      if (downloadable.url in this._downloading)
      {
        return;
      }
      var downloadURL = this.getDownloadUrl(downloadable);
      var request = null;
      var errorCallback = function errorCallback(error)
      {
        var channelStatus = -1;
        try
        {
          channelStatus = request.channel.status;
        }
        catch (e){}
        var responseStatus = request.status;
        Cu.reportError("Adblock Plus: Downloading URL " + downloadable.url + " failed (" + error + ")\n" + "Download address: " + downloadURL + "\n" + "Channel status: " + channelStatus + "\n" + "Server response: " + responseStatus);
        if (this.onDownloadError)
        {
          var redirectCallback = null;
          if (redirects <= this.maxRedirects)
          {
            redirectCallback = function redirectCallback(url)
            {
              downloadable.redirectURL = url;
              this._download(downloadable, redirects + 1);
            }.bind(this);
          }
          this.onDownloadError(downloadable, downloadURL, error, channelStatus, responseStatus, redirectCallback);
        }
      }.bind(this);
      try
      {
        request = new XMLHttpRequest();
        request.mozBackgroundRequest = true;
        request.open("GET", downloadURL);
      }
      catch (e)
      {
        errorCallback("synchronize_invalid_url");
        return;
      }
      try
      {
        request.overrideMimeType("text/plain");
        request.channel.loadFlags = request.channel.loadFlags | request.channel.INHIBIT_CACHING | request.channel.VALIDATE_ALWAYS;
        if (request.channel instanceof Ci.nsIHttpChannel)
        {
          request.channel.redirectionLimit = this.maxRedirects;
        }
      }
      catch (e)
      {
        Cu.reportError(e);
      }
      request.addEventListener("error", function(event)
      {
        if (onShutdown.done)
        {
          return;
        }
        delete this._downloading[downloadable.url];
        errorCallback("synchronize_connection_error");
      }.bind(this), false);
      request.addEventListener("load", function(event)
      {
        if (onShutdown.done)
        {
          return;
        }
        delete this._downloading[downloadable.url];
        if (request.status && request.status != 200)
        {
          errorCallback("synchronize_connection_error");
          return;
        }
        this.onDownloadSuccess(downloadable, request.responseText, errorCallback, function redirectCallback(url)
        {
          if (redirects >= this.maxRedirects)
          {
            errorCallback("synchronize_connection_error");
          }
          else
          {
            downloadable.redirectURL = url;
            this._download(downloadable, redirects + 1);
          }
        }.bind(this));
      }.bind(this), false);
      this._downloading[downloadable.url] = true;
      if (this.onDownloadStarted)
      {
        this.onDownloadStarted(downloadable);
      }
      request.send(null);
    },
    processExpirationInterval: function(interval)
    {
      interval = Math.min(Math.max(interval, 0), this.maxExpirationInterval);
      var soft = Math.round(interval * (Math.random() * 0.4 + 0.8));
      var hard = interval * 2;
      var now = Date.now();
      return [now + soft, now + hard];
    }
  };
  var Downloadable = exports.Downloadable = function Downloadable(url)
  {
    this.url = url;
  };
  Downloadable.prototype =
  {
    url: null,
    redirectURL: null,
    lastError: 0,
    lastCheck: 0,
    lastVersion: 0,
    softExpiration: 0,
    hardExpiration: 0
  };
  return exports;
})();
require.scopes["filterNotifier"] = (function()
{
  var exports = {};
  var listeners = [];
  var FilterNotifier = exports.FilterNotifier =
  {
    addListener: function(listener)
    {
      if (listeners.indexOf(listener) >= 0)
      {
        return;
      }
      listeners.push(listener);
    },
    removeListener: function(listener)
    {
      var index = listeners.indexOf(listener);
      if (index >= 0)
      {
        listeners.splice(index, 1);
      }
    },
    triggerListeners: function(action, item, param1, param2, param3)
    {
      for (var _loopIndex4 = 0; _loopIndex4 < listeners.length; ++_loopIndex4)
      {
        var listener = listeners[_loopIndex4];
        listener(action, item, param1, param2, param3);
      }
    }
  };
  return exports;
})();
require.scopes["filterClasses"] = (function()
{
  var exports = {};
  var FilterNotifier = require("filterNotifier").FilterNotifier;

  function Filter(text)
  {
    this.text = text;
    this.subscriptions = [];
  }
  exports.Filter = Filter;
  Filter.prototype =
  {
    text: null,
    subscriptions: null,
    serialize: function(buffer)
    {
      buffer.push("[Filter]");
      buffer.push("text=" + this.text);
    },
    toString: function()
    {
      return this.text;
    }
  };
  Filter.knownFilters =
  {
    __proto__: null
  };
  Filter.elemhideRegExp = /^([^\/\*\|\@"!]*?)#(\@)?(?:([\w\-]+|\*)((?:\([\w\-]+(?:[$^*]?=[^\(\)"]*)?\))*)|#([^{}]+))$/;
  Filter.regexpRegExp = /^(@@)?\/.*\/(?:\$~?[\w\-]+(?:=[^,\s]+)?(?:,~?[\w\-]+(?:=[^,\s]+)?)*)?$/;
  Filter.optionsRegExp = /\$(~?[\w\-]+(?:=[^,\s]+)?(?:,~?[\w\-]+(?:=[^,\s]+)?)*)$/;
  Filter.fromText = function(text)
  {
    if (text in Filter.knownFilters)
    {
      return Filter.knownFilters[text];
    }
    var ret;
    var match = text.indexOf("#") >= 0 ? Filter.elemhideRegExp.exec(text) : null;
    if (match)
    {
      ret = ElemHideBase.fromText(text, match[1], match[2], match[3], match[4], match[5]);
    }
    else if (text[0] == "!")
    {
      ret = new CommentFilter(text);
    }
    else
    {
      ret = RegExpFilter.fromText(text);
    }
    Filter.knownFilters[ret.text] = ret;
    return ret;
  };
  Filter.fromObject = function(obj)
  {
    var ret = Filter.fromText(obj.text);
    if (ret instanceof ActiveFilter)
    {
      if ("disabled" in obj)
      {
        ret._disabled = obj.disabled == "true";
      }
      if ("hitCount" in obj)
      {
        ret._hitCount = parseInt(obj.hitCount) || 0;
      }
      if ("lastHit" in obj)
      {
        ret._lastHit = parseInt(obj.lastHit) || 0;
      }
    }
    return ret;
  };
  Filter.normalize = function(text)
  {
    if (!text)
    {
      return text;
    }
    text = text.replace(/[^\S ]/g, "");
    if (/^\s*!/.test(text))
    {
      return text.replace(/^\s+/, "").replace(/\s+$/, "");
    }
    else if (Filter.elemhideRegExp.test(text))
    {
      var _tempVar5 = /^(.*?)(#\@?#?)(.*)$/.exec(text);
      var domain = _tempVar5[1];
      var separator = _tempVar5[2];
      var selector = _tempVar5[3];
      return domain.replace(/\s/g, "") + separator + selector.replace(/^\s+/, "").replace(/\s+$/, "");
    }
    else
    {
      return text.replace(/\s/g, "");
    }
  };

  function InvalidFilter(text, reason)
  {
    Filter.call(this, text);
    this.reason = reason;
  }
  exports.InvalidFilter = InvalidFilter;
  InvalidFilter.prototype =
  {
    __proto__: Filter.prototype,
    reason: null,
    serialize: function(buffer){}
  };

  function CommentFilter(text)
  {
    Filter.call(this, text);
  }
  exports.CommentFilter = CommentFilter;
  CommentFilter.prototype =
  {
    __proto__: Filter.prototype,
    serialize: function(buffer){}
  };

  function ActiveFilter(text, domains)
  {
    Filter.call(this, text);
    this.domainSource = domains;
  }
  exports.ActiveFilter = ActiveFilter;
  ActiveFilter.prototype =
  {
    __proto__: Filter.prototype,
    _disabled: false,
    _hitCount: 0,
    _lastHit: 0,
    get disabled()
    {
      return this._disabled;
    },
    set disabled(value)
    {
      if (value != this._disabled)
      {
        var oldValue = this._disabled;
        this._disabled = value;
        FilterNotifier.triggerListeners("filter.disabled", this, value, oldValue);
      }
      return this._disabled;
    },
    get hitCount()
    {
      return this._hitCount;
    },
    set hitCount(value)
    {
      if (value != this._hitCount)
      {
        var oldValue = this._hitCount;
        this._hitCount = value;
        FilterNotifier.triggerListeners("filter.hitCount", this, value, oldValue);
      }
      return this._hitCount;
    },
    get lastHit()
    {
      return this._lastHit;
    },
    set lastHit(value)
    {
      if (value != this._lastHit)
      {
        var oldValue = this._lastHit;
        this._lastHit = value;
        FilterNotifier.triggerListeners("filter.lastHit", this, value, oldValue);
      }
      return this._lastHit;
    },
    domainSource: null,
    domainSeparator: null,
    ignoreTrailingDot: true,
    get domains()
    {
      var domains = null;
      if (this.domainSource)
      {
        var list = this.domainSource.split(this.domainSeparator);
        if (list.length == 1 && list[0][0] != "~")
        {
          domains =
          {
            __proto__: null,
            "": false
          };
          if (this.ignoreTrailingDot)
          {
            list[0] = list[0].replace(/\.+$/, "");
          }
          domains[list[0]] = true;
        }
        else
        {
          var hasIncludes = false;
          for (var i = 0; i < list.length; i++)
          {
            var domain = list[i];
            if (this.ignoreTrailingDot)
            {
              domain = domain.replace(/\.+$/, "");
            }
            if (domain == "")
            {
              continue;
            }
            var include;
            if (domain[0] == "~")
            {
              include = false;
              domain = domain.substr(1);
            }
            else
            {
              include = true;
              hasIncludes = true;
            }
            if (!domains)
            {
              domains =
              {
                __proto__: null
              };
            }
            domains[domain] = include;
          }
          domains[""] = !hasIncludes;
        }
        delete this.domainSource;
      }
      this.__defineGetter__("domains", function()
      {
        return domains;
      });
      return this.domains;
    },
    isActiveOnDomain: function(docDomain)
    {
      if (!this.domains)
      {
        return true;
      }
      if (!docDomain)
      {
        return this.domains[""];
      }
      if (this.ignoreTrailingDot)
      {
        docDomain = docDomain.replace(/\.+$/, "");
      }
      docDomain = docDomain.toUpperCase();
      while (true)
      {
        if (docDomain in this.domains)
        {
          return this.domains[docDomain];
        }
        var nextDot = docDomain.indexOf(".");
        if (nextDot < 0)
        {
          break;
        }
        docDomain = docDomain.substr(nextDot + 1);
      }
      return this.domains[""];
    },
    isActiveOnlyOnDomain: function(docDomain)
    {
      if (!docDomain || !this.domains || this.domains[""])
      {
        return false;
      }
      if (this.ignoreTrailingDot)
      {
        docDomain = docDomain.replace(/\.+$/, "");
      }
      docDomain = docDomain.toUpperCase();
      for (var domain in this.domains)
      {
        if (this.domains[domain] && domain != docDomain && (domain.length <= docDomain.length || domain.indexOf("." + docDomain) != domain.length - docDomain.length - 1))
        {
          return false;
        }
      }
      return true;
    },
    serialize: function(buffer)
    {
      if (this._disabled || this._hitCount || this._lastHit)
      {
        Filter.prototype.serialize.call(this, buffer);
        if (this._disabled)
        {
          buffer.push("disabled=true");
        }
        if (this._hitCount)
        {
          buffer.push("hitCount=" + this._hitCount);
        }
        if (this._lastHit)
        {
          buffer.push("lastHit=" + this._lastHit);
        }
      }
    }
  };

  function RegExpFilter(text, regexpSource, contentType, matchCase, domains, thirdParty)
  {
    ActiveFilter.call(this, text, domains);
    if (contentType != null)
    {
      this.contentType = contentType;
    }
    if (matchCase)
    {
      this.matchCase = matchCase;
    }
    if (thirdParty != null)
    {
      this.thirdParty = thirdParty;
    }
    if (regexpSource.length >= 2 && regexpSource[0] == "/" && regexpSource[regexpSource.length - 1] == "/")
    {
      var regexp = new RegExp(regexpSource.substr(1, regexpSource.length - 2), this.matchCase ? "" : "i");
      this.__defineGetter__("regexp", function()
      {
        return regexp;
      });
    }
    else
    {
      this.regexpSource = regexpSource;
    }
  }
  exports.RegExpFilter = RegExpFilter;
  RegExpFilter.prototype =
  {
    __proto__: ActiveFilter.prototype,
    length: 1,
    domainSeparator: "|",
    regexpSource: null,
    get regexp()
    {
      var source = this.regexpSource.replace(/\*+/g, "*");
      if (source[0] == "*")
      {
        source = source.substr(1);
      }
      var pos = source.length - 1;
      if (pos >= 0 && source[pos] == "*")
      {
        source = source.substr(0, pos);
      }
      source = source.replace(/\^\|$/, "^").replace(/\W/g, "\\$&").replace(/\\\*/g, ".*").replace(/\\\^/g, "(?:[\\x00-\\x24\\x26-\\x2C\\x2F\\x3A-\\x40\\x5B-\\x5E\\x60\\x7B-\\x80]|$)").replace(/^\\\|\\\|/, "^[\\w\\-]+:\\/+(?!\\/)(?:[^.\\/]+\\.)*?").replace(/^\\\|/, "^").replace(/\\\|$/, "$");
      var regexp = new RegExp(source, this.matchCase ? "" : "i");
      delete this.regexpSource;
      this.__defineGetter__("regexp", function()
      {
        return regexp;
      });
      return this.regexp;
    },
    contentType: 2147483647,
    matchCase: false,
    thirdParty: null,
    matches: function(location, contentType, docDomain, thirdParty)
    {
      if (this.regexp.test(location) && (RegExpFilter.typeMap[contentType] & this.contentType) != 0 && (this.thirdParty == null || this.thirdParty == thirdParty) && this.isActiveOnDomain(docDomain))
      {
        return true;
      }
      return false;
    }
  };
  RegExpFilter.prototype.__defineGetter__("0", function()
  {
    return this;
  });
  RegExpFilter.fromText = function(text)
  {
    var blocking = true;
    var origText = text;
    if (text.indexOf("@@") == 0)
    {
      blocking = false;
      text = text.substr(2);
    }
    var contentType = null;
    var matchCase = null;
    var domains = null;
    var siteKeys = null;
    var thirdParty = null;
    var collapse = null;
    var options;
    var match = text.indexOf("$") >= 0 ? Filter.optionsRegExp.exec(text) : null;
    if (match)
    {
      options = match[1].toUpperCase().split(",");
      text = match.input.substr(0, match.index);
      for (var _loopIndex6 = 0; _loopIndex6 < options.length; ++_loopIndex6)
      {
        var option = options[_loopIndex6];
        var value = null;
        var separatorIndex = option.indexOf("=");
        if (separatorIndex >= 0)
        {
          value = option.substr(separatorIndex + 1);
          option = option.substr(0, separatorIndex);
        }
        option = option.replace(/-/, "_");
        if (option in RegExpFilter.typeMap)
        {
          if (contentType == null)
          {
            contentType = 0;
          }
          contentType |= RegExpFilter.typeMap[option];
        }
        else if (option[0] == "~" && option.substr(1) in RegExpFilter.typeMap)
        {
          if (contentType == null)
          {
            contentType = RegExpFilter.prototype.contentType;
          }
          contentType &= ~RegExpFilter.typeMap[option.substr(1)];
        }
        else if (option == "MATCH_CASE")
        {
          matchCase = true;
        }
        else if (option == "~MATCH_CASE")
        {
          matchCase = false;
        }
        else if (option == "DOMAIN" && typeof value != "undefined")
        {
          domains = value;
        }
        else if (option == "THIRD_PARTY")
        {
          thirdParty = true;
        }
        else if (option == "~THIRD_PARTY")
        {
          thirdParty = false;
        }
        else if (option == "COLLAPSE")
        {
          collapse = true;
        }
        else if (option == "~COLLAPSE")
        {
          collapse = false;
        }
        else if (option == "SITEKEY" && typeof value != "undefined")
        {
          siteKeys = value.split(/\|/);
        }
        else
        {
          return new InvalidFilter(origText, "Unknown option " + option.toLowerCase());
        }
      }
    }
    if (!blocking && (contentType == null || contentType & RegExpFilter.typeMap.DOCUMENT) && (!options || options.indexOf("DOCUMENT") < 0) && !/^\|?[\w\-]+:/.test(text))
    {
      if (contentType == null)
      {
        contentType = RegExpFilter.prototype.contentType;
      }
      contentType &= ~RegExpFilter.typeMap.DOCUMENT;
    }
    if (!blocking && siteKeys)
    {
      contentType = RegExpFilter.typeMap.DOCUMENT;
    }
    try
    {
      if (blocking)
      {
        return new BlockingFilter(origText, text, contentType, matchCase, domains, thirdParty, collapse);
      }
      else
      {
        return new WhitelistFilter(origText, text, contentType, matchCase, domains, thirdParty, siteKeys);
      }
    }
    catch (e)
    {
      return new InvalidFilter(origText, e);
    }
  };
  RegExpFilter.typeMap =
  {
    OTHER: 1,
    SCRIPT: 2,
    IMAGE: 4,
    STYLESHEET: 8,
    OBJECT: 16,
    SUBDOCUMENT: 32,
    DOCUMENT: 64,
    XBL: 1,
    PING: 1,
    XMLHTTPREQUEST: 2048,
    OBJECT_SUBREQUEST: 4096,
    DTD: 1,
    MEDIA: 16384,
    FONT: 32768,
    BACKGROUND: 4,
    POPUP: 268435456,
    ELEMHIDE: 1073741824
  };
  RegExpFilter.prototype.contentType &= ~ (RegExpFilter.typeMap.ELEMHIDE | RegExpFilter.typeMap.POPUP);

  function BlockingFilter(text, regexpSource, contentType, matchCase, domains, thirdParty, collapse)
  {
    RegExpFilter.call(this, text, regexpSource, contentType, matchCase, domains, thirdParty);
    this.collapse = collapse;
  }
  exports.BlockingFilter = BlockingFilter;
  BlockingFilter.prototype =
  {
    __proto__: RegExpFilter.prototype,
    collapse: null
  };

  function WhitelistFilter(text, regexpSource, contentType, matchCase, domains, thirdParty, siteKeys)
  {
    RegExpFilter.call(this, text, regexpSource, contentType, matchCase, domains, thirdParty);
    if (siteKeys != null)
    {
      this.siteKeys = siteKeys;
    }
  }
  exports.WhitelistFilter = WhitelistFilter;
  WhitelistFilter.prototype =
  {
    __proto__: RegExpFilter.prototype,
    siteKeys: null
  };

  function ElemHideBase(text, domains, selector)
  {
    ActiveFilter.call(this, text, domains ? domains.toUpperCase() : null);
    if (domains)
    {
      this.selectorDomain = domains.replace(/,~[^,]+/g, "").replace(/^~[^,]+,?/, "").toLowerCase();
    }
    this.selector = selector;
  }
  exports.ElemHideBase = ElemHideBase;
  ElemHideBase.prototype =
  {
    __proto__: ActiveFilter.prototype,
    domainSeparator: ",",
    ignoreTrailingDot: false,
    selectorDomain: null,
    selector: null
  };
  ElemHideBase.fromText = function(text, domain, isException, tagName, attrRules, selector)
  {
    if (!selector)
    {
      if (tagName == "*")
      {
        tagName = "";
      }
      var id = null;
      var additional = "";
      if (attrRules)
      {
        attrRules = attrRules.match(/\([\w\-]+(?:[$^*]?=[^\(\)"]*)?\)/g);
        for (var _loopIndex7 = 0; _loopIndex7 < attrRules.length; ++_loopIndex7)
        {
          var rule = attrRules[_loopIndex7];
          rule = rule.substr(1, rule.length - 2);
          var separatorPos = rule.indexOf("=");
          if (separatorPos > 0)
          {
            rule = rule.replace(/=/, "=\"") + "\"";
            additional += "[" + rule + "]";
          }
          else
          {
            if (id)
            {
              var Utils = require("utils").Utils;
              return new InvalidFilter(text, Utils.getString("filter_elemhide_duplicate_id"));
            }
            else
            {
              id = rule;
            }
          }
        }
      }
      if (id)
      {
        selector = tagName + "." + id + additional + "," + tagName + "#" + id + additional;
      }
      else if (tagName || additional)
      {
        selector = tagName + additional;
      }
      else
      {
        var Utils = require("utils").Utils;
        return new InvalidFilter(text, Utils.getString("filter_elemhide_nocriteria"));
      }
    }
    if (isException)
    {
      return new ElemHideException(text, domain, selector);
    }
    else
    {
      return new ElemHideFilter(text, domain, selector);
    }
  };

  function ElemHideFilter(text, domains, selector)
  {
    ElemHideBase.call(this, text, domains, selector);
  }
  exports.ElemHideFilter = ElemHideFilter;
  ElemHideFilter.prototype =
  {
    __proto__: ElemHideBase.prototype
  };

  function ElemHideException(text, domains, selector)
  {
    ElemHideBase.call(this, text, domains, selector);
  }
  exports.ElemHideException = ElemHideException;
  ElemHideException.prototype =
  {
    __proto__: ElemHideBase.prototype
  };
  return exports;
})();
require.scopes["subscriptionClasses"] = (function()
{
  var exports = {};
  var _tempVar8 = require("filterClasses");
  var ActiveFilter = _tempVar8.ActiveFilter;
  var BlockingFilter = _tempVar8.BlockingFilter;
  var WhitelistFilter = _tempVar8.WhitelistFilter;
  var ElemHideBase = _tempVar8.ElemHideBase;
  var FilterNotifier = require("filterNotifier").FilterNotifier;

  function Subscription(url, title)
  {
    this.url = url;
    this.filters = [];
    if (title)
    {
      this._title = title;
    }
    else
    {
      var Utils = require("utils").Utils;
      this._title = Utils.getString("newGroup_title");
    }
    Subscription.knownSubscriptions[url] = this;
  }
  exports.Subscription = Subscription;
  Subscription.prototype =
  {
    url: null,
    filters: null,
    _title: null,
    _fixedTitle: false,
    _disabled: false,
    get title()
    {
      return this._title;
    },
    set title(value)
    {
      if (value != this._title)
      {
        var oldValue = this._title;
        this._title = value;
        FilterNotifier.triggerListeners("subscription.title", this, value, oldValue);
      }
      return this._title;
    },
    get fixedTitle()
    {
      return this._fixedTitle;
    },
    set fixedTitle(value)
    {
      if (value != this._fixedTitle)
      {
        var oldValue = this._fixedTitle;
        this._fixedTitle = value;
        FilterNotifier.triggerListeners("subscription.fixedTitle", this, value, oldValue);
      }
      return this._fixedTitle;
    },
    get disabled()
    {
      return this._disabled;
    },
    set disabled(value)
    {
      if (value != this._disabled)
      {
        var oldValue = this._disabled;
        this._disabled = value;
        FilterNotifier.triggerListeners("subscription.disabled", this, value, oldValue);
      }
      return this._disabled;
    },
    serialize: function(buffer)
    {
      buffer.push("[Subscription]");
      buffer.push("url=" + this.url);
      buffer.push("title=" + this._title);
      if (this._fixedTitle)
      {
        buffer.push("fixedTitle=true");
      }
      if (this._disabled)
      {
        buffer.push("disabled=true");
      }
    },
    serializeFilters: function(buffer)
    {
      for (var _loopIndex9 = 0; _loopIndex9 < this.filters.length; ++_loopIndex9)
      {
        var filter = this.filters[_loopIndex9];
        buffer.push(filter.text.replace(/\[/g, "\\["));
      }
    },
    toString: function()
    {
      var buffer = [];
      this.serialize(buffer);
      return buffer.join("\n");
    }
  };
  Subscription.knownSubscriptions =
  {
    __proto__: null
  };
  Subscription.fromURL = function(url)
  {
    if (url in Subscription.knownSubscriptions)
    {
      return Subscription.knownSubscriptions[url];
    }
    try
    {
      url = Services.io.newURI(url, null, null).spec;
      return new DownloadableSubscription(url, null);
    }
    catch (e)
    {
      return new SpecialSubscription(url);
    }
  };
  Subscription.fromObject = function(obj)
  {
    var result;
    try
    {
      obj.url = Services.io.newURI(obj.url, null, null).spec;
      result = new DownloadableSubscription(obj.url, obj.title);
      if ("downloadStatus" in obj)
      {
        result._downloadStatus = obj.downloadStatus;
      }
      if ("lastSuccess" in obj)
      {
        result.lastSuccess = parseInt(obj.lastSuccess) || 0;
      }
      if ("lastCheck" in obj)
      {
        result._lastCheck = parseInt(obj.lastCheck) || 0;
      }
      if ("expires" in obj)
      {
        result.expires = parseInt(obj.expires) || 0;
      }
      if ("softExpiration" in obj)
      {
        result.softExpiration = parseInt(obj.softExpiration) || 0;
      }
      if ("errors" in obj)
      {
        result._errors = parseInt(obj.errors) || 0;
      }
      if ("version" in obj)
      {
        result.version = parseInt(obj.version) || 0;
      }
      if ("requiredVersion" in obj)
      {
        var addonVersion = require("info").addonVersion;
        result.requiredVersion = obj.requiredVersion;
        if (Services.vc.compare(result.requiredVersion, addonVersion) > 0)
        {
          result.upgradeRequired = true;
        }
      }
      if ("homepage" in obj)
      {
        result._homepage = obj.homepage;
      }
      if ("lastDownload" in obj)
      {
        result._lastDownload = parseInt(obj.lastDownload) || 0;
      }
    }
    catch (e)
    {
      if (!("title" in obj))
      {
        if (obj.url == "~wl~")
        {
          obj.defaults = "whitelist";
        }
        else if (obj.url == "~fl~")
        {
          obj.defaults = "blocking";
        }
        else if (obj.url == "~eh~")
        {
          obj.defaults = "elemhide";
        }
        if ("defaults" in obj)
        {
          var Utils = require("utils").Utils;
          obj.title = Utils.getString(obj.defaults + "Group_title");
        }
      }
      result = new SpecialSubscription(obj.url, obj.title);
      if ("defaults" in obj)
      {
        result.defaults = obj.defaults.split(" ");
      }
    }
    if ("fixedTitle" in obj)
    {
      result._fixedTitle = obj.fixedTitle == "true";
    }
    if ("disabled" in obj)
    {
      result._disabled = obj.disabled == "true";
    }
    return result;
  };

  function SpecialSubscription(url, title)
  {
    Subscription.call(this, url, title);
  }
  exports.SpecialSubscription = SpecialSubscription;
  SpecialSubscription.prototype =
  {
    __proto__: Subscription.prototype,
    defaults: null,
    isDefaultFor: function(filter)
    {
      if (this.defaults && this.defaults.length)
      {
        for (var _loopIndex10 = 0; _loopIndex10 < this.defaults.length; ++_loopIndex10)
        {
          var type = this.defaults[_loopIndex10];
          if (filter instanceof SpecialSubscription.defaultsMap[type])
          {
            return true;
          }
          if (!(filter instanceof ActiveFilter) && type == "blacklist")
          {
            return true;
          }
        }
      }
      return false;
    },
    serialize: function(buffer)
    {
      Subscription.prototype.serialize.call(this, buffer);
      if (this.defaults && this.defaults.length)
      {
        buffer.push("defaults=" + this.defaults.filter(function(type)
        {
          return type in SpecialSubscription.defaultsMap;
        }).join(" "));
      }
      if (this._lastDownload)
      {
        buffer.push("lastDownload=" + this._lastDownload);
      }
    }
  };
  SpecialSubscription.defaultsMap =
  {
    __proto__: null,
    "whitelist": WhitelistFilter,
    "blocking": BlockingFilter,
    "elemhide": ElemHideBase
  };
  SpecialSubscription.create = function(title)
  {
    var url;
    do
    {
      url = "~user~" + Math.round(Math.random() * 1000000);
    }
    while (url in Subscription.knownSubscriptions);
    return new SpecialSubscription(url, title);
  };
  SpecialSubscription.createForFilter = function(filter)
  {
    var subscription = SpecialSubscription.create();
    subscription.filters.push(filter);
    for (var type in SpecialSubscription.defaultsMap)
    {
      if (filter instanceof SpecialSubscription.defaultsMap[type])
      {
        subscription.defaults = [type];
      }
    }
    if (!subscription.defaults)
    {
      subscription.defaults = ["blocking"];
    }
    var Utils = require("utils").Utils;
    subscription.title = Utils.getString(subscription.defaults[0] + "Group_title");
    return subscription;
  };

  function RegularSubscription(url, title)
  {
    Subscription.call(this, url, title || url);
  }
  exports.RegularSubscription = RegularSubscription;
  RegularSubscription.prototype =
  {
    __proto__: Subscription.prototype,
    _homepage: null,
    _lastDownload: 0,
    get homepage()
    {
      return this._homepage;
    },
    set homepage(value)
    {
      if (value != this._homepage)
      {
        var oldValue = this._homepage;
        this._homepage = value;
        FilterNotifier.triggerListeners("subscription.homepage", this, value, oldValue);
      }
      return this._homepage;
    },
    get lastDownload()
    {
      return this._lastDownload;
    },
    set lastDownload(value)
    {
      if (value != this._lastDownload)
      {
        var oldValue = this._lastDownload;
        this._lastDownload = value;
        FilterNotifier.triggerListeners("subscription.lastDownload", this, value, oldValue);
      }
      return this._lastDownload;
    },
    serialize: function(buffer)
    {
      Subscription.prototype.serialize.call(this, buffer);
      if (this._homepage)
      {
        buffer.push("homepage=" + this._homepage);
      }
      if (this._lastDownload)
      {
        buffer.push("lastDownload=" + this._lastDownload);
      }
    }
  };

  function ExternalSubscription(url, title)
  {
    RegularSubscription.call(this, url, title);
  }
  exports.ExternalSubscription = ExternalSubscription;
  ExternalSubscription.prototype =
  {
    __proto__: RegularSubscription.prototype,
    serialize: function(buffer)
    {
      throw new Error("Unexpected call, external subscriptions should not be serialized");
    }
  };

  function DownloadableSubscription(url, title)
  {
    RegularSubscription.call(this, url, title);
  }
  exports.DownloadableSubscription = DownloadableSubscription;
  DownloadableSubscription.prototype =
  {
    __proto__: RegularSubscription.prototype,
    _downloadStatus: null,
    _lastCheck: 0,
    _errors: 0,
    get downloadStatus()
    {
      return this._downloadStatus;
    },
    set downloadStatus(value)
    {
      var oldValue = this._downloadStatus;
      this._downloadStatus = value;
      FilterNotifier.triggerListeners("subscription.downloadStatus", this, value, oldValue);
      return this._downloadStatus;
    },
    lastSuccess: 0,
    get lastCheck()
    {
      return this._lastCheck;
    },
    set lastCheck(value)
    {
      if (value != this._lastCheck)
      {
        var oldValue = this._lastCheck;
        this._lastCheck = value;
        FilterNotifier.triggerListeners("subscription.lastCheck", this, value, oldValue);
      }
      return this._lastCheck;
    },
    expires: 0,
    softExpiration: 0,
    get errors()
    {
      return this._errors;
    },
    set errors(value)
    {
      if (value != this._errors)
      {
        var oldValue = this._errors;
        this._errors = value;
        FilterNotifier.triggerListeners("subscription.errors", this, value, oldValue);
      }
      return this._errors;
    },
    version: 0,
    requiredVersion: null,
    upgradeRequired: false,
    serialize: function(buffer)
    {
      RegularSubscription.prototype.serialize.call(this, buffer);
      if (this.downloadStatus)
      {
        buffer.push("downloadStatus=" + this.downloadStatus);
      }
      if (this.lastSuccess)
      {
        buffer.push("lastSuccess=" + this.lastSuccess);
      }
      if (this.lastCheck)
      {
        buffer.push("lastCheck=" + this.lastCheck);
      }
      if (this.expires)
      {
        buffer.push("expires=" + this.expires);
      }
      if (this.softExpiration)
      {
        buffer.push("softExpiration=" + this.softExpiration);
      }
      if (this.errors)
      {
        buffer.push("errors=" + this.errors);
      }
      if (this.version)
      {
        buffer.push("version=" + this.version);
      }
      if (this.requiredVersion)
      {
        buffer.push("requiredVersion=" + this.requiredVersion);
      }
    }
  };
  return exports;
})();
require.scopes["filterStorage"] = (function()
{
  var exports = {};
  var IO = require("io").IO;
  var Prefs = require("prefs").Prefs;
  var _tempVar11 = require("filterClasses");
  var Filter = _tempVar11.Filter;
  var ActiveFilter = _tempVar11.ActiveFilter;
  var _tempVar12 = require("subscriptionClasses");
  var Subscription = _tempVar12.Subscription;
  var SpecialSubscription = _tempVar12.SpecialSubscription;
  var ExternalSubscription = _tempVar12.ExternalSubscription;
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var formatVersion = 4;
  var FilterStorage = exports.FilterStorage =
  {
    get formatVersion()
    {
      return formatVersion;
    },
    get sourceFile()
    {
      var file = null;
      if (Prefs.patternsfile)
      {
        file = IO.resolveFilePath(Prefs.patternsfile);
      }
      if (!file)
      {
        file = IO.resolveFilePath(Prefs.data_directory);
        if (file)
        {
          file.append("patterns.ini");
        }
      }
      if (!file)
      {
        try
        {
          file = IO.resolveFilePath(Services.prefs.getDefaultBranch("extensions.adblockplus.").getCharPref("data_directory"));
          if (file)
          {
            file.append("patterns.ini");
          }
        }
        catch (e){}
      }
      if (!file)
      {
        Cu.reportError("Adblock Plus: Failed to resolve filter file location from extensions.adblockplus.patternsfile preference");
      }
      this.__defineGetter__("sourceFile", function()
      {
        return file;
      });
      return this.sourceFile;
    },
    fileProperties:
    {
      __proto__: null
    },
    subscriptions: [],
    knownSubscriptions:
    {
      __proto__: null
    },
    getGroupForFilter: function(filter)
    {
      var generalSubscription = null;
      for (var _loopIndex13 = 0; _loopIndex13 < FilterStorage.subscriptions.length; ++_loopIndex13)
      {
        var subscription = FilterStorage.subscriptions[_loopIndex13];
        if (subscription instanceof SpecialSubscription && !subscription.disabled)
        {
          if (subscription.isDefaultFor(filter))
          {
            return subscription;
          }
          if (!generalSubscription && (!subscription.defaults || !subscription.defaults.length))
          {
            generalSubscription = subscription;
          }
        }
      }
      return generalSubscription;
    },
    addSubscription: function(subscription, silent)
    {
      if (subscription.url in FilterStorage.knownSubscriptions)
      {
        return;
      }
      FilterStorage.subscriptions.push(subscription);
      FilterStorage.knownSubscriptions[subscription.url] = subscription;
      addSubscriptionFilters(subscription);
      if (!silent)
      {
        FilterNotifier.triggerListeners("subscription.added", subscription);
      }
    },
    removeSubscription: function(subscription, silent)
    {
      for (var i = 0; i < FilterStorage.subscriptions.length; i++)
      {
        if (FilterStorage.subscriptions[i].url == subscription.url)
        {
          removeSubscriptionFilters(subscription);
          FilterStorage.subscriptions.splice(i--, 1);
          delete FilterStorage.knownSubscriptions[subscription.url];
          if (!silent)
          {
            FilterNotifier.triggerListeners("subscription.removed", subscription);
          }
          return;
        }
      }
    },
    moveSubscription: function(subscription, insertBefore)
    {
      var currentPos = FilterStorage.subscriptions.indexOf(subscription);
      if (currentPos < 0)
      {
        return;
      }
      var newPos = insertBefore ? FilterStorage.subscriptions.indexOf(insertBefore) : -1;
      if (newPos < 0)
      {
        newPos = FilterStorage.subscriptions.length;
      }
      if (currentPos < newPos)
      {
        newPos--;
      }
      if (currentPos == newPos)
      {
        return;
      }
      FilterStorage.subscriptions.splice(currentPos, 1);
      FilterStorage.subscriptions.splice(newPos, 0, subscription);
      FilterNotifier.triggerListeners("subscription.moved", subscription);
    },
    updateSubscriptionFilters: function(subscription, filters)
    {
      removeSubscriptionFilters(subscription);
      subscription.oldFilters = subscription.filters;
      subscription.filters = filters;
      addSubscriptionFilters(subscription);
      FilterNotifier.triggerListeners("subscription.updated", subscription);
      delete subscription.oldFilters;
    },
    addFilter: function(filter, subscription, position, silent)
    {
      if (!subscription)
      {
        if (filter.subscriptions.some(function(s)
        {
          return s instanceof SpecialSubscription && !s.disabled;
        }))
        {
          return;
        }
        subscription = FilterStorage.getGroupForFilter(filter);
      }
      if (!subscription)
      {
        subscription = SpecialSubscription.createForFilter(filter);
        this.addSubscription(subscription);
        return;
      }
      if (typeof position == "undefined")
      {
        position = subscription.filters.length;
      }
      if (filter.subscriptions.indexOf(subscription) < 0)
      {
        filter.subscriptions.push(subscription);
      }
      subscription.filters.splice(position, 0, filter);
      if (!silent)
      {
        FilterNotifier.triggerListeners("filter.added", filter, subscription, position);
      }
    },
    removeFilter: function(filter, subscription, position)
    {
      var subscriptions = subscription ? [subscription] : filter.subscriptions.slice();
      for (var i = 0; i < subscriptions.length; i++)
      {
        var subscription = subscriptions[i];
        if (subscription instanceof SpecialSubscription)
        {
          var positions = [];
          if (typeof position == "undefined")
          {
            var index = -1;
            do
            {
              index = subscription.filters.indexOf(filter, index + 1);
              if (index >= 0)
              {
                positions.push(index);
              }
            }
            while (index >= 0);
          }
          else
          {
            positions.push(position);
          }
          for (var j = positions.length - 1; j >= 0; j--)
          {
            var position = positions[j];
            if (subscription.filters[position] == filter)
            {
              subscription.filters.splice(position, 1);
              if (subscription.filters.indexOf(filter) < 0)
              {
                var index = filter.subscriptions.indexOf(subscription);
                if (index >= 0)
                {
                  filter.subscriptions.splice(index, 1);
                }
              }
              FilterNotifier.triggerListeners("filter.removed", filter, subscription, position);
            }
          }
        }
      }
    },
    moveFilter: function(filter, subscription, oldPosition, newPosition)
    {
      if (!(subscription instanceof SpecialSubscription) || subscription.filters[oldPosition] != filter)
      {
        return;
      }
      newPosition = Math.min(Math.max(newPosition, 0), subscription.filters.length - 1);
      if (oldPosition == newPosition)
      {
        return;
      }
      subscription.filters.splice(oldPosition, 1);
      subscription.filters.splice(newPosition, 0, filter);
      FilterNotifier.triggerListeners("filter.moved", filter, subscription, oldPosition, newPosition);
    },
    increaseHitCount: function(filter, wnd)
    {
      if (!Prefs.savestats || PrivateBrowsing.enabledForWindow(wnd) || PrivateBrowsing.enabled || !(filter instanceof ActiveFilter))
      {
        return;
      }
      filter.hitCount++;
      filter.lastHit = Date.now();
    },
    resetHitCounts: function(filters)
    {
      if (!filters)
      {
        filters = [];
        for (var text in Filter.knownFilters)
        {
          filters.push(Filter.knownFilters[text]);
        }
      }
      for (var _loopIndex14 = 0; _loopIndex14 < filters.length; ++_loopIndex14)
      {
        var filter = filters[_loopIndex14];
        filter.hitCount = 0;
        filter.lastHit = 0;
      }
    },
    _loading: false,
    loadFromDisk: function(sourceFile)
    {
      if (this._loading)
      {
        return;
      }
      var readFile = function(sourceFile, backupIndex)
      {
        var parser = new INIParser();
        IO.readFromFile(sourceFile, true, parser, function(e)
        {
          if (!e && parser.subscriptions.length == 0)
          {
            e = new Error("No data in the file");
          }
          if (e)
          {
            Cu.reportError(e);
          }
          if (e && !explicitFile)
          {
            sourceFile = this.sourceFile;
            if (sourceFile)
            {
              var _tempVar15 = /^(.*)(\.\w+)$/.exec(sourceFile.leafName) || [null, sourceFile.leafName, ""];
              var part1 = _tempVar15[1];
              var part2 = _tempVar15[2];
              sourceFile = sourceFile.clone();
              sourceFile.leafName = part1 + "-backup" + ++backupIndex + part2;
              IO.statFile(sourceFile, function(e, statData)
              {
                if (!e && statData.exists)
                {
                  readFile(sourceFile, backupIndex);
                }
                else
                {
                  doneReading(parser);
                }
              });
              return;
            }
          }
          doneReading(parser);
        }.bind(this), "FilterStorageRead");
      }.bind(this);
      var doneReading = function(parser)
      {
        var specialMap =
        {
          "~il~": true,
          "~wl~": true,
          "~fl~": true,
          "~eh~": true
        };
        var knownSubscriptions =
        {
          __proto__: null
        };
        for (var i = 0; i < parser.subscriptions.length; i++)
        {
          var subscription = parser.subscriptions[i];
          if (subscription instanceof SpecialSubscription && subscription.filters.length == 0 && subscription.url in specialMap)
          {
            parser.subscriptions.splice(i--, 1);
          }
          else
          {
            knownSubscriptions[subscription.url] = subscription;
          }
        }
        this.fileProperties = parser.fileProperties;
        this.subscriptions = parser.subscriptions;
        this.knownSubscriptions = knownSubscriptions;
        Filter.knownFilters = parser.knownFilters;
        Subscription.knownSubscriptions = parser.knownSubscriptions;
        if (parser.userFilters)
        {
          for (var i = 0; i < parser.userFilters.length; i++)
          {
            var filter = Filter.fromText(parser.userFilters[i]);
            this.addFilter(filter, null, undefined, true);
          }
        }
        this._loading = false;
        FilterNotifier.triggerListeners("load");
        if (sourceFile != this.sourceFile)
        {
          this.saveToDisk();
        }
      }.bind(this);
      var startRead = function(file)
      {
        this._loading = true;
        readFile(file, 0);
      }.bind(this);
      var explicitFile;
      if (sourceFile)
      {
        explicitFile = true;
        startRead(sourceFile);
      }
      else
      {
        explicitFile = false;
        sourceFile = FilterStorage.sourceFile;
        var callback = function(e, statData)
        {
          if (e || !statData.exists)
          {
            var addonRoot = require("info").addonRoot;
            sourceFile = Services.io.newURI(addonRoot + "defaults/patterns.ini", null, null);
          }
          startRead(sourceFile);
        };
        if (sourceFile)
        {
          IO.statFile(sourceFile, callback);
        }
        else
        {
          callback(true);
        }
      }
    },
    _generateFilterData: function(subscriptions)
    {
      var _generatorResult16 = [];
      _generatorResult16.push("# Adblock Plus preferences");
      _generatorResult16.push("version=" + formatVersion);
      var saved =
      {
        __proto__: null
      };
      var buf = [];
      for (var i = 0; i < subscriptions.length; i++)
      {
        var subscription = subscriptions[i];
        for (var j = 0; j < subscription.filters.length; j++)
        {
          var filter = subscription.filters[j];
          if (!(filter.text in saved))
          {
            filter.serialize(buf);
            saved[filter.text] = filter;
            for (var k = 0; k < buf.length; k++)
            {
              _generatorResult16.push(buf[k]);
            }
            buf.splice(0);
          }
        }
      }
      for (var i = 0; i < subscriptions.length; i++)
      {
        var subscription = subscriptions[i];
        _generatorResult16.push("");
        subscription.serialize(buf);
        if (subscription.filters.length)
        {
          buf.push("", "[Subscription filters]");
          subscription.serializeFilters(buf);
        }
        for (var k = 0; k < buf.length; k++)
        {
          _generatorResult16.push(buf[k]);
        }
        buf.splice(0);
      }
      return _generatorResult16;
    },
    _saving: false,
    _needsSave: false,
    saveToDisk: function(targetFile)
    {
      var explicitFile = true;
      if (!targetFile)
      {
        targetFile = FilterStorage.sourceFile;
        explicitFile = false;
      }
      if (!targetFile)
      {
        return;
      }
      if (!explicitFile && this._saving)
      {
        this._needsSave = true;
        return;
      }
      try
      {
        targetFile.parent.create(Ci.nsIFile.DIRECTORY_TYPE, FileUtils.PERMS_DIRECTORY);
      }
      catch (e){}
      var writeFilters = function()
      {
        IO.writeToFile(targetFile, true, this._generateFilterData(subscriptions), function(e)
        {
          if (!explicitFile)
          {
            this._saving = false;
          }
          if (e)
          {
            Cu.reportError(e);
          }
          if (!explicitFile && this._needsSave)
          {
            this._needsSave = false;
            this.saveToDisk();
          }
          else
          {
            FilterNotifier.triggerListeners("save");
          }
        }.bind(this), "FilterStorageWrite");
      }.bind(this);
      var checkBackupRequired = function(callbackNotRequired, callbackRequired)
      {
        if (explicitFile || Prefs.patternsbackups <= 0)
        {
          callbackNotRequired();
        }
        else
        {
          IO.statFile(targetFile, function(e, statData)
          {
            if (e || !statData.exists)
            {
              callbackNotRequired();
            }
            else
            {
              var _tempVar17 = /^(.*)(\.\w+)$/.exec(targetFile.leafName) || [null, targetFile.leafName, ""];
              var part1 = _tempVar17[1];
              var part2 = _tempVar17[2];
              var newestBackup = targetFile.clone();
              newestBackup.leafName = part1 + "-backup1" + part2;
              IO.statFile(newestBackup, function(e, statData)
              {
                if (!e && (!statData.exists || (Date.now() - statData.lastModified) / 3600000 >= Prefs.patternsbackupinterval))
                {
                  callbackRequired(part1, part2);
                }
                else
                {
                  callbackNotRequired();
                }
              });
            }
          });
        }
      }.bind(this);
      var removeLastBackup = function(part1, part2)
      {
        var file = targetFile.clone();
        file.leafName = part1 + "-backup" + Prefs.patternsbackups + part2;
        IO.removeFile(file, function(e)
        {
          return renameBackup(part1, part2, Prefs.patternsbackups - 1);
        });
      }.bind(this);
      var renameBackup = function(part1, part2, index)
      {
        if (index > 0)
        {
          var fromFile = targetFile.clone();
          fromFile.leafName = part1 + "-backup" + index + part2;
          var toName = part1 + "-backup" + (index + 1) + part2;
          IO.renameFile(fromFile, toName, function(e)
          {
            return renameBackup(part1, part2, index - 1);
          });
        }
        else
        {
          var toFile = targetFile.clone();
          toFile.leafName = part1 + "-backup" + (index + 1) + part2;
          IO.copyFile(targetFile, toFile, writeFilters);
        }
      }.bind(this);
      var subscriptions = this.subscriptions.filter(function(s)
      {
        return !(s instanceof ExternalSubscription);
      });
      if (!explicitFile)
      {
        this._saving = true;
      }
      checkBackupRequired(writeFilters, removeLastBackup);
    },
    getBackupFiles: function()
    {
      var result = [];
      var _tempVar18 = /^(.*)(\.\w+)$/.exec(FilterStorage.sourceFile.leafName) || [null, FilterStorage.sourceFile.leafName, ""];
      var part1 = _tempVar18[1];
      var part2 = _tempVar18[2];
      for (var i = 1;; i++)
      {
        var file = FilterStorage.sourceFile.clone();
        file.leafName = part1 + "-backup" + i + part2;
        if (file.exists())
        {
          result.push(file);
        }
        else
        {
          break;
        }
      }
      return result;
    }
  };

  function addSubscriptionFilters(subscription)
  {
    if (!(subscription.url in FilterStorage.knownSubscriptions))
    {
      return;
    }
    for (var _loopIndex19 = 0; _loopIndex19 < subscription.filters.length; ++_loopIndex19)
    {
      var filter = subscription.filters[_loopIndex19];
      filter.subscriptions.push(subscription);
    }
  }

  function removeSubscriptionFilters(subscription)
  {
    if (!(subscription.url in FilterStorage.knownSubscriptions))
    {
      return;
    }
    for (var _loopIndex20 = 0; _loopIndex20 < subscription.filters.length; ++_loopIndex20)
    {
      var filter = subscription.filters[_loopIndex20];
      var i = filter.subscriptions.indexOf(subscription);
      if (i >= 0)
      {
        filter.subscriptions.splice(i, 1);
      }
    }
  }
  var PrivateBrowsing = exports.PrivateBrowsing =
  {
    enabled: false,
    enabledForWindow: function(wnd)
    {
      try
      {
        return wnd.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsILoadContext).usePrivateBrowsing;
      }
      catch (e)
      {
        if (e.result != Cr.NS_NOINTERFACE)
        {
          Cu.reportError(e);
        }
        return false;
      }
    },
    init: function()
    {
      if ("@mozilla.org/privatebrowsing;1" in Cc)
      {
        try
        {
          this.enabled = Cc["@mozilla.org/privatebrowsing;1"].getService(Ci.nsIPrivateBrowsingService).privateBrowsingEnabled;
          Services.obs.addObserver(this, "private-browsing", true);
          onShutdown.add(function()
          {
            Services.obs.removeObserver(this, "private-browsing");
          }.bind(this));
        }
        catch (e)
        {
          Cu.reportError(e);
        }
      }
    },
    observe: function(subject, topic, data)
    {
      if (topic == "private-browsing")
      {
        if (data == "enter")
        {
          this.enabled = true;
        }
        else if (data == "exit")
        {
          this.enabled = false;
        }
      }
    },
    QueryInterface: XPCOMUtils.generateQI([Ci.nsISupportsWeakReference, Ci.nsIObserver])
  };
  PrivateBrowsing.init();

  function INIParser()
  {
    this.fileProperties = this.curObj = {};
    this.subscriptions = [];
    this.knownFilters =
    {
      __proto__: null
    };
    this.knownSubscriptions =
    {
      __proto__: null
    };
  }
  INIParser.prototype =
  {
    subscriptions: null,
    knownFilters: null,
    knownSubscrptions: null,
    wantObj: true,
    fileProperties: null,
    curObj: null,
    curSection: null,
    userFilters: null,
    process: function(val)
    {
      var origKnownFilters = Filter.knownFilters;
      Filter.knownFilters = this.knownFilters;
      var origKnownSubscriptions = Subscription.knownSubscriptions;
      Subscription.knownSubscriptions = this.knownSubscriptions;
      var match;
      try
      {
        if (this.wantObj === true && (match = /^(\w+)=(.*)$/.exec(val)))
        {
          this.curObj[match[1]] = match[2];
        }
        else if (val === null || (match = /^\s*\[(.+)\]\s*$/.exec(val)))
        {
          if (this.curObj)
          {
            switch (this.curSection)
            {
            case "filter":
            case "pattern":
              if ("text" in this.curObj)
              {
                Filter.fromObject(this.curObj);
              }
              break;
            case "subscription":
              var subscription = Subscription.fromObject(this.curObj);
              if (subscription)
              {
                this.subscriptions.push(subscription);
              }
              break;
            case "subscription filters":
            case "subscription patterns":
              if (this.subscriptions.length)
              {
                var subscription = this.subscriptions[this.subscriptions.length - 1];
                for (var _loopIndex21 = 0; _loopIndex21 < this.curObj.length; ++_loopIndex21)
                {
                  var text = this.curObj[_loopIndex21];
                  var filter = Filter.fromText(text);
                  subscription.filters.push(filter);
                  filter.subscriptions.push(subscription);
                }
              }
              break;
            case "user patterns":
              this.userFilters = this.curObj;
              break;
            }
          }
          if (val === null)
          {
            return;
          }
          this.curSection = match[1].toLowerCase();
          switch (this.curSection)
          {
          case "filter":
          case "pattern":
          case "subscription":
            this.wantObj = true;
            this.curObj = {};
            break;
          case "subscription filters":
          case "subscription patterns":
          case "user patterns":
            this.wantObj = false;
            this.curObj = [];
            break;
          default:
            this.wantObj = undefined;
            this.curObj = null;
          }
        }
        else if (this.wantObj === false && val)
        {
          this.curObj.push(val.replace(/\\\[/g, "["));
        }
      }
      finally
      {
        Filter.knownFilters = origKnownFilters;
        Subscription.knownSubscriptions = origKnownSubscriptions;
      }
    }
  };
  return exports;
})();
require.scopes["elemHide"] = (function()
{
  var exports = {};
  var Utils = require("utils").Utils;
  var IO = require("io").IO;
  var Prefs = require("prefs").Prefs;
  var ElemHideException = require("filterClasses").ElemHideException;
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var AboutHandler = require("elemHideHitRegistration").AboutHandler;
  var filterByKey =
  {
    __proto__: null
  };
  var keyByFilter =
  {
    __proto__: null
  };
  var knownExceptions =
  {
    __proto__: null
  };
  var exceptions =
  {
    __proto__: null
  };
  var styleURL = null;
  var ElemHide = exports.ElemHide =
  {
    isDirty: false,
    applied: false,
    init: function()
    {
      Prefs.addListener(function(name)
      {
        if (name == "enabled")
        {
          ElemHide.apply();
        }
      });
      onShutdown.add(function()
      {
        ElemHide.unapply();
      });
      var styleFile = IO.resolveFilePath(Prefs.data_directory);
      styleFile.append("elemhide.css");
      styleURL = Services.io.newFileURI(styleFile).QueryInterface(Ci.nsIFileURL);
    },
    clear: function()
    {
      filterByKey =
      {
        __proto__: null
      };
      keyByFilter =
      {
        __proto__: null
      };
      knownExceptions =
      {
        __proto__: null
      };
      exceptions =
      {
        __proto__: null
      };
      ElemHide.isDirty = false;
      ElemHide.unapply();
    },
    add: function(filter)
    {
      if (filter instanceof ElemHideException)
      {
        if (filter.text in knownExceptions)
        {
          return;
        }
        var selector = filter.selector;
        if (!(selector in exceptions))
        {
          exceptions[selector] = [];
        }
        exceptions[selector].push(filter);
        knownExceptions[filter.text] = true;
      }
      else
      {
        if (filter.text in keyByFilter)
        {
          return;
        }
        var key;
        do
        {
          key = Math.random().toFixed(15).substr(5);
        }
        while (key in filterByKey);
        filterByKey[key] = filter;
        keyByFilter[filter.text] = key;
        ElemHide.isDirty = true;
      }
    },
    remove: function(filter)
    {
      if (filter instanceof ElemHideException)
      {
        if (!(filter.text in knownExceptions))
        {
          return;
        }
        var list = exceptions[filter.selector];
        var index = list.indexOf(filter);
        if (index >= 0)
        {
          list.splice(index, 1);
        }
        delete knownExceptions[filter.text];
      }
      else
      {
        if (!(filter.text in keyByFilter))
        {
          return;
        }
        var key = keyByFilter[filter.text];
        delete filterByKey[key];
        delete keyByFilter[filter.text];
        ElemHide.isDirty = true;
      }
    },
    getException: function(filter, docDomain)
    {
      var selector = filter.selector;
      if (!(filter.selector in exceptions))
      {
        return null;
      }
      var list = exceptions[filter.selector];
      for (var i = list.length - 1; i >= 0; i--)
      {
        if (list[i].isActiveOnDomain(docDomain))
        {
          return list[i];
        }
      }
      return null;
    },
    _applying: false,
    _needsApply: false,
    apply: function()
    {
      if (this._applying)
      {
        this._needsApply = true;
        return;
      }
      if (!ElemHide.isDirty || !Prefs.enabled)
      {
        if (Prefs.enabled && !ElemHide.applied)
        {
          try
          {
            Utils.styleService.loadAndRegisterSheet(styleURL, Ci.nsIStyleSheetService.USER_SHEET);
            ElemHide.applied = true;
          }
          catch (e)
          {
            Cu.reportError(e);
          }
        }
        else if (!Prefs.enabled && ElemHide.applied)
        {
          ElemHide.unapply();
        }
        return;
      }
      IO.writeToFile(styleURL.file, false, this._generateCSSContent(), function(e)
      {
        this._applying = false;
        if (e && e.result == Cr.NS_ERROR_NOT_AVAILABLE)
        {
          IO.removeFile(styleURL.file, function(e2){});
        }
        else if (e)
        {
          Cu.reportError(e);
        }
        if (this._needsApply)
        {
          this._needsApply = false;
          this.apply();
        }
        else if (!e || e.result == Cr.NS_ERROR_NOT_AVAILABLE)
        {
          ElemHide.isDirty = false;
          ElemHide.unapply();
          if (!e)
          {
            try
            {
              Utils.styleService.loadAndRegisterSheet(styleURL, Ci.nsIStyleSheetService.USER_SHEET);
              ElemHide.applied = true;
            }
            catch (e)
            {
              Cu.reportError(e);
            }
          }
          FilterNotifier.triggerListeners("elemhideupdate");
        }
      }.bind(this), "ElemHideWrite");
      this._applying = true;
    },
    _generateCSSContent: function()
    {
      var _generatorResult16 = [];
      var domains =
      {
        __proto__: null
      };
      var hasFilters = false;
      for (var key in filterByKey)
      {
        var filter = filterByKey[key];
        var domain = filter.selectorDomain || "";
        var list;
        if (domain in domains)
        {
          list = domains[domain];
        }
        else
        {
          list =
          {
            __proto__: null
          };
          domains[domain] = list;
        }
        list[filter.selector] = key;
        hasFilters = true;
      }
      if (!hasFilters)
      {
        throw Cr.NS_ERROR_NOT_AVAILABLE;
      }

      function escapeChar(match)
      {
        return "\\" + match.charCodeAt(0).toString(16) + " ";
      }
      var cssTemplate = "-moz-binding: url(about:" + AboutHandler.aboutPrefix + "?%ID%#dummy) !important;";
      for (var domain in domains)
      {
        var rules = [];
        var list = domains[domain];
        if (domain)
        {
          _generatorResult16.push(("@-moz-document domain(\"" + domain.split(",").join("\"),domain(\"") + "\"){").replace(/[^\x01-\x7F]/g, escapeChar));
        }
        else
        {
          _generatorResult16.push("@-moz-document url-prefix(\"http://\"),url-prefix(\"https://\")," + "url-prefix(\"mailbox://\"),url-prefix(\"imap://\")," + "url-prefix(\"news://\"),url-prefix(\"snews://\"){");
        }
        for (var selector in list)
        {
          _generatorResult16.push(selector.replace(/[^\x01-\x7F]/g, escapeChar) + "{" + cssTemplate.replace("%ID%", list[selector]) + "}");
        }
        _generatorResult16.push("}");
      }
      return _generatorResult16;
    },
    unapply: function()
    {
      if (ElemHide.applied)
      {
        try
        {
          Utils.styleService.unregisterSheet(styleURL, Ci.nsIStyleSheetService.USER_SHEET);
        }
        catch (e)
        {
          Cu.reportError(e);
        }
        ElemHide.applied = false;
      }
    },
    get styleURL()
    {
      return ElemHide.applied ? styleURL.spec : null;
    },
    getFilterByKey: function(key)
    {
      return key in filterByKey ? filterByKey[key] : null;
    },
    getSelectorsForDomain: function(domain, specificOnly)
    {
      var result = [];
      for (var key in filterByKey)
      {
        var filter = filterByKey[key];
        if (specificOnly && (!filter.domains || filter.domains[""]))
        {
          continue;
        }
        if (filter.isActiveOnDomain(domain) && !this.getException(filter, domain))
        {
          result.push(filter.selector);
        }
      }
      return result;
    }
  };
  return exports;
})();
require.scopes["matcher"] = (function()
{
  var exports = {};
  var _tempVar22 = require("filterClasses");
  var Filter = _tempVar22.Filter;
  var RegExpFilter = _tempVar22.RegExpFilter;
  var WhitelistFilter = _tempVar22.WhitelistFilter;

  function Matcher()
  {
    this.clear();
  }
  exports.Matcher = Matcher;
  Matcher.prototype =
  {
    filterByKeyword: null,
    keywordByFilter: null,
    clear: function()
    {
      this.filterByKeyword =
      {
        __proto__: null
      };
      this.keywordByFilter =
      {
        __proto__: null
      };
    },
    add: function(filter)
    {
      if (filter.text in this.keywordByFilter)
      {
        return;
      }
      var keyword = this.findKeyword(filter);
      var oldEntry = this.filterByKeyword[keyword];
      if (typeof oldEntry == "undefined")
      {
        this.filterByKeyword[keyword] = filter;
      }
      else if (oldEntry.length == 1)
      {
        this.filterByKeyword[keyword] = [oldEntry, filter];
      }
      else
      {
        oldEntry.push(filter);
      }
      this.keywordByFilter[filter.text] = keyword;
    },
    remove: function(filter)
    {
      if (!(filter.text in this.keywordByFilter))
      {
        return;
      }
      var keyword = this.keywordByFilter[filter.text];
      var list = this.filterByKeyword[keyword];
      if (list.length <= 1)
      {
        delete this.filterByKeyword[keyword];
      }
      else
      {
        var index = list.indexOf(filter);
        if (index >= 0)
        {
          list.splice(index, 1);
          if (list.length == 1)
          {
            this.filterByKeyword[keyword] = list[0];
          }
        }
      }
      delete this.keywordByFilter[filter.text];
    },
    findKeyword: function(filter)
    {
      var result = "";
      var text = filter.text;
      if (Filter.regexpRegExp.test(text))
      {
        return result;
      }
      var match = Filter.optionsRegExp.exec(text);
      if (match)
      {
        text = match.input.substr(0, match.index);
      }
      if (text.substr(0, 2) == "@@")
      {
        text = text.substr(2);
      }
      var candidates = text.toLowerCase().match(/[^a-z0-9%*][a-z0-9%]{3,}(?=[^a-z0-9%*])/g);
      if (!candidates)
      {
        return result;
      }
      var hash = this.filterByKeyword;
      var resultCount = 16777215;
      var resultLength = 0;
      for (var i = 0, l = candidates.length; i < l; i++)
      {
        var candidate = candidates[i].substr(1);
        var count = candidate in hash ? hash[candidate].length : 0;
        if (count < resultCount || count == resultCount && candidate.length > resultLength)
        {
          result = candidate;
          resultCount = count;
          resultLength = candidate.length;
        }
      }
      return result;
    },
    hasFilter: function(filter)
    {
      return filter.text in this.keywordByFilter;
    },
    getKeywordForFilter: function(filter)
    {
      if (filter.text in this.keywordByFilter)
      {
        return this.keywordByFilter[filter.text];
      }
      else
      {
        return null;
      }
    },
    _checkEntryMatch: function(keyword, location, contentType, docDomain, thirdParty)
    {
      var list = this.filterByKeyword[keyword];
      for (var i = 0; i < list.length; i++)
      {
        var filter = list[i];
        if (filter.matches(location, contentType, docDomain, thirdParty))
        {
          return filter;
        }
      }
      return null;
    },
    matchesAny: function(location, contentType, docDomain, thirdParty)
    {
      var candidates = location.toLowerCase().match(/[a-z0-9%]{3,}/g);
      if (candidates === null)
      {
        candidates = [];
      }
      candidates.push("");
      for (var i = 0, l = candidates.length; i < l; i++)
      {
        var substr = candidates[i];
        if (substr in this.filterByKeyword)
        {
          var result = this._checkEntryMatch(substr, location, contentType, docDomain, thirdParty);
          if (result)
          {
            return result;
          }
        }
      }
      return null;
    }
  };

  function CombinedMatcher()
  {
    this.blacklist = new Matcher();
    this.whitelist = new Matcher();
    this.keys =
    {
      __proto__: null
    };
    this.resultCache =
    {
      __proto__: null
    };
  }
  exports.CombinedMatcher = CombinedMatcher;
  CombinedMatcher.maxCacheEntries = 1000;
  CombinedMatcher.prototype =
  {
    blacklist: null,
    whitelist: null,
    keys: null,
    resultCache: null,
    cacheEntries: 0,
    clear: function()
    {
      this.blacklist.clear();
      this.whitelist.clear();
      this.keys =
      {
        __proto__: null
      };
      this.resultCache =
      {
        __proto__: null
      };
      this.cacheEntries = 0;
    },
    add: function(filter)
    {
      if (filter instanceof WhitelistFilter)
      {
        if (filter.siteKeys)
        {
          for (var i = 0; i < filter.siteKeys.length; i++)
          {
            this.keys[filter.siteKeys[i]] = filter.text;
          }
        }
        else
        {
          this.whitelist.add(filter);
        }
      }
      else
      {
        this.blacklist.add(filter);
      }
      if (this.cacheEntries > 0)
      {
        this.resultCache =
        {
          __proto__: null
        };
        this.cacheEntries = 0;
      }
    },
    remove: function(filter)
    {
      if (filter instanceof WhitelistFilter)
      {
        if (filter.siteKeys)
        {
          for (var i = 0; i < filter.siteKeys.length; i++)
          {
            delete this.keys[filter.siteKeys[i]];
          }
        }
        else
        {
          this.whitelist.remove(filter);
        }
      }
      else
      {
        this.blacklist.remove(filter);
      }
      if (this.cacheEntries > 0)
      {
        this.resultCache =
        {
          __proto__: null
        };
        this.cacheEntries = 0;
      }
    },
    findKeyword: function(filter)
    {
      if (filter instanceof WhitelistFilter)
      {
        return this.whitelist.findKeyword(filter);
      }
      else
      {
        return this.blacklist.findKeyword(filter);
      }
    },
    hasFilter: function(filter)
    {
      if (filter instanceof WhitelistFilter)
      {
        return this.whitelist.hasFilter(filter);
      }
      else
      {
        return this.blacklist.hasFilter(filter);
      }
    },
    getKeywordForFilter: function(filter)
    {
      if (filter instanceof WhitelistFilter)
      {
        return this.whitelist.getKeywordForFilter(filter);
      }
      else
      {
        return this.blacklist.getKeywordForFilter(filter);
      }
    },
    isSlowFilter: function(filter)
    {
      var matcher = filter instanceof WhitelistFilter ? this.whitelist : this.blacklist;
      if (matcher.hasFilter(filter))
      {
        return !matcher.getKeywordForFilter(filter);
      }
      else
      {
        return !matcher.findKeyword(filter);
      }
    },
    matchesAnyInternal: function(location, contentType, docDomain, thirdParty)
    {
      var candidates = location.toLowerCase().match(/[a-z0-9%]{3,}/g);
      if (candidates === null)
      {
        candidates = [];
      }
      candidates.push("");
      var blacklistHit = null;
      for (var i = 0, l = candidates.length; i < l; i++)
      {
        var substr = candidates[i];
        if (substr in this.whitelist.filterByKeyword)
        {
          var result = this.whitelist._checkEntryMatch(substr, location, contentType, docDomain, thirdParty);
          if (result)
          {
            return result;
          }
        }
        if (substr in this.blacklist.filterByKeyword && blacklistHit === null)
        {
          blacklistHit = this.blacklist._checkEntryMatch(substr, location, contentType, docDomain, thirdParty);
        }
      }
      return blacklistHit;
    },
    matchesAny: function(location, contentType, docDomain, thirdParty)
    {
      var key = location + " " + contentType + " " + docDomain + " " + thirdParty;
      if (key in this.resultCache)
      {
        return this.resultCache[key];
      }
      var result = this.matchesAnyInternal(location, contentType, docDomain, thirdParty);
      if (this.cacheEntries >= CombinedMatcher.maxCacheEntries)
      {
        this.resultCache =
        {
          __proto__: null
        };
        this.cacheEntries = 0;
      }
      this.resultCache[key] = result;
      this.cacheEntries++;
      return result;
    },
    matchesByKey: function(location, key, docDomain)
    {
      key = key.toUpperCase();
      if (key in this.keys)
      {
        var filter = Filter.knownFilters[this.keys[key]];
        if (filter && filter.matches(location, "DOCUMENT", docDomain, false))
        {
          return filter;
        }
        else
        {
          return null;
        }
      }
      else
      {
        return null;
      }
    }
  };
  var defaultMatcher = exports.defaultMatcher = new CombinedMatcher();
  return exports;
})();
require.scopes["filterListener"] = (function()
{
  var exports = {};
  var FilterStorage = require("filterStorage").FilterStorage;
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var ElemHide = require("elemHide").ElemHide;
  var defaultMatcher = require("matcher").defaultMatcher;
  var _tempVar23 = require("filterClasses");
  var ActiveFilter = _tempVar23.ActiveFilter;
  var RegExpFilter = _tempVar23.RegExpFilter;
  var ElemHideBase = _tempVar23.ElemHideBase;
  var Prefs = require("prefs").Prefs;
  var batchMode = false;
  var isDirty = 0;
  var FilterListener = exports.FilterListener =
  {
    get batchMode()
    {
      return batchMode;
    },
    set batchMode(value)
    {
      batchMode = value;
      flushElemHide();
    },
    setDirty: function(factor)
    {
      if (factor == 0 && isDirty > 0)
      {
        isDirty = 1;
      }
      else
      {
        isDirty += factor;
      }
      if (isDirty >= 1)
      {
        FilterStorage.saveToDisk();
      }
    }
  };
  var HistoryPurgeObserver =
  {
    observe: function(subject, topic, data)
    {
      if (topic == "browser:purge-session-history" && Prefs.clearStatsOnHistoryPurge)
      {
        FilterStorage.resetHitCounts();
        FilterListener.setDirty(0);
        Prefs.recentReports = [];
      }
    },
    QueryInterface: XPCOMUtils.generateQI([Ci.nsISupportsWeakReference, Ci.nsIObserver])
  };

  function init()
  {
    FilterNotifier.addListener(function(action, item, newValue, oldValue)
    {
      var match = /^(\w+)\.(.*)/.exec(action);
      if (match && match[1] == "filter")
      {
        onFilterChange(match[2], item, newValue, oldValue);
      }
      else if (match && match[1] == "subscription")
      {
        onSubscriptionChange(match[2], item, newValue, oldValue);
      }
      else
      {
        onGenericChange(action, item);
      }
    });
    if ("nsIStyleSheetService" in Ci)
    {
      ElemHide.init();
    }
    else
    {
      flushElemHide = function(){};
    }
    FilterStorage.loadFromDisk();
    Services.obs.addObserver(HistoryPurgeObserver, "browser:purge-session-history", true);
    onShutdown.add(function()
    {
      Services.obs.removeObserver(HistoryPurgeObserver, "browser:purge-session-history");
    });
  }
  init();

  function flushElemHide()
  {
    if (!batchMode && ElemHide.isDirty)
    {
      ElemHide.apply();
    }
  }

  function addFilter(filter)
  {
    if (!(filter instanceof ActiveFilter) || filter.disabled)
    {
      return;
    }
    var hasEnabled = false;
    for (var i = 0; i < filter.subscriptions.length; i++)
    {
      if (!filter.subscriptions[i].disabled)
      {
        hasEnabled = true;
      }
    }
    if (!hasEnabled)
    {
      return;
    }
    if (filter instanceof RegExpFilter)
    {
      defaultMatcher.add(filter);
    }
    else if (filter instanceof ElemHideBase)
    {
      ElemHide.add(filter);
    }
  }

  function removeFilter(filter)
  {
    if (!(filter instanceof ActiveFilter))
    {
      return;
    }
    if (!filter.disabled)
    {
      var hasEnabled = false;
      for (var i = 0; i < filter.subscriptions.length; i++)
      {
        if (!filter.subscriptions[i].disabled)
        {
          hasEnabled = true;
        }
      }
      if (hasEnabled)
      {
        return;
      }
    }
    if (filter instanceof RegExpFilter)
    {
      defaultMatcher.remove(filter);
    }
    else if (filter instanceof ElemHideBase)
    {
      ElemHide.remove(filter);
    }
  }

  function onSubscriptionChange(action, subscription, newValue, oldValue)
  {
    FilterListener.setDirty(1);
    if (action != "added" && action != "removed" && action != "disabled" && action != "updated")
    {
      return;
    }
    if (action != "removed" && !(subscription.url in FilterStorage.knownSubscriptions))
    {
      return;
    }
    if ((action == "added" || action == "removed" || action == "updated") && subscription.disabled)
    {
      return;
    }
    if (action == "added" || action == "removed" || action == "disabled")
    {
      var method = action == "added" || action == "disabled" && newValue == false ? addFilter : removeFilter;
      if (subscription.filters)
      {
        subscription.filters.forEach(method);
      }
    }
    else if (action == "updated")
    {
      subscription.oldFilters.forEach(removeFilter);
      subscription.filters.forEach(addFilter);
    }
    flushElemHide();
  }

  function onFilterChange(action, filter, newValue, oldValue)
  {
    if (action == "hitCount" || action == "lastHit")
    {
      FilterListener.setDirty(0.002);
    }
    else
    {
      FilterListener.setDirty(1);
    }
    if (action != "added" && action != "removed" && action != "disabled")
    {
      return;
    }
    if ((action == "added" || action == "removed") && filter.disabled)
    {
      return;
    }
    if (action == "added" || action == "disabled" && newValue == false)
    {
      addFilter(filter);
    }
    else
    {
      removeFilter(filter);
    }
    flushElemHide();
  }

  function onGenericChange(action)
  {
    if (action == "load")
    {
      isDirty = 0;
      defaultMatcher.clear();
      ElemHide.clear();
      for (var _loopIndex24 = 0; _loopIndex24 < FilterStorage.subscriptions.length; ++_loopIndex24)
      {
        var subscription = FilterStorage.subscriptions[_loopIndex24];
        if (!subscription.disabled)
        {
          subscription.filters.forEach(addFilter);
        }
      }
      flushElemHide();
    }
    else if (action == "save")
    {
      isDirty = 0;
    }
  }
  return exports;
})();
require.scopes["synchronizer"] = (function()
{
  var exports = {};
  var _tempVar25 = require("downloader");
  var Downloader = _tempVar25.Downloader;
  var Downloadable = _tempVar25.Downloadable;
  var MILLIS_IN_SECOND = _tempVar25.MILLIS_IN_SECOND;
  var MILLIS_IN_MINUTE = _tempVar25.MILLIS_IN_MINUTE;
  var MILLIS_IN_HOUR = _tempVar25.MILLIS_IN_HOUR;
  var MILLIS_IN_DAY = _tempVar25.MILLIS_IN_DAY;
  var _tempVar26 = require("filterClasses");
  var Filter = _tempVar26.Filter;
  var CommentFilter = _tempVar26.CommentFilter;
  var FilterStorage = require("filterStorage").FilterStorage;
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var Prefs = require("prefs").Prefs;
  var _tempVar27 = require("subscriptionClasses");
  var Subscription = _tempVar27.Subscription;
  var DownloadableSubscription = _tempVar27.DownloadableSubscription;
  var Utils = require("utils").Utils;
  var INITIAL_DELAY = 6 * MILLIS_IN_MINUTE;
  var CHECK_INTERVAL = 1 * MILLIS_IN_HOUR;
  var DEFAULT_EXPIRATION_INTERVAL = 5 * MILLIS_IN_DAY;
  var downloader = null;
  var Synchronizer = exports.Synchronizer =
  {
    init: function()
    {
      downloader = new Downloader(this._getDownloadables.bind(this), INITIAL_DELAY, CHECK_INTERVAL);
      onShutdown.add(function()
      {
        downloader.cancel();
      });
      downloader.onExpirationChange = this._onExpirationChange.bind(this);
      downloader.onDownloadStarted = this._onDownloadStarted.bind(this);
      downloader.onDownloadSuccess = this._onDownloadSuccess.bind(this);
      downloader.onDownloadError = this._onDownloadError.bind(this);
    },
    isExecuting: function(url)
    {
      return downloader.isDownloading(url);
    },
    execute: function(subscription, manual)
    {
      downloader.download(this._getDownloadable(subscription, manual));
    },
    _getDownloadables: function()
    {
      var _generatorResult16 = [];
      if (!Prefs.subscriptions_autoupdate)
      {
        return;
      }
      for (var _loopIndex28 = 0; _loopIndex28 < FilterStorage.subscriptions.length; ++_loopIndex28)
      {
        var subscription = FilterStorage.subscriptions[_loopIndex28];
        if (subscription instanceof DownloadableSubscription)
        {
          _generatorResult16.push(this._getDownloadable(subscription, false));
        }
      }
      return _generatorResult16;
    },
    _getDownloadable: function(subscription, manual)
    {
      var result = new Downloadable(subscription.url);
      if (subscription.lastDownload != subscription.lastSuccess)
      {
        result.lastError = subscription.lastDownload * MILLIS_IN_SECOND;
      }
      result.lastCheck = subscription.lastCheck * MILLIS_IN_SECOND;
      result.lastVersion = subscription.version;
      result.softExpiration = subscription.softExpiration * MILLIS_IN_SECOND;
      result.hardExpiration = subscription.expires * MILLIS_IN_SECOND;
      result.manual = manual;
      return result;
    },
    _onExpirationChange: function(downloadable)
    {
      var subscription = Subscription.fromURL(downloadable.url);
      subscription.lastCheck = Math.round(downloadable.lastCheck / MILLIS_IN_SECOND);
      subscription.softExpiration = Math.round(downloadable.softExpiration / MILLIS_IN_SECOND);
      subscription.expires = Math.round(downloadable.hardExpiration / MILLIS_IN_SECOND);
    },
    _onDownloadStarted: function(downloadable)
    {
      var subscription = Subscription.fromURL(downloadable.url);
      FilterNotifier.triggerListeners("subscription.downloadStatus", subscription);
    },
    _onDownloadSuccess: function(downloadable, responseText, errorCallback, redirectCallback)
    {
      var lines = responseText.split(/[\r\n]+/);
      var match = /\[Adblock(?:\s*Plus\s*([\d\.]+)?)?\]/i.exec(lines[0]);
      if (!match)
      {
        return errorCallback("synchronize_invalid_data");
      }
      var minVersion = match[1];
      var remove = [];
      var params =
      {
        redirect: null,
        homepage: null,
        title: null,
        version: null,
        expires: null
      };
      for (var i = 0; i < lines.length; i++)
      {
        var match = /^\s*!\s*(\w+)\s*:\s*(.*)/.exec(lines[i]);
        if (match)
        {
          var keyword = match[1].toLowerCase();
          var value = match[2];
          if (keyword in params)
          {
            params[keyword] = value;
            remove.push(i);
          }
          else if (keyword == "checksum")
          {
            lines.splice(i--, 1);
            var checksum = Utils.generateChecksum(lines);
            if (checksum && checksum != value.replace(/=+$/, ""))
            {
              return errorCallback("synchronize_checksum_mismatch");
            }
          }
        }
      }
      if (params.redirect)
      {
        return redirectCallback(params.redirect);
      }
      var subscription = Subscription.fromURL(downloadable.redirectURL || downloadable.url);
      if (downloadable.redirectURL && downloadable.redirectURL != downloadable.url)
      {
        var oldSubscription = Subscription.fromURL(downloadable.url);
        subscription.title = oldSubscription.title;
        subscription.disabled = oldSubscription.disabled;
        subscription.lastCheck = oldSubscription.lastCheck;
        var listed = oldSubscription.url in FilterStorage.knownSubscriptions;
        if (listed)
        {
          FilterStorage.removeSubscription(oldSubscription);
        }
        delete Subscription.knownSubscriptions[oldSubscription.url];
        if (listed)
        {
          FilterStorage.addSubscription(subscription);
        }
      }
      subscription.lastSuccess = subscription.lastDownload = Math.round(Date.now() / MILLIS_IN_SECOND);
      subscription.downloadStatus = "synchronize_ok";
      subscription.errors = 0;
      for (var i = remove.length - 1; i >= 0; i--)
      {
        lines.splice(remove[i], 1);
      }
      if (params.homepage)
      {
        var uri = Utils.makeURI(params.homepage);
        if (uri && (uri.scheme == "http" || uri.scheme == "https"))
        {
          subscription.homepage = uri.spec;
        }
      }
      if (params.title)
      {
        subscription.title = params.title;
        subscription.fixedTitle = true;
      }
      else
      {
        subscription.fixedTitle = false;
      }
      subscription.version = params.version ? parseInt(params.version, 10) : 0;
      var expirationInterval = DEFAULT_EXPIRATION_INTERVAL;
      if (params.expires)
      {
        var match = /^(\d+)\s*(h)?/.exec(params.expires);
        if (match)
        {
          var interval = parseInt(match[1], 10);
          if (match[2])
          {
            expirationInterval = interval * MILLIS_IN_HOUR;
          }
          else
          {
            expirationInterval = interval * MILLIS_IN_DAY;
          }
        }
      }
      var _tempVar29 = downloader.processExpirationInterval(expirationInterval);
      var softExpiration = _tempVar29[0];
      var hardExpiration = _tempVar29[1];
      subscription.softExpiration = Math.round(softExpiration / MILLIS_IN_SECOND);
      subscription.expires = Math.round(hardExpiration / MILLIS_IN_SECOND);
      delete subscription.requiredVersion;
      delete subscription.upgradeRequired;
      if (minVersion)
      {
        var addonVersion = require("info").addonVersion;
        subscription.requiredVersion = minVersion;
        if (Services.vc.compare(minVersion, addonVersion) > 0)
        {
          subscription.upgradeRequired = true;
        }
      }
      lines.shift();
      var filters = [];
      for (var _loopIndex30 = 0; _loopIndex30 < lines.length; ++_loopIndex30)
      {
        var line = lines[_loopIndex30];
        line = Filter.normalize(line);
        if (line)
        {
          filters.push(Filter.fromText(line));
        }
      }
      FilterStorage.updateSubscriptionFilters(subscription, filters);
      return undefined;
    },
    _onDownloadError: function(downloadable, downloadURL, error, channelStatus, responseStatus, redirectCallback)
    {
      var subscription = Subscription.fromURL(downloadable.url);
      subscription.lastDownload = Math.round(Date.now() / MILLIS_IN_SECOND);
      subscription.downloadStatus = error;
      if (!downloadable.manual)
      {
        subscription.errors++;
        if (redirectCallback && subscription.errors >= Prefs.subscriptions_fallbackerrors && /^https?:\/\//i.test(subscription.url))
        {
          subscription.errors = 0;
          var fallbackURL = Prefs.subscriptions_fallbackurl;
          var addonVersion = require("info").addonVersion;
          fallbackURL = fallbackURL.replace(/%VERSION%/g, encodeURIComponent(addonVersion));
          fallbackURL = fallbackURL.replace(/%SUBSCRIPTION%/g, encodeURIComponent(subscription.url));
          fallbackURL = fallbackURL.replace(/%URL%/g, encodeURIComponent(downloadURL));
          fallbackURL = fallbackURL.replace(/%ERROR%/g, encodeURIComponent(error));
          fallbackURL = fallbackURL.replace(/%CHANNELSTATUS%/g, encodeURIComponent(channelStatus));
          fallbackURL = fallbackURL.replace(/%RESPONSESTATUS%/g, encodeURIComponent(responseStatus));
          var request = new XMLHttpRequest();
          request.mozBackgroundRequest = true;
          request.open("GET", fallbackURL);
          request.overrideMimeType("text/plain");
          request.channel.loadFlags = request.channel.loadFlags | request.channel.INHIBIT_CACHING | request.channel.VALIDATE_ALWAYS;
          request.addEventListener("load", function(ev)
          {
            if (onShutdown.done)
            {
              return;
            }
            if (!(subscription.url in FilterStorage.knownSubscriptions))
            {
              return;
            }
            var match = /^(\d+)(?:\s+(\S+))?$/.exec(request.responseText);
            if (match && match[1] == "301" && match[2] && /^https?:\/\//i.test(match[2]))
            {
              redirectCallback(match[2]);
            }
            else if (match && match[1] == "410")
            {
              var data = "[Adblock]\n" + subscription.filters.map(function(f)
              {
                return f.text;
              }).join("\n");
              redirectCallback("data:text/plain," + encodeURIComponent(data));
            }
          }, false);
          request.send(null);
        }
      }
    }
  };
  Synchronizer.init();
  return exports;
})();
require.scopes["notification"] = (function()
{
  var exports = {};
  var Prefs = require("prefs").Prefs;
  var _tempVar31 = require("downloader");
  var Downloader = _tempVar31.Downloader;
  var Downloadable = _tempVar31.Downloadable;
  var MILLIS_IN_MINUTE = _tempVar31.MILLIS_IN_MINUTE;
  var MILLIS_IN_HOUR = _tempVar31.MILLIS_IN_HOUR;
  var MILLIS_IN_DAY = _tempVar31.MILLIS_IN_DAY;
  var Utils = require("utils").Utils;
  var INITIAL_DELAY = 12 * MILLIS_IN_MINUTE;
  var CHECK_INTERVAL = 1 * MILLIS_IN_HOUR;
  var EXPIRATION_INTERVAL = 1 * MILLIS_IN_DAY;

  function getNumericalSeverity(notification)
  {
    var levels =
    {
      information: 0,
      critical: 1
    };
    return notification.severity in levels ? levels[notification.severity] : levels.information;
  }

  function saveNotificationData()
  {
    Prefs.notificationdata = JSON.parse(JSON.stringify(Prefs.notificationdata));
  }

  function localize(translations, locale)
  {
    if (locale in translations)
    {
      return translations[locale];
    }
    var languagePart = locale.substring(0, locale.indexOf("-"));
    if (languagePart && languagePart in translations)
    {
      return translations[languagePart];
    }
    var defaultLocale = "en-US";
    return translations[defaultLocale];
  }
  var downloader = null;
  var Notification = exports.Notification =
  {
    init: function()
    {
      downloader = new Downloader(this._getDownloadables.bind(this), INITIAL_DELAY, CHECK_INTERVAL);
      onShutdown.add(function()
      {
        downloader.cancel();
      });
      downloader.onExpirationChange = this._onExpirationChange.bind(this);
      downloader.onDownloadSuccess = this._onDownloadSuccess.bind(this);
      downloader.onDownloadError = this._onDownloadError.bind(this);
    },
    _getDownloadables: function()
    {
      var _generatorResult16 = [];
      var downloadable = new Downloadable(Prefs.notificationurl);
      if (typeof Prefs.notificationdata.lastError === "number")
      {
        downloadable.lastError = Prefs.notificationdata.lastError;
      }
      if (typeof Prefs.notificationdata.lastCheck === "number")
      {
        downloadable.lastCheck = Prefs.notificationdata.lastCheck;
      }
      if (typeof Prefs.notificationdata.data === "object" && "version" in Prefs.notificationdata.data)
      {
        downloadable.lastVersion = Prefs.notificationdata.data.version;
      }
      if (typeof Prefs.notificationdata.softExpiration === "number")
      {
        downloadable.softExpiration = Prefs.notificationdata.softExpiration;
      }
      if (typeof Prefs.notificationdata.hardExpiration === "number")
      {
        downloadable.hardExpiration = Prefs.notificationdata.hardExpiration;
      }
      _generatorResult16.push(downloadable);
      return _generatorResult16;
    },
    _onExpirationChange: function(downloadable)
    {
      Prefs.notificationdata.lastCheck = downloadable.lastCheck;
      Prefs.notificationdata.softExpiration = downloadable.softExpiration;
      Prefs.notificationdata.hardExpiration = downloadable.hardExpiration;
      saveNotificationData();
    },
    _onDownloadSuccess: function(downloadable, responseText, errorCallback, redirectCallback)
    {
      try
      {
        Prefs.notificationdata.data = JSON.parse(responseText);
      }
      catch (e)
      {
        Cu.reportError(e);
        errorCallback("synchronize_invalid_data");
        return;
      }
      Prefs.notificationdata.lastError = 0;
      Prefs.notificationdata.downloadStatus = "synchronize_ok";
      var _tempVar32 = downloader.processExpirationInterval(EXPIRATION_INTERVAL);
      Prefs.notificationdata.softExpiration = _tempVar32[0];
      Prefs.notificationdata.hardExpiration = _tempVar32[1];
      saveNotificationData();
    },
    _onDownloadError: function(downloadable, downloadURL, error, channelStatus, responseStatus, redirectCallback)
    {
      Prefs.notificationdata.lastError = Date.now();
      Prefs.notificationdata.downloadStatus = error;
      saveNotificationData();
    },
    getNextToShow: function()
    {
      function checkTarget(target, parameter, name, version)
      {
        var minVersionKey = parameter + "MinVersion";
        var maxVersionKey = parameter + "MaxVersion";
        return !(parameter in target && target[parameter] != name || minVersionKey in target && Services.vc.compare(version, target[minVersionKey]) < 0 || maxVersionKey in target && Services.vc.compare(version, target[maxVersionKey]) > 0);
      }
      if (typeof Prefs.notificationdata.data != "object" || !(Prefs.notificationdata.data.notifications instanceof Array))
      {
        return null;
      }
      if (!(Prefs.notificationdata.shown instanceof Array))
      {
        Prefs.notificationdata.shown = [];
        saveNotificationData();
      }
      var _tempVar33 = require("info");
      var addonName = _tempVar33.addonName;
      var addonVersion = _tempVar33.addonVersion;
      var application = _tempVar33.application;
      var applicationVersion = _tempVar33.applicationVersion;
      var platform = _tempVar33.platform;
      var platformVersion = _tempVar33.platformVersion;
      var notifications = Prefs.notificationdata.data.notifications;
      var notificationToShow = null;
      for (var _loopIndex34 = 0; _loopIndex34 < notifications.length; ++_loopIndex34)
      {
        var notification = notifications[_loopIndex34];
        if ((typeof notification.severity === "undefined" || notification.severity === "information") && Prefs.notificationdata.shown.indexOf(notification.id) !== -1)
        {
          continue;
        }
        if (notification.targets instanceof Array)
        {
          var match = false;
          for (var _loopIndex35 = 0; _loopIndex35 < notification.targets.length; ++_loopIndex35)
          {
            var target = notification.targets[_loopIndex35];
            if (checkTarget(target, "extension", addonName, addonVersion) && checkTarget(target, "application", application, applicationVersion) && checkTarget(target, "platform", platform, platformVersion))
            {
              match = true;
              break;
            }
          }
          if (!match)
          {
            continue;
          }
        }
        if (!notificationToShow || getNumericalSeverity(notification) > getNumericalSeverity(notificationToShow))
        {
          notificationToShow = notification;
        }
      }
      if (notificationToShow && "id" in notificationToShow)
      {
        Prefs.notificationdata.shown.push(notificationToShow.id);
        saveNotificationData();
      }
      return notificationToShow;
    },
    getLocalizedTexts: function(notification, locale)
    {
      locale = locale || Utils.appLocale;
      var textKeys = ["title", "message"];
      var localizedTexts = [];
      for (var _loopIndex36 = 0; _loopIndex36 < textKeys.length; ++_loopIndex36)
      {
        var key = textKeys[_loopIndex36];
        if (key in notification)
        {
          localizedTexts[key] = localize(notification[key], locale);
        }
      }
      return localizedTexts;
    }
  };
  Notification.init();
  return exports;
})();
require.scopes["stats"] = (function()
{
  var exports = {};
  var Prefs = require("prefs").Prefs;
  var BlockingFilter = require("filterClasses").BlockingFilter;
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var getStats = exports.getStats = function getStats(key, tabId)
  {
    if (tabId)
    {
      var frameData = getFrameData(tabId, 0);
      return frameData && key in frameData ? frameData[key] : 0;
    }
    else
    {
      return key in Prefs.stats_total ? Prefs.stats_total[key] : 0;
    }
  };
  FilterNotifier.addListener(function(action, item, newValue, oldValue, tabId)
  {
    if (action != "filter.hitCount")
    {
      return;
    }
    var blocked = item instanceof BlockingFilter;
    if (blocked)
    {
      if ("blocked" in Prefs.stats_total)
      {
        Prefs.stats_total.blocked++;
      }
      else
      {
        Prefs.stats_total.blocked = 1;
      }
      Prefs.stats_total = Prefs.stats_total;
      var frameData = getFrameData(tabId, 0);
      if (frameData)
      {
        if ("blocked" in frameData)
        {
          frameData.blocked++;
        }
        else
        {
          frameData.blocked = 1;
        }
      }
    }
  });
  return exports;
})();
