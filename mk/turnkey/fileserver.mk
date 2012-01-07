COMMON_OVERLAYS += samba-fileserver samba-sid-inithook extplorer
COMMON_CONF += fileserver-storage samba-rootpass extplorer lighttpd-fastcgi-minimize

include $(FAB_PATH)/common/mk/turnkey/php.mk
