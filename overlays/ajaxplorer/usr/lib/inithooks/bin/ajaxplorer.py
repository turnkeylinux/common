#!/usr/bin/python
"""Set ajaxplorer local admin password

Option:
    --pass=     unless provided, will ask interactively

"""

import re
import sys
import getopt
import hashlib

from dialog_wrapper import Dialog

def usage(s=None):
    if s:
        print >> sys.stderr, "Error:", s
    print >> sys.stderr, "Syntax: %s [options]" % sys.argv[0]
    print >> sys.stderr, __doc__
    sys.exit(1)

def main():
    try:
        opts, args = getopt.gnu_getopt(sys.argv[1:], "h", ['help', 'pass=',])
    except getopt.GetoptError, e:
        usage(e)

    password = ""
    for opt, val in opts:
        if opt in ('-h', '--help'):
            usage()
        elif opt == '--pass':
            password = val

    if not password:
        d = Dialog('TurnKey Linux - First boot configuration')
        password = d.get_password(
            "AjaXplorer Password",
            "Enter password for AjaXplorer local admin account.")
 
    hashpass = hashlib.md5(password).hexdigest()

    new = []
    users = "/var/www/ajaxplorer/data/plugins/auth.serial/users.ser"
    for s in file(users).readlines():
        s = s.rstrip()
        if "\"admin\"" in s:
            s = re.sub(":\"([a-z0-9]*)\";}", ":\"%s\";}" % hashpass, s)
        new.append(s)

    fh = file(users, "w")
    print >> fh, "\n".join(new)
    fh.close()

if __name__ == "__main__":
    main()

