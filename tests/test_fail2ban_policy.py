#!/usr/bin/python3

import configparser
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
JAIL = ROOT / "overlays/turnkey.d/fail2ban/etc/fail2ban/jail.local"
LIVE_DROPIN = (
    ROOT
    / "overlays/turnkey.d/fail2ban/etc/systemd/system"
    / "fail2ban.service.d/turnkey-live.conf"
)


class Fail2banPolicyTests(unittest.TestCase):
    def test_installed_system_policy_allows_human_retries(self):
        config = configparser.ConfigParser(inline_comment_prefixes=("#", ";"))
        config.read(JAIL)

        defaults = config["DEFAULT"]
        self.assertEqual(defaults.getint("maxretry"), 10)
        self.assertEqual(defaults.getint("findtime"), 600)
        self.assertEqual(defaults.getint("bantime"), 600)

    def test_live_boot_modes_skip_fail2ban(self):
        conditions = {
            line.strip()
            for line in LIVE_DROPIN.read_text().splitlines()
            if line.startswith("ConditionKernelCommandLine=")
        }
        self.assertEqual(
            conditions,
            {
                "ConditionKernelCommandLine=!boot=live",
                "ConditionKernelCommandLine=!boot=casper",
            },
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
