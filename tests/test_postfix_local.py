#!/usr/bin/env python3
"""Postfix build configuration must not depend on the host's listeners."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


SCRIPT = Path(__file__).resolve().parents[1] / "conf/turnkey.d/postfix-local"


class PostfixBuildTests(unittest.TestCase):
    def run_config(self, hostname="test.example", occupied=False, check_status=0):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            log = root / "commands"
            for name in ("postconf", "postmulti", "systemctl", "ss"):
                command = root / name
                command.write_text(
                    "#!/bin/sh\n"
                    'printf "%s %s\\n" "${0##*/}" "$*" >> "$COMMAND_LOG"\n'
                    'if [ "${0##*/}" = ss ] && [ "$OCCUPIED" = 1 ]; then\n'
                    '  echo "LISTEN 0 100 127.0.0.1:25 0.0.0.0:*"\n'
                    'elif [ "${0##*/} $*" = "postmulti -x postfix check" ]; then\n'
                    '  exit "$CHECK_STATUS"\n'
                    "fi\n"
                )
                command.chmod(0o755)
            env = dict(os.environ, PATH=str(root) + os.pathsep + os.environ["PATH"],
                       HOSTNAME=hostname, COMMAND_LOG=str(log),
                       OCCUPIED=str(int(occupied)), CHECK_STATUS=str(check_status))
            result = subprocess.run([str(SCRIPT)], env=env, capture_output=True, text=True)
            calls = log.read_text().splitlines() if log.exists() else []
            return result, calls

    def test_existing_listener_does_not_prevent_configuration(self):
        result, calls = self.run_config(occupied=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("postconf -e myhostname=test.example", calls)
        self.assertIn("postmulti -x postfix check", calls)
        self.assertIn("systemctl enable postfix@-.service", calls)
        self.assertFalse(any(call.startswith("ss ") for call in calls))
        self.assertNotIn("postmulti -x postfix start", calls)
        self.assertNotIn("postmulti -x postfix stop", calls)

    def test_missing_hostname_has_actionable_error(self):
        result, calls = self.run_config(hostname="")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Error: Hostname not defined", result.stderr)
        self.assertNotIn("command not found", result.stderr)
        self.assertEqual(calls, [])

    def test_configuration_check_failure_stops_before_enabling(self):
        result, calls = self.run_config(check_status=9)
        self.assertEqual(result.returncode, 9, result.stderr)
        self.assertNotIn("systemctl enable postfix@-.service", calls)


if __name__ == "__main__":
    unittest.main()
