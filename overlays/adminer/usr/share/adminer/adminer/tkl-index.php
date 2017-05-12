<?php

/** Enables plugins for Adminer for TurnKey
* @link https://github.com/turnkeylinux/common/tree/master/overlays/adminer
* @author Ken Robinson, https://github.com/DocCyblade
* @license http://www.gnu.org/licenses/gpl-2.0.html GNU General Public License, version 2 (one or other)
*/

function adminer_object() {
        // required to run any plugin
        include_once "../plugins/plugin.php";

        // autoloader
        foreach (glob("../plugins/*.php") as $filename) {
                include_once $filename;
        }

        // Array of servers
        // We will use the below to customize this file later with conf script
        $tkl_servers = array("localhost" => "DB_DESC on " . gethostname());
        $tkl_database = "DRIVER";

        // Plugins we want to use, disable version checking and lock server to
        // localhost and database type
        $plugins = array(
                new AdminerVersionNoverify,
                new TurnKeyAdminerLoginServers($tkl_servers, $tkl_database )                
        );

        return new AdminerPlugin($plugins);
}

// include original Adminer
include "./index.php";
