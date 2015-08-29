include $(FAB_PATH)/common/mk/turnkey/pgsql.mk

COMMON_OVERLAYS += rails apache
COMMON_CONF += rails-pgsql apache-vhost
