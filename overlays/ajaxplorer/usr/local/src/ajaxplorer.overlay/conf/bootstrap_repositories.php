<?php
defined('AJXP_EXEC') or die( 'Access not allowed');

$REPOSITORIES["smb_storage"] = array(
    "DISPLAY"    => "storage",
    "AJXP_SLUG"  => "smb-storage",
    "DRIVER"     => "smb",
    "DRIVER_OPTIONS" => array(
        "HOST"                    => "127.0.0.1",
        "PATH"                    => "storage",
        "CHMOD_VALUE"             => "0644",
        "USER"                    => "",
        "PASS"                    => "",
        "USE_SESSION_CREDENTIALS" => true,
        "RECYCLE_BIN"             => "recycle_bin",
        "DEFAULT_RIGHTS"          => "rw",
        "CHARSET"                 => "",
        "PAGINATION_THRESHOLD"    => 500,
        "PAGINATION_NUMBER"       => 200,
     ),
);

$REPOSITORIES["smb_home"] = array(
    "DISPLAY"    => "home",
    "AJXP_SLUG"  => "smb-home",
    "DRIVER"     => "smb",
    "DRIVER_OPTIONS" => array(
        "HOST"                    => "127.0.0.1",
        "PATH"                    => "homes",
        "CHMOD_VALUE"             => "0640",
        "USER"                    => "",
        "PASS"                    => "",
        "USE_SESSION_CREDENTIALS" => true,
        "RECYCLE_BIN"             => "recycle_bin",
        "DEFAULT_RIGHTS"          => "rw",
        "CHARSET"                 => "",
        "PAGINATION_THRESHOLD"    => 500,
        "PAGINATION_NUMBER"       => 200,
     ),
);

// DO NOT REMOVE THIS!
// SHARE ELEMENTS
$REPOSITORIES["ajxp_shared"] = array(
    "DISPLAY"        => "Shared Elements",
    "DISPLAY_ID"     => "363",
    "DRIVER"         => "ajxp_shared",
    "DRIVER_OPTIONS" => array(
        "DEFAULT_RIGHTS" => "rw"
    )
);

// ADMIN REPOSITORY
$REPOSITORIES["ajxp_conf"] = array(
    "DISPLAY"        => "Settings",
    "DISPLAY_ID"     => "165",
    "DRIVER"         => "ajxp_conf",
    "DRIVER_OPTIONS" => array()
);

$REPOSITORIES["fs_template"] = array(
    "DISPLAY"        => "Sample Template",
    "DISPLAY_ID"     => 431,
    "IS_TEMPLATE"    => true,
    "DRIVER"         => "fs",
    "DRIVER_OPTIONS" => array(
        "CREATE"               => true,
        "RECYCLE_BIN"          => 'recycle_bin',
        "CHMOD_VALUE"          => '0600',
        "PAGINATION_THRESHOLD" => 500,
        "PAGINATION_NUMBER"    => 200,
        "PURGE_AFTER"          => 0,
        "CHARSET"              => "",
        "META_SOURCES"         => array(
            "metastore.serial"  => array(
                "METADATA_FILE"          => ".ajxp_meta",
                "METADATA_FILE_LOCATION" => "infolders"
            ),
            "meta.user"         => array(
                "meta_fields"     => "comment",
                "meta_labels"     => "Comment",
                "meta_visibility" => "hidden"
            ),
            "index.lucene"      => array(
                "index_meta_fields" => "comment"
            )
        )
    ),
);
