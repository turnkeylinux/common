#!/usr/bin/python3
"""Set web2py admin console password

Option:
    --pass=     unless provided, will ask interactively

"""

import os
import sys
import getopt
import hashlib

import subprocess
from libinithooks.dialog_wrapper import Dialog

def usage(s=None):
    if s:
        print("Error:", s, file=sys.stderr)
    print("Syntax: %s [options]" % sys.argv[0], file=sys.stderr)
    print(__doc__, file=sys.stderr)
    sys.exit(1)

def main():
    import signal
    signal.signal(signal.SIGINT, signal.SIG_IGN)
    try:
        opts, args = getopt.gnu_getopt(sys.argv[1:], "h",
                                       ['help', 'pass='])
    except getopt.GetoptError as e:
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

    os.chdir('/var/www/web2py')
    subprocess.run([
        'python3', '-c',
        "from gluon.main import save_password; save_password(\"%s\", 443)" % password
    ])

    subprocess.run(["chown", "www-data:www-data", fpath])
    subprocess.run(["chmod", "640", fpath])

if __name__ == "__main__":
    main()

