# it is important that the include is before the variables
include $(FAB_PATH)/common/mk/turnkey/pgsql.mk

# it is also important that rails goes before rails-pgsql
COMMON_OVERLAYS += yarn rails rails-pgsql
COMMON_CONF += yarn rails-pgsql

include $(FAB_PATH)/common/mk/turnkey/apache.mk
