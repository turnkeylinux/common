COMMON_OVERLAYS += rails apache
COMMON_CONF += postfix-local rails apache-vhost apache-security

include $(FAB_PATH)/common/mk/turnkey/mysql.mk
