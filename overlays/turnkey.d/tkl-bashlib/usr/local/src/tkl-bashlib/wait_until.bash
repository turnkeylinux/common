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

wait_until_ok() {
    # run a command in a loop with a timeout until either the command runs
    # successfully or the total timeout is reached
    #
    # return 0 if command ran successfully
    # return 1 if timeout expired

    cmd="$1"
    poll_time="${2:-5}"
    max_polls="${3:-10}"

    for i in $(seq 1 "$max_polls"); do
        if $cmd; then
            return 0
        fi
        sleep $poll_time
    done
    fatal "wait_until_ok: timeout expired"
}
wait_until_fail() {
    # run a command in a loop with a timeout until either the command fails
    # or the total timeout is reached
    #
    # return 0 if command failed
    # return 1 if timeout expired

    cmd="$1"
    poll_time="${2:-5}"
    max_polls="${3:-10}"

    for i in $(seq 1 "$max_polls"); do
        if ! $cmd; then
            return 0
        fi
        sleep $poll_time
    done
    fatal "wait_until_fail: timeout expired"
}

is_running() {
    # check if process is running by pid
    # return 0 if process is running
    # return 1 if process is not running

    pid=$1
    ps -p $pid >/dev/null
}

wait_until_dead() {
    # wait until pid is dead
    pid="$1"
    poll_time="${2:-5}"
    max_polls="${3:-10}"
    wait_until_fail "is_running $pid" "$poll_time" "$max_polls"
}
