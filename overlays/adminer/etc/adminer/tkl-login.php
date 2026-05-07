<?php
/** Display constant list of servers in login form with TurnKey branding.
* @link https://www.adminer.org/plugins/#use
* @link https://github.com/turnkeylinux/common/tree/master/overlays/adminer
* @author Jakub Vrana, http://www.vrana.cz/
* @author Ken Robinson, https://github.com/DocCyblade
* @license https://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0
* @license https://www.gnu.org/licenses/gpl-2.0.html GNU General Public License, version 2 (one or other)
*/
class TurnKeyAdminerLoginServers {
    /** @access protected */
    var $servers, $driver;

    /** Set supported servers
    * @param array array($domain => $description)
    * @param string driver name e.g. "server" for MySQL/MariaDB, "pgsql" for PostgreSQL
    */
    function __construct($servers, $driver = "server") {
        $this->servers = $servers;
        $this->driver = $driver;

        // Set the driver from the submitted server on POST
        if (!empty($_POST["auth"]["server"])) {
            $_POST["auth"]["driver"] = $this->driver;
        }
    }

    function login($login, $password) {
        // Allow only servers in our defined list
        foreach ($this->servers as $key => $val) {
            $server = is_string($key) ? $key : $val;
            if ($server == Adminer\SERVER) {
                return; // null = allow, proceed with normal auth
            }
        }
        return false; // server not in list, deny
    }

    function loginFormField($name, $heading, $value) {
        if ($name == 'driver') {
            // Hide the driver field; we set it via the constructor
            return '<input type="hidden" name="auth[driver]" value="' . Adminer\h($this->driver) . '">' . "\n";
        }
        if ($name == 'server') {
            // Replace the free-text server field with a locked dropdown
            $options = '';
            foreach ($this->servers as $key => $desc) {
                $serverVal = is_string($key) ? $key : $desc;
                $selected  = ($serverVal == Adminer\SERVER) ? ' selected' : '';
                $options  .= '<option value="' . Adminer\h($serverVal) . '"' . $selected . '>'
                           . Adminer\h($desc) . '</option>';
            }
            return $heading . '<select name="auth[server]">' . $options . '</select>' . "\n";
        }
        // Return null for all other fields (username, password, permanent login)
        // so Adminer renders them normally
        return null;
    }

    function navigation(string $missing): void {
        // Render TurnKey branding at the top of the left pane,
        // visible both on the login page and when logged in.
        echo '<p style="padding: 8px 0; border-bottom: 1px solid #E4E2DA; margin-bottom: 8px;">';
        echo '<a target="_blank" href="https://www.turnkeylinux.org" style="border: none; padding: 0; font-size: 1.3em;">'
           . '<b>TurnKey Linux</b></a>';
        echo '<br><small>Database Administration Console</small>';
        echo '<br><small><i>Powered by <a target="_blank" href="https://www.adminer.org" style="border: none; padding: 0;">Adminer</a></i></small>';
        echo '</p>';
        // No return - void. Adminer will continue and render its own navigation after this.
    }
}
