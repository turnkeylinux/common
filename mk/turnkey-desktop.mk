# temp hack until we support server/desktop common overlays and conf

RELEASE ?= debian/$(shell lsb_release -s -c)

CDROOT ?= gfxboot-turnkey
HOSTNAME ?= $(shell basename $(shell pwd))
CONF_VARS += HOSTNAME ROOT_PASS NONFREE

COMMON_OVERLAYS_TMP := $(COMMON_OVERLAYS)
COMMON_OVERLAYS := bootstrap_apt
COMMON_OVERLAYS += turnkey.d/bashrc
COMMON_OVERLAYS += turnkey.d/grub
COMMON_OVERLAYS += turnkey.d/profile
COMMON_OVERLAYS += $(COMMON_OVERLAYS_TMP)

COMMON_CONF_TMP := $(COMMON_CONF)
COMMON_CONF := bootstrap_apt
COMMON_CONF += turnkey.d/console-setup
COMMON_CONF += turnkey.d/cronapt
COMMON_CONF += turnkey.d/hostname
COMMON_CONF += turnkey.d/locale
COMMON_CONF += turnkey.d/motd
COMMON_CONF += turnkey.d/persistent-net
COMMON_CONF += turnkey.d/roothome
COMMON_CONF += turnkey.d/rootpass
COMMON_CONF += turnkey.d/sysctl
COMMON_CONF += $(COMMON_CONF_TMP)

COMMON_REMOVELISTS += turnkey
COMMON_REMOVELISTS_FINAL += turnkey

FAB_SHARE_PATH ?= /usr/share/fab

# below hacks allow inheritors to define their own hooks, which will be
# prepended. warning: first line *needs* to be empty for this to work

# setup apt and dns for root.build
define _bootstrap/post

	fab-apply-overlay $(COMMON_OVERLAYS_PATH)/bootstrap_apt $O/bootstrap;
	mkdir -p $O/bootstrap/usr/local/share/ca-certificates/;
	cp /usr/local/share/ca-certificates/squid_proxyCA.crt $O/bootstrap/usr/local/share/ca-certificates/;
	fab-chroot $O/bootstrap --script $(COMMON_CONF_PATH)/bootstrap_apt;
	fab-chroot $O/bootstrap "echo nameserver 8.8.8.8 > /etc/resolv.conf";
	fab-chroot $O/bootstrap "echo nameserver 8.8.4.4 >> /etc/resolv.conf";
endef
bootstrap/post += $(_bootstrap/post)

# tag package management system with release package
# set /etc/turnkey_version and apt user-agent
define _root.patched/post
	
	# 
	# tagging package management system with release package
	# setting /etc/turnkey_version and apt user-agent
	#
	@if [ -f $(FAB_PATH)/products/core/changelog ]; then \
		echo $(FAB_SHARE_PATH)/make-release-deb.py $(FAB_PATH)/products/core/changelog $O/root.patched; \
		$(FAB_SHARE_PATH)/make-release-deb.py $(FAB_PATH)/products/core/changelog $O/root.patched; \
	fi
	@if [ -f ./changelog ]; then \
		echo $(FAB_SHARE_PATH)/make-release-deb.py ./changelog $O/root.patched; \
		$(FAB_SHARE_PATH)/make-release-deb.py ./changelog $O/root.patched; \
		turnkey_version=$$($(FAB_SHARE_PATH)/turnkey-version.py --dist=$(CODENAME) --tag=$(VERSION_TAG) ./changelog $(FAB_ARCH)); \
		turnkey_aptconf="Acquire::http::User-Agent \"TurnKey APT-HTTP/1.3 ($$turnkey_version)\";"; \
		echo $$turnkey_version > $O/root.patched/etc/turnkey_version; \
		echo $$turnkey_aptconf > $O/root.patched/etc/apt/apt.conf.d/01turnkey; \
	else \
		echo; \
		echo "WARNING: can't tag local release (./changelog doesn't exist)"; \
		echo; \
	fi

	fab-chroot $O/root.patched "dpkg -i *.deb && rm *.deb && rm -f /var/log/dpkg.log"

	fab-chroot $O/root.patched "which insserv >/dev/null && insserv"
	fab-chroot $O/root.patched "which postsuper >/dev/null && postsuper -d ALL || true"
endef
root.patched/post += $(_root.patched/post)

include $(FAB_SHARE_PATH)/product.mk
