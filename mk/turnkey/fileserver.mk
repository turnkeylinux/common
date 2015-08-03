COMMON_OVERLAYS += samba-fileserver samba-sid-inithook samba-dav nfs tkl-webcp nginx
COMMON_CONF += fileserver-storage samba-rootpass samba-webmin samba-dav nfs tkl-webcp

include $(FAB_PATH)/common/mk/turnkey/php.mk
