#!/usr/bin/python
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

from executil import system

def fatal(s):
    print >> sys.stderr, "Error:", s
    sys.exit(1)

def usage(s=None):
    if s:
        print >> sys.stderr, "Error:", s
    print >> sys.stderr, "Syntax: %s <username> [options]" % sys.argv[0]
    print >> sys.stderr, __doc__
    sys.exit(1)

def main():
    signal.signal(signal.SIGINT, signal.SIG_IGN)
    try:
        opts, args = getopt.gnu_getopt(sys.argv[1:], "hp:", ['help', 'pass='])
    except getopt.GetoptError, e:
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

    system("(echo \"{0}\" ; echo \"{0}\" ) | smbpasswd -a -s {1}".format(password,username))

if __name__ == "__main__":
    main()
