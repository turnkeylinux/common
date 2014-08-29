#!/usr/bin/python
# Copyright (c) 2014 TurnKey GNU/Linux <support@turnkeylinux.org>
"""Set FQDN - fully qualified domain name

Allows the administrator to override the default value

Options:
    -d --fqdn=    default value for dialog
"""

import sys
import getopt
import signal
import re

from dialog_wrapper import Dialog

TEXT = """Please enter a fully qualified DNS domain name
for this TurnKey appliance, or accept the supplied value.
"""

ERR_TEXT = """Please enter a fully qualified DNS domain name
for this TurnKey appliance, or accept the supplied value.

A valid domain name must have two or more labels
separated by periods, of length between 1 and 63,
starting and ending with alphanumeric characters,
containing alphanumeric chars and hyphens in the middle,
contain no other special chars or underscores,
and be no longer than 255 characters total.
"""

"""
DNS name check

    Lookahead makes sure that it has a minimum of 4 (a.in)
    and a maximum of 255 characters

    Two or more labels, separated by periods, of length between
    1 and 63, starting and ending with alphanumeric characters,
    and containing alphanumeric chars and hyphens in the middle.

    Only checks for syntactical correctness.
    Does not verify that domain actually exists.
"""
dns_check = re.compile(r'^(?=.{4,255}$)([a-zA-Z0-9][a-zA-Z0-9-]{,61}[a-zA-Z0-9]\.)+[a-zA-Z0-9-]{2,63}$')

def fatal(s):
    print >> sys.stderr, "Error:", s
    sys.exit(1)

def usage(s=None):
    if s:
        print >> sys.stderr, "Error:", s
    print >> sys.stderr, "Syntax: %s [options]" % sys.argv[0]
    print >> sys.stderr, __doc__
    sys.exit(1)

def main():
    signal.signal(signal.SIGINT, signal.SIG_IGN)
    try:
        opts, args = getopt.gnu_getopt(sys.argv[1:], "hd:", ['help', 'fqdn='])
    except getopt.GetoptError, e:
        usage(e)

    fqdn = ""
    for opt, val in opts:
        if opt in ('-h', '--help'):
            usage()
        elif opt in ('-d', '--fqdn'):
            fqdn = val

    d = Dialog('TurnKey Linux - First boot configuration')
    retcode, fqdn = d.inputbox("Assign TurnKey DNS domain name", TEXT,
                               fqdn, "Apply", "")

    while not dns_check.match(fqdn):
        d = Dialog('TurnKey Linux - First boot configuration')
        retcode, fqdn = d.inputbox("Assign TurnKey DNS domain name", ERR_TEXT,
                                   fqdn, "Apply", "")
    
    print fqdn

if __name__ == "__main__":
    main()

