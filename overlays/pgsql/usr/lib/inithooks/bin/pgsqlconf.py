#!/usr/bin/python3
# Copyright (c) 2008 Alon Swartz <alon@turnkeylinux.org> - all rights reserved

"""
Set PostgreSQL password

Options:
    -u --user=    pgsql username (default: postgres)
    -p --pass=    unless provided, will ask interactively via debconf

"""

import sys
import getopt
import signal
import subprocess

from os import system
from subprocess import check_output, CalledProcessError
from libinithooks.dialog_wrapper import Dialog


class Error(Exception):
    pass


def escape_chars(s):
    """escape special characters"""
    s = s.replace("\\", "\\\\\\")  # \   ->  \\\
    s = s.replace('"', '\\"')      # "   ->  \"
    s = s.replace("'", "\\'")      # '   ->  \'
    s = s.replace("`", "\\`")      # `   ->  \`
    s = s.replace("$", "\\$")      # $   ->  \$
    return s


class PostgreSQL:
    def __init__(self, database='postgres'):
        system('mkdir -p /var/run/postgresql')
        system('chown postgres:postgres /var/run/postgresql')
        system('chmod 2775 /var/run/postgresql')

        self.selfstarted = False
        if not self._is_alive():
            self._start()
            self.selfstarted = True

        self.database = database

    def _is_alive(self):
        try:
            check_output(['/etc/init.d/postgresql', 'status'])

        except CalledProcessError as e:
            if e.returncode == 3:  # ie. stopped
                return False
            else:
                raise Error("Unknown postgresql status exitcode: %s" % e.returncode)

        return True

    def _start(self):
        system("/etc/init.d/postgresql start > /dev/null 2>&1")

    def _stop(self):
        if self.selfstarted:
            system("/etc/init.d/postgresql stop > /dev/null 2>&1")

    def __del__(self):
        self._stop()

    def execute(self, query):
        subprocess.run(
            ['su', 'postgres', '-lc', 'psql -q "%s"' % self.database],
            input = query, check = True
        )


def usage(s=None):
    if s:
        print("Error:", s, file=sys.stderr)
    print("Syntax: %s [options]" % sys.argv[0], file=sys.stderr)
    print(__doc__, file=sys.stderr)
    sys.exit(1)


def main():
    signal.signal(signal.SIGINT, signal.SIG_IGN)

    try:
        opts, args = getopt.gnu_getopt(sys.argv[1:], "hu:p:",
                                       ['help', 'user=', 'pass='])
    except getopt.GetoptError as e:
        usage(e)

    username = "postgres"
    password = ""

    for opt, val in opts:
        if opt in ('-h', '--help'):
            usage()
        elif opt in ('-u', '--user'):
            username = val
        elif opt in ('-p', '--pass'):
            password = val

    if not password:
        d = Dialog('TurnKey Linux - First boot configuration')
        password = d.get_password(
            "PostgreSQL Password",
            "Please enter new password for the '%s' account." % username)

    p = PostgreSQL()

    # set password
    p.execute(
            ("alter user %s with encrypted password E\'%s\';" % (username, escape_chars(password)))
            .encode('utf8'))

if __name__ == "__main__":
    main()
