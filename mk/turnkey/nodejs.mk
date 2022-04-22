WEBMIN_FW_TCP_INCOMING = 22 80 443 12320 12321

COMMON_OVERLAYS += nodejs
COMMON_CONF += nodejs-install nodejs

include $(FAB_PATH)/common/mk/turnkey/nginx.mk
