include $(FAB_PATH)/common/mk/turnkey/tkl-webcp.mk
include $(FAB_PATH)/common/mk/turnkey/nginx-nodejs.mk

COMMON_OVERLAYS += nodejs-pm2-tklwebcp
COMMON_CONF += nodejs-pm2-tklwebcp
