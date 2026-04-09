# (c) 2026 - TurnKey GNU/Linux - all rights reserved
#
# This script is part of TKLDev BashLib.
#
# The source can be located locally on TKLDev:
#   ${FAB_PATH}/common/overlays/turnkey.d/tkl-bashlib
#
# To use it within a conf script, first source the base 'init' script:
#
#   source /usr/local/src/tkl-bashlib/init
#
# For more info, including licence, please see the README.rst (should be in
# the same dir as this file).

dl() {
	cd "$2"
	if [[ "$FAB_HTTP_PROXY" ]]; then
		http_proxy="$FAB_HTTP_PROXY" https_proxy="$FAB_HTTPS_PROXY" wget "$1"
	else
		wget "$1"
	fi
	cd -
}
