WEBMIN_FW_TCP_INCOMING = 22 80 135 139 443 445 5357 12321
WEBMIN_FW_UDP_INCOMING = 137 138 3702

COMMON_OVERLAYS += samba-fileserver samba-sid-inithook samba-dav nfs
COMMON_CONF += fileserver-storage samba-rootpass samba-webmin samba-dav nfs

include $(FAB_PATH)/common/mk/turnkey/tkl-webcp.mk
include $(FAB_PATH)/common/mk/turnkey/apache.mk
