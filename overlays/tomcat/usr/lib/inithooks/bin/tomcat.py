#!/usr/bin/python
"""Set Tomcat admin password

Option:
    --pass=     unless provided, will ask interactively

"""

import sys
import getopt
import xml.dom.minidom

from executil import system
from dialog_wrapper import Dialog

import signal

TOMCAT_INIT="/etc/init.d/tomcat7"
TOMCAT_USERS="/etc/tomcat7/tomcat-users.xml"

def usage(s=None):
    if s:
        print >> sys.stderr, "Error:", s
    print >> sys.stderr, "Syntax: %s [options]" % sys.argv[0]
    print >> sys.stderr, __doc__
    sys.exit(1)

def main():
    signal.signal(signal.SIGINT, signal.SIG_IGN)
    try:
        opts, args = getopt.gnu_getopt(sys.argv[1:], "h", ['help', 'pass='])
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
            "Tomcat Password",
            "Enter new password for the Tomcat 'admin' account.")


    doc = xml.dom.minidom.parse(TOMCAT_USERS).documentElement
    users = doc.getElementsByTagName('user')
    for user in users:
        if not user.getAttribute('username') == 'admin':
            continue

        user.setAttribute('password', password)

    fh = file(TOMCAT_USERS, "w")
    print >> fh, "<?xml version='1.0' encoding='utf-8'?>"
    doc.writexml(fh)
    print >> fh, "\n"
    fh.close()

    # restart tomcat if running so password change will take effect
    try:
        system(TOMCAT_INIT + " status >/dev/null")
        system(TOMCAT_INIT + " restart")
    except:
        pass

if __name__ == "__main__":
    main()

