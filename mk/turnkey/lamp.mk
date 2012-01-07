WEBMIN_FW_TCP_INCOMING = 22 80 443 12320 12321 12322

COMMON_OVERLAYS += phpmyadmin phpmyadmin-apache confconsole-lamp
COMMON_CONF += apache-vhost postfix-local phpmyadmin phpmyadmin-apache

include $(FAB_PATH)/common/mk/turnkey/php.mk
include $(FAB_PATH)/common/mk/turnkey/mysql.mk
