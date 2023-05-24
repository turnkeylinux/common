COMMON_OVERLAYS += samba-fileserver samba-sid-inithook samba-dav nfs
COMMON_CONF += fileserver-storage samba-rootpass samba-webmin samba-dav nfs ftp

include $(FAB_PATH)/common/mk/turnkey/tkl-webcp.mk
include $(FAB_PATH)/common/mk/turnkey/apache.mk
