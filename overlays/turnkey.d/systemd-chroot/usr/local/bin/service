#!/bin/bash

if [[ $1 == "apache2" ]]; then
    if [[ $2 == "reload" ]]; then
        APACHE_STARTED_BY_SYSTEMD=y /usr/sbin/apache2ctl restart
    else
        APACHE_STARTED_BY_SYSTEMD=y /usr/sbin/apache2ctl $2
    fi
else
    /usr/sbin/service $@
fi

