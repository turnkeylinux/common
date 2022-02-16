#!/usr/bin/python3
"""Set Tomcat admin password

Option:
    --pass=     unless provided, will ask interactively

"""

import sys
import getopt
import subprocess
import xml.dom.minidom
import signal

from libinithooks.dialog_wrapper import Dialog

TOMCAT = "tomcat9"


def usage(s=None):
    if s:
        print("Error:", s, file=sys.stderr)
    print("Syntax: %s [options]" % sys.argv[0], file=sys.stderr)
    print(__doc__, file=sys.stderr)
    sys.exit(1)


def main():
    signal.signal(signal.SIGINT, signal.SIG_IGN)
    try:
        opts, args = getopt.gnu_getopt(sys.argv[1:], "h", ['help', 'pass='])
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
            "Tomcat Password",
            "Enter new password for the Tomcat 'admin' account.")

    tomcat_user_conf = f"/etc/{TOMCAT}/tomcat-users.xml"
    doc = xml.dom.minidom.parse(tomcat_user_conf).documentElement
    users = doc.getElementsByTagName('user')
    for user in users:
        if not user.getAttribute('username') == 'admin':
            continue
        user.setAttribute('password', password)

    with open(tomcat_user_conf, 'w') as fob:
        fob.write("<?xml version='1.0' encoding='utf-8'?>\n")
        doc.writexml(fob)
        fob.write("\n")

    # restart tomcat if running so password change will take effect
    tomcat_status = ['systemctl', '-q', 'is-active', f'{TOMCAT}.service']
    tomcat_stopped = subprocess.run(tomcat_status).returncode
    if not tomcat_stopped:
        subprocess.run(['systemctl', 'restart', f'{TOMCAT}.service'])


if __name__ == "__main__":
    main()
