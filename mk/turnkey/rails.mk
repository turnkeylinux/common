COMMON_OVERLAYS += yarn rails apache 
COMMON_CONF += yarn rails apache-vhost apache-credit 

include $(FAB_PATH)/common/mk/turnkey/mysql.mk
