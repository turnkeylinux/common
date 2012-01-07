RELEASE ?= ubuntu/lucid

CDROOT ?= gfxboot-turnkey
HOSTNAME ?= $(shell basename $(shell pwd))

CONF_VARS += HOSTNAME ROOT_PASS MULTIVERSE
CONF_VARS += WEBMIN_THEME WEBMIN_FW_TCP_INCOMING WEBMIN_FW_TCP_INCOMING_REJECT WEBMIN_FW_UDP_INCOMING
# these are needed to control styling of credits (e.g., conf/apache-credit)
CONF_VARS += CREDIT_STYLE CREDIT_STYLE_EXTRA CREDIT_ANCHORTEXT CREDIT_LOCATION

COMMON_OVERLAYS := turnkey.d $(COMMON_OVERLAYS)
COMMON_CONF := turnkey.d $(COMMON_CONF)
COMMON_REMOVELISTS += turnkey

VERSION_TAG ?= rc

FAB_SHARE_PATH ?= /usr/share/fab

# this hack allows inheritors to define their own root.patched/post hooks
# warning - first line *needs* to be empty for this to work
define _root.patched/post
	
	# 
	# tagging package management system with release package
	# setting /etc/turnkey_version and apt user-agent
	#
	$(FAB_SHARE_PATH)/make-release-deb.py $(FAB_PATH)/products/turnkey/core/changelog $O/root.patched
	@if [ -f ./changelog ]; then \
		echo $(FAB_SHARE_PATH)/make-release-deb.py ./changelog $O/root.patched; \
		$(FAB_SHARE_PATH)/make-release-deb.py ./changelog $O/root.patched; \
		turnkey_version=$$($(FAB_SHARE_PATH)/turnkey-version.py --dist=$(CODENAME) --tag=$(VERSION_TAG) ./changelog); \
		turnkey_aptconf="Acquire::http::User-Agent \"TurnKey APT-HTTP/1.3 ($$turnkey_version)\";"; \
		echo $$turnkey_version > $O/root.patched/etc/turnkey_version; \
		echo $$turnkey_aptconf > $O/root.patched/etc/apt/apt.conf.d/01turnkey; \
	else \
		echo; \
		echo "WARNING: can't tag local release (./changelog doesn't exist)"; \
		echo; \
	fi

	fab-chroot $O/root.patched "dpkg -i *.deb && rm *.deb"
endef
root.patched/post += $(_root.patched/post)

include $(FAB_SHARE_PATH)/product.mk

