#!/usr/bin/python3
# Copyright (c) 2008 Alon Swartz <alon@turnkeylinux.org> - all rights reserved
# Copyright (c) 2009-2026 TurnKey GNU/Linux <admin@turnkeylinux.org>

"""Configure MySQL/MariaDB password and (optionally) execute query.

Options:
    -u --user=    mysql username (default: adminer)
    -p --pass=    unless provided, will ask interactively
    -H --host=    hostname - optional (default: localhost)
                  - never asked interactively

    --query=      optional query to execute after setting password

"""

# ruff: noqa: D101, D102, D103, D105, D107, PTH103, EM101, TRY003
import getopt
import os
import shutil
import signal
import subprocess
import sys
from typing import NoReturn

import pymysql
import pymysql.cursors
from libinithooks.dialog_wrapper import Dialog


class Error(Exception):
    pass


class MySQL:
    def __init__(self) -> None:
        # only required in chroot - otherwise created at boot
        os.makedirs("/run/mysqld", exist_ok=True)
        shutil.chown("/run/mysqld", user="mysql", group="mysql")

        self.selfstarted = False
        state = self._state()
        if state != "active":
            self._start()
            self.selfstarted = state not in ("activating", "reloading")

        self.connect()

    def connect(self) -> None:
        self.connection = pymysql.connect(
            unix_socket="/run/mysqld/mysqld.sock",
            user="root",
            cursorclass=pymysql.cursors.DictCursor,
        )
        self.connected = True

    def _state(self) -> str:
        state = subprocess.run(
            # don't use systemctl path - build time uses wrapper
            ["systemctl", "is-active", "mariadb"],  # noqa: S607
            check=False,
            stdout=subprocess.PIPE,
            text=True,
        )
        return state.stdout.strip()

    def _start(self) -> None:
        start_mysql = subprocess.run(
            # don't use systemctl path - build time uses wrapper script
            ["systemctl", "start", "mariadb"],  # noqa: S607
            check=False,
        )
        if start_mysql.returncode != 0:
            raise Error("Could not start mysqld")

    def _stop(self) -> None:
        if self.selfstarted:
            subprocess.run(
                # don't use systemctl path - build time uses wrapper script
                ["systemctl", "stop", "mariadb"],  # noqa: S607
                check=True,
            )

    def __del__(self) -> None:
        # do we still want/need this & ._stop() now we're using systemctl?
        self._stop()

    def execute(
        self,
        query: str,
        interp: tuple[str, str, str] | None = None,
        output: bool = False,
    ) -> tuple | None:
        if not self.connected:
            self.connect()
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, interp)
                if output:
                    result = cursor.fetchall()
            self.connection.commit()
        finally:
            self.connection.close()
            self.connected = False
        if output:
            return result
        return None


def usage(s: str | getopt.GetoptError | None = None) -> NoReturn:
    if s:
        print("Error:", s, file=sys.stderr)
    print(f"Syntax: {sys.argv[0]} [options]", file=sys.stderr)
    print(__doc__, file=sys.stderr)
    sys.exit(1)


def main() -> None:
    signal.signal(signal.SIGINT, signal.SIG_IGN)
    try:
        opts, _args = getopt.gnu_getopt(
            sys.argv[1:],
            "hu:p:",
            ["help", "user=", "pass=", "host=", "query="],
        )

    except getopt.GetoptError as e:
        usage(e)

    username = "adminer"
    password = ""
    hostname = "localhost"
    queries = []

    for opt, val in opts:
        if opt in ("-h", "--help"):
            usage()
        elif opt in ("-u", "--user"):
            username = val
        elif opt in ("-p", "--pass"):
            password = val
        elif opt in ("-H", "--host"):
            hostname = val
        elif opt in ("--query"):
            queries.append(val)

    if not password:
        d = Dialog("TurnKey Linux - First boot configuration")
        password = d.get_password(
            "MySQL/MariaDB Password",
            f"Please enter new password for the MySQL/MariaDB '{username}'"
            " account.",
        )

    m = MySQL()

    # set password
    m.execute(
        # IMPORTANT: Always use % formating in SQL querries via pymysql
        "ALTER USER %s@%s IDENTIFIED BY %s", (username, hostname, password),
    )
    m.execute("FLUSH PRIVILEGES")

    # execute any adhoc specified queries
    for query in queries:
        m.execute(query)


if __name__ == "__main__":
    main()
