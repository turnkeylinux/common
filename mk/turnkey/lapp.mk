WEBMIN_FW_TCP_INCOMING = 22 80 443 12321 12322

COMMON_OVERLAYS += adminer confconsole-lapp
COMMON_CONF += apache-cgi adminer-apache adminer-pgsql

include $(FAB_PATH)/common/mk/turnkey/apache.mk
include $(FAB_PATH)/common/mk/turnkey/php.mk
include $(FAB_PATH)/common/mk/turnkey/pgsql.mk
