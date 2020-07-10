#!/usr/bin/python3
# Copyright (c) 2008 Alon Swartz <alon@turnkeylinux.org> - all rights reserved

"""
Configure MySQL (sets MySQL password and optionally executes query)

Options:
    -u --user=    mysql username (default: adminer)
    -p --pass=    unless provided, will ask interactively
    -H --host=    hostname - optional (default: localhost)
                  - never asked interactively

    --query=      optional query to execute after setting password

"""

import re
import sys
import time
import getopt

import signal

from dialog_wrapper import Dialog
from os import system
import pymysql
import pymysql.cursors

DEBIAN_CNF = "/etc/mysql/debian.cnf"

class Error(Exception):
    pass

class MySQL:
    def __init__(self):
        system("mkdir -p /var/run/mysqld")
        system("chown mysql:root /var/run/mysqld")

        self.selfstarted = False
        if not self._is_alive():
            self._start()
            self.selfstarted = True

        self.connect()

    def connect(self):
        self.connection = pymysql.connect(
            unix_socket='/run/mysqld/mysqld.sock',
            user='root',
            cursorclass=pymysql.cursors.DictCursor)
        self.connected = True

    def _is_alive(self):
        return system('mysqladmin -s ping >/dev/null 2>&1') == 0

    def _start(self):
        system("mysqld --skip-networking >/dev/null 2>&1 &")
        for i in range(6):
            if self._is_alive():
                return

            time.sleep(1)

        raise Error("could not start mysqld")

    def _stop(self):
        if self.selfstarted:
            system("mysqladmin --defaults-file=%s shutdown" % DEBIAN_CNF)

    def __del__(self):
        self._stop()

    def execute(self, query, interp=None):
        if not self.connected:
            self.connect()

        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, interp)
            self.connection.commit()
        finally:
            self.connection.close()
            self.connected = False

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
                     ['help', 'user=', 'pass=', 'host=', 'query='])

    except getopt.GetoptError as e:
        usage(e)

    username="adminer"
    password=""
    hostname="localhost"
    queries=[]

    for opt, val in opts:
        if opt in ('-h', '--help'):
            usage()
        elif opt in ('-u', '--user'):
            username = val
        elif opt in ('-p', '--pass'):
            password = val
        elif opt in ('-H', '--host'):
            hostname = val
        elif opt in ('--query'):
            queries.append(val)

    if not password:
        d = Dialog('TurnKey Linux - First boot configuration')
        password = d.get_password(
            "MySQL Password",
            "Please enter new password for the MySQL '%s' account." % username)

    m = MySQL()

    # set password
    #m.execute('update mysql.user set authentication_string=PASSWORD(%s) where User=%s',
    #    (password, username))
    m.execute('ALTER USER %s@%s IDENTIFIED BY %s', (username, hostname, password))
    m.execute('FLUSH PRIVILEGES')

    # edge case: update DEBIAN_CNF
    if username == "debian-sys-maint":
        with open(DEBIAN_CNF, 'r') as fob:
            old = fob.read()
        new = re.sub("password = (.*)\n", "password = %s\n" % password, old)
        with open(DEBIAN_CNF, 'w') as fob:
            fob.write(new)

    # execute any adhoc specified queries
    for query in queries:
        m.execute(query)

if __name__ == "__main__":
    main()
