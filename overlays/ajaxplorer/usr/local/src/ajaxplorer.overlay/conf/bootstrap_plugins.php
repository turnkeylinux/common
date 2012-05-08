<?php

defined('AJXP_EXEC') or die( 'Access not allowed');

/********************************************
 * CUSTOM VARIABLES HOOK
 ********************************************/
/**
 * This is a sample "hard" hook, directly included.
 * See directly the PluginSkeleton class for more explanation.
 */
//require_once AJXP_INSTALL_PATH."/plugins/action.skeleton/class.PluginSkeleton.php";
//AJXP_Controller::registerIncludeHook("vars.filter", array("PluginSkeleton", "filterVars"));

/*********************************************************/
/* PLUGINS DEFINITIONS
/* Drivers will define how the application will work. For 
/* each type of operation, there are multiple implementation
/* possible. Check the content of the plugins folder.
/* CONF = users and repositories definition, 
/* AUTH = users authentification mechanism,
/* LOG = logs of the application.
/*********************************************************/

$PLUGINS = array(
    "CONF_DRIVER" => array(
        "NAME"		=> "serial",
        "OPTIONS"	=> array(
            "REPOSITORIES_FILEPATH"	=> "AJXP_DATA_PATH/plugins/conf.serial/repo.ser",
            "ROLES_FILEPATH"		=> "AJXP_DATA_PATH/plugins/auth.serial/roles.ser",
            "USERS_DIRPATH"			=> "AJXP_DATA_PATH/plugins/auth.serial",
            "CUSTOM_DATA"			=> array(
                "email"	=> "Email", 
                "country" => "Country"
            )
        )
    ),

    "AUTH_DRIVER" => array(
        "NAME"      => "multi",
        "OPTIONS"   => array(
            "MASTER_DRIVER"         => "smb",
            "TRANSMIT_CLEAR_PASS"   => true,
            "USER_ID_SEPARATOR"     => "-",
            "DRIVERS" => array(
                "smb" => array(
                    "LABEL"    => "Samba",
                    "NAME"     => "smb",
                    "OPTIONS"  => array(
                        "REPOSITORY_ID"       => "smb_storage",
                        "ADMIN_USER"          => "admin",
                        "TRANSMIT_CLEAR_PASS" => true,
                        "AUTOCREATE_AJXPUSER" => true,
                        "LOGIN_REDIRECT"      => false,
                    ),
                ),
                "serial" => array(
                    "LABEL"     => "Local",
                    "NAME"      => "serial",
                    "OPTIONS"   => array(
                        "USERS_FILEPATH"       => "AJXP_DATA_PATH/plugins/auth.serial/users.ser",
                        "TRANSMIT_CLEAR_PASS"  => false,
                        "AUTOCREATE_AJXPUSER"  => false,
                        "LOGIN_REDIRECT"       => false,
                    ),
                ),
            ),
        ),
    ),

    "LOG_DRIVER" => array(
        "NAME" => "text",
        "OPTIONS" => array(
            "LOG_PATH" => (defined("AJXP_FORCE_LOGPATH")?AJXP_FORCE_LOGPATH:"AJXP_INSTALL_PATH/data/logs/"),
            "LOG_FILE_NAME" => 'log_' . date('m-d-y') . '.txt',
            "LOG_CHMOD" => 0770
        )
    ),

);
