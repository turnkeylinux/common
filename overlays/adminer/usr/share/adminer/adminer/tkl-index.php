<?php
/** Enables plugins for Adminer for TurnKey
* @link https://github.com/turnkeylinux/common/tree/master/overlays/adminer
* @author Ken Robinson, https://github.com/DocCyblade
* @license http://www.gnu.org/licenses/gpl-2.0.html GNU General Public License, version 2 (one or other)
*/
function adminer_object() {
    // Explicitly include the TurnKey login plugin
    include_once "/usr/share/adminer/plugins/tkl-login.php";

    // Array of servers: key => display label
    // The conf script will substitute DB_DESC and DRIVER at deploy time
    $tkl_servers = array("localhost" => "DB_DESC on " . gethostname());
    $tkl_database = "DRIVER"; // e.g. "server" for MySQL/MariaDB, "pgsql" for PostgreSQL

    $plugins = array(
        new TurnKeyAdminerLoginServers($tkl_servers, $tkl_database),
    );

    // TurnKeyAdminer must be defined inside adminer_object() so that
    // Adminer\Adminer is already loaded when this class declaration is evaluated.
    // (adminer_object() is called from within index.php, after the Adminer
    // namespace has been bootstrapped.)
    class TurnKeyAdminer extends Adminer\Adminer {
        private $plugins;

        function __construct(array $plugins) {
            $this->plugins = $plugins;
        }

        // Dispatch method calls to plugins first; if no plugin returns a
        // non-null value, normal inheritance from Adminer\Adminer takes over.
        function __call($name, $args) {
            foreach ($this->plugins as $plugin) {
                if (method_exists($plugin, $name)) {
                    $result = call_user_func_array(array($plugin, $name), $args);
                    if ($result !== null) {
                        return $result;
                    }
                }
            }
        }
    }

    return new TurnKeyAdminer($plugins);
}

// Include the Adminer 5 main file - this triggers the call to adminer_object() above
include __DIR__ . "/index.php";
