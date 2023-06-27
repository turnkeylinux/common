WEBMIN_FW_TCP_INCOMING = 22 80 443 12321

COMMON_OVERLAYS += web2py github-latest-release
COMMON_CONF += web2py

include $(FAB_PATH)/common/mk/turnkey/apache.mk
include $(FAB_PATH)/common/mk/turnkey/mysql.mk
