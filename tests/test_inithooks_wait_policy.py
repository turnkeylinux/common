from pathlib import Path
import unittest


RUNNER = (
    Path(__file__).resolve().parents[1]
    / "overlays/turnkey.d/inithooks/usr/lib/inithooks/run"
)


class InithooksWaitPolicyTests(unittest.TestCase):
    def test_late_firstboot_hooks_share_one_startup_wait(self):
        runner = RUNNER.read_text()

        self.assertIn("local boot_wait_complete=", runner)
        self.assertIn(
            '[[ -n "$firstboot" && -z "$boot_wait_complete" ]]',
            runner,
        )
        self.assertIn("boot_wait_complete=true", runner)


if __name__ == "__main__":
    unittest.main()
