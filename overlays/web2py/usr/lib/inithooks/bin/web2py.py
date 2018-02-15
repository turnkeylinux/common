#!/usr/bin/python
"""Set web2py admin console password

Option:
    --pass=     unless provided, will ask interactively

"""

import sys
import getopt
import hashlib

from executil import system
from dialog_wrapper import Dialog

def usage(s=None):
    if s:
        print >> sys.stderr, "Error:", s
    print >> sys.stderr, "Syntax: %s [options]" % sys.argv[0]
    print >> sys.stderr, __doc__
    sys.exit(1)

def main():
    import signal
    signal.signal(signal.SIGINT, signal.SIG_IGN)
    try:
        opts, args = getopt.gnu_getopt(sys.argv[1:], "h",
                                       ['help', 'pass='])
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
            "web2py password",
            "Enter new password for the web2py admin console.")
    
    fpath = "/var/www/web2py/parameters_443.py"

    password_script = "python -c 'from gluon.main import save_password; save_password(\"%s\", 443)'" % password
    system("cd /var/www/web2py && %s" % password_script)

    system("chown www-data:www-data %s" % fpath)
    system("chmod 640 %s" % fpath)

if __name__ == "__main__":
    main()

