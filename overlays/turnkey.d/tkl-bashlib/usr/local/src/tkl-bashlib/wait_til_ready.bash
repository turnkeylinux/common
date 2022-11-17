# (c) 2022 - TurnKey GNU/Linux - all rights reserved
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

# check if port is listening
port_listening() {

    local port=${1}

    [[ "$#" -eq 1 ]] \
        || fatal "port_listening requires 1 arg: port number (integer)"
    $(is_integer ${port}) || fatal "port_listening arg must be integer"

    if netstat -tlnp | grep -q ":${port} "; then
        return 0
    else
        return 1
    fi
}

# check http status return code of webserver
get_http_status() {

    local port=${1:-auto}
    local schema=${2:-auto}
    local args="-I"

    case ${port} in
        auto)
            if port_listening 443; then
                port=443
                schema=https
            elif port_listening 80; then
                port=80
                schema=http
            else
                fatal "Auto failed - No process listening on ports 80 or 443"
            fi;;
        [0-9]+)
            if [[ "${schema}" != http?(s) ]]; then
                fatal "Schema (${schema}) must be http|https when port explicitly set"
            elif ! port_listening ${port}; then
                fatal "No process listening on port (${port})"
            fi;;
        *)
            fatal "Port must be an integer, 'auto' or unset (${port})";;
    esac

    curl ${args} ${schema}://localhost:${port} 2>/dev/null \
        | head -1 | sed -nE "s|^.*([0-9]{3}).*|\1|p"
}

# wait for specific http status code
# syntax:
# wait_for_code <retry_code> <success_code> <sleep_secs> <max_retries>
# defaults:       502           200              5           30
# (total max wait: 2min 30sec)
wait_for_http_code() {

    local retry_code=${1:-502}
    local success_code=${2:-200}
    local sleep_sec=${3:-5}
    local max_retries=${4:-30}
    local _count=0

    if ! is_integer ${retry_code} ${success_code} \
                    ${sleep_secs} ${max_retries}; then
        fatal "wait_for_http_code function only accepts integer arguments"
    fi

    while http_code=$(get_http_status); do
        _count=$((_count + 1))
        case ${http_code} in
            ${success_code})
                echo "Ok (http code: ${success_code} - waited "\
                     "$((sleep_sec * _count)))"
                break;;
            ${retry_code})
                echo "retrying in ${sleep_sec} sec (http code: ${retry_code})"
                sleep ${sleep_sec};;
            *)
                fatal "Unexpected HTTP response: ${http_code}";;
        esac
        if [[ ${_count} -gt $((max_retries + 1)) ]]; then
            fatal "Waited over $((max_retries * sleep_sec)) seconds - giving up."
        fi
    done
}

# wait for port to be listening
wait_for_listen() {

    local port=${1}
    local sleep_sec=${2:-2}
    local max_retries=${3:-30}
    local _count=0

    if ! is_integer ${port} ${sleep_secs} ${max_retries}; then
        fatal "wait_for_code function only accepts integer arguments"
    fi

    while ! port_listening ${port}; do
        _count=$((_count + 1))
        sleep ${sleep_sec}
        if [[ ${_count} -gt $((max_retries + 1)) ]]; then
            fatal "Waited over $((max_retries * sleep_sec)) seconds - giving up."
        fi
    done
}
