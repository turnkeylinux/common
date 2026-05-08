<?php
/** Enables plugins for Adminer for TurnKey
* @link https://github.com/turnkeylinux/common/tree/master/overlays/adminer
* @author Ken Robinson, https://github.com/DocCyblade
* @license http://www.gnu.org/licenses/gpl-2.0.html GNU General Public License, version 2 (one or other)
*/
function adminer_object() {
    // Explicitly include the TurnKey login plugin
    include_once "/etc/adminer/tkl-login.php";

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

        // Explicitly override navigation() since void methods bypass __call
        function navigation(string $missing): void {
            foreach ($this->plugins as $plugin) {
                if (method_exists($plugin, 'navigation')) {
                    $plugin->navigation($missing);
                }
            }
            parent::navigation($missing);
        }

        // Explicitly override loginFormField() since typed methods bypass __call
        function loginFormField(string $name, string $heading, string $value): string {
            foreach ($this->plugins as $plugin) {
                if (method_exists($plugin, 'loginFormField')) {
                    $result = $plugin->loginFormField($name, $heading, $value);
                    if ($result !== null) {
                        return $result;
                    }
                }
            }
            return parent::loginFormField($name, $heading, $value);
        }

        // Dispatch all other method calls to plugins first, falling back to
        // Adminer\Adminer. Note: typed/void methods bypass __call and need
        // explicit overrides above.
        function __call($name, $args) {
            foreach ($this->plugins as $plugin) {
                if (method_exists($plugin, $name)) {
                    $result = call_user_func_array(array($plugin, $name), $args);
                    if ($result !== null) {
                        return $result;
                    }
                }
            }
            $parent = get_parent_class($this);
            if (method_exists($parent, $name)) {
                return call_user_func_array(array($this, 'parent::' . $name), $args);
            }
        }
    }
    return new TurnKeyAdminer($plugins);
}

// Change working directory so index.php can find its relative includes,
// then include the Adminer 5 main file which triggers adminer_object() above.
chdir("/usr/share/adminer/adminer");
include "/usr/share/adminer/adminer/index.php";
