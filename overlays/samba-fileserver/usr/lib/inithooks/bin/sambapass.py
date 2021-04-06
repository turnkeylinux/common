#!/usr/bin/python3
# Copyright (c) 2017 TurnKey GNU/Linux https://www.turnkeylinux.org
# GPLv3
"""Set Samba account password
Arguments:
    username      username of Samba account to set password for
Options:
    -p --pass=    if not provided, will ask interactively
"""

import sys
import getopt
import signal

import subprocess

def fatal(s):
    print("Error:", s, file=sys.stderr)
    sys.exit(1)

def usage(s=None):
    if s:
        print("Error:", s, file=sys.stderr)
    print("Syntax: %s <username> [options]" % sys.argv[0], file=sys.stderr)
    print(__doc__, file=sys.stderr)
    sys.exit(1)

def main():
    signal.signal(signal.SIGINT, signal.SIG_IGN)
    try:
        opts, args = getopt.gnu_getopt(sys.argv[1:], "hp:", ['help', 'pass='])
    except getopt.GetoptError as e:
        usage(e)

    if len(args) != 1:
        usage()

    username = args[0]
    password = ""
    for opt, val in opts:
        if opt in ('-h', '--help'):
            usage()
        elif opt in ('-p', '--pass'):
            password = val

    if not password:
        from dialog_wrapper import Dialog
        d = Dialog('TurnKey GNU/Linux - First boot configuration')
        password = d.get_password(
            "%s Samba Password" % username.capitalize(),
            "Please enter new password for the Samba {0} account. Note: the Linux {0}".format(username)
                +" user password will NOT be changed.")

    subprocess.run(
        ['smbpasswd', '-a', '-s', username],
        input=f'{password}\n{password}\n',
        text=True
    )

if __name__ == "__main__":
    main()
