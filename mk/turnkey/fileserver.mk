COMMON_OVERLAYS += samba-fileserver samba-sid-inithook ajaxplorer
COMMON_CONF += fileserver-storage samba-rootpass samba-webmin ajaxplorer lighttpd-fastcgi

include $(FAB_PATH)/common/mk/turnkey/php.mk
