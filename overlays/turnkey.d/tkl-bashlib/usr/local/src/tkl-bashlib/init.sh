# (c) 2022 - TurnKey GNU/Linux - all rights reserved
#
# This script is part of TKLDev BashLib.
#
# The source can be located locally on TKLDev:
#   ${FAB_PATH}/common/overlays/turnkey.d/tkl-bashlib
#
# To use it within a conf script, first source this base 'init' script:
#
#   source /usr/local/src/tkl-bashlib/init
#
# For more info, including licence, please see the README.rst (should be in
# the same dir as this file).

# set proxy env vars (if not already set)
if [[ -n "${FAB_HTTP_PROXY}" ]] && [[ -z "${http_proxy}" ]]; then
    export http_proxy=${FAB_HTTP_PROXY}
fi
if [[ -n "${FAB_HTTPS_PROXY}" ]] && [[ -z "${https_proxy}" ]]; then
    export https_proxy=${FAB_HTTPS_PROXY}
fi

# set non-interactive dpkg/apt front end
export DEBIAN_FRONTEND=noninteractive

# functions for errors and warnings
fatal() { echo "FATAL: ${@}" >&2; exit 1; }
warn() { echo "WARN: ${@}" >&2; exit 1; }

# check for integers
# if any elements of $@ are _not_ integers - will return 1
is_integer() {
    [[ "$#" -gt 0 ]] || fatal "is_integer requires at least one argument"
    for item in $@; do
        if [[ -n "${item##*[!0-9]*}" ]]; then
            continue
        else
            return 1
        fi
    done
}

# load all other .bash files
for _f in $(dirname ${BASH_SOURCE[0]})/*.bash; do
    source ${_f}
done
