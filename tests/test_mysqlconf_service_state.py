#!/usr/bin/python3

import importlib.util
from pathlib import Path
import subprocess
import sys
import types
import unittest
from unittest import mock


MYSQLCONF = (
    Path(__file__).resolve().parents[1]
    / "overlays/mysql/usr/lib/inithooks/bin/mysqlconf.py"
)

pymysql = types.ModuleType("pymysql")
pymysql.connect = mock.Mock()
pymysql.cursors = types.SimpleNamespace(DictCursor=object)
sys.modules.setdefault("pymysql", pymysql)
sys.modules.setdefault("pymysql.cursors", pymysql.cursors)

libinithooks = types.ModuleType("libinithooks")
dialog_wrapper = types.ModuleType("libinithooks.dialog_wrapper")
dialog_wrapper.Dialog = mock.Mock()
sys.modules.setdefault("libinithooks", libinithooks)
sys.modules.setdefault("libinithooks.dialog_wrapper", dialog_wrapper)

spec = importlib.util.spec_from_file_location("mysqlconf", MYSQLCONF)
mysqlconf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mysqlconf)


class MySQLServiceStateTests(unittest.TestCase):
    def make_mysql(self, state):
        commands = []

        def run(command, **kwargs):
            commands.append(command)
            if command[1:3] == ["is-active", "mariadb"]:
                return subprocess.CompletedProcess(command, 0, stdout=state + "\n")
            return subprocess.CompletedProcess(command, 0)

        with mock.patch.object(mysqlconf.os, "makedirs"), \
                mock.patch.object(mysqlconf.shutil, "chown"), \
                mock.patch.object(mysqlconf.subprocess, "run", side_effect=run), \
                mock.patch.object(mysqlconf.MySQL, "connect"):
            database = mysqlconf.MySQL()
            database._stop()
            database.selfstarted = False

        return commands

    def test_already_active_service_is_left_running(self):
        commands = self.make_mysql("active")
        self.assertEqual(commands, [["systemctl", "is-active", "mariadb"]])

    def test_already_activating_service_is_not_stopped(self):
        commands = self.make_mysql("activating")
        self.assertEqual(commands, [
            ["systemctl", "is-active", "mariadb"],
            ["systemctl", "start", "mariadb"],
        ])

    def test_inactive_service_is_stopped_after_temporary_use(self):
        commands = self.make_mysql("inactive")
        self.assertEqual(commands, [
            ["systemctl", "is-active", "mariadb"],
            ["systemctl", "start", "mariadb"],
            ["systemctl", "stop", "mariadb"],
        ])


if __name__ == "__main__":
    unittest.main(verbosity=2)
