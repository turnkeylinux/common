For TurnKey v16.x, we have implmented custom generic Stunnel systemd services.

This is a depature from previous releases where the stunnel service covered all
stunnel connections with a single service.

As per previous releases (since v14.0) both Webmin and Webshell (aka
shellinabox) are behind Stunnel/

If you wish to generate your own Stunnel setup so you too can put an
application behind stunnel, please read through the following instructions:

To generate a new Stunnel config, please copy the existing stunnel.conf.example
file to /etc/stunnel/APP_NAME.conf and withn the filename and the file;
replace the following:

    APP_NAME    - the name of the application you wish to put behind stunnel
    PUBLIC_PORT - the public port you wish to make available to remote
                  connections
    LOCAL_PORT  - the local port you wish to bind to

To do this from the commandline, replace the first 3 lines with the actuall app
name and ports (I'm using an example APP_NAME of 'test', with randomly selected
ports). The final 4 lines can be used as is::

    APP_NAME=test
    PUBLIC_PORT=12345
    LOCAL_PORT=8080

    cp /etc/stunnel/stunnel.conf.example /etc/stunnel/$APP_NAME.conf
    sed -i "s|APP_NAME|$APP_NAME|" /etc/stunnel/$APP_NAME.conf
    sed -i "s|PUBLIC_PORT|$PUBLIC_PORT|g" /etc/stunnel/$APP_NAME.conf
    sed -i "s|PUBLIC_PORT|$PUBLIC_PORT|g" /etc/stunnel/$APP_NAME.conf

Then to start your new custom stunnel service, please run the following::

    systemctl start stunnel4@APP_NAME.service

To enable your service to auto start on boot::

    systemctl enable stunnel4@APP_NAME.service

Note: the name of the service which Stunnel is tunneling must match the stunnel
config file name, and the new stunnel service name (the bit after the '@').

E.g again using my 'test' application example::

    expected application service file:
    	test.service

    stunnel config file:
        /etc/stunnel/test.conf

    stunnel service:
        stunnel4@test.service
