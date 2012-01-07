COMMON_OVERLAYS += rails
COMMON_CONF += postfix-local rails apache-vhost

include $(FAB_PATH)/common/mk/turnkey/mysql.mk
