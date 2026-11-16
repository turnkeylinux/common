#!/usr/bin/perl
# Run inside a server image with its native Webmin module and OpenSSH installed.
use strict;
use warnings;
use Test::More;
use File::Temp qw(tempdir);
use File::Path qw(make_path);
BEGIN { $ENV{'WEBMIN_CONFIG'} = '/etc/webmin'; $ENV{'WEBMIN_VAR'} = '/var/webmin'; }
chdir('/usr/share/webmin/sshd') or die $!;
use lib '/usr/share/webmin';
require './sshd-lib.pl';
our (%config);
my $root = tempdir(CLEANUP => 1);
make_path("$root/dropins", "$root/nested");
sub fixture_write { my ($name, $text) = @_; open(my $f, '>', $name) or die $!; print $f $text; close($f); }
sub fixture_read { my ($name) = @_; open(my $f, '<', $name) or die $!; local $/; return <$f>; }
my $main = "$root/sshd_config";
my $policy = "$root/dropins/00-turnkey-ec2.conf";
my $nested = "$root/nested/options.conf";
fixture_write($policy, "# EC2 access policy\nPasswordAuthentication no\nPermitRootLogin no\nInclude $root/nested/*.conf\nMatch User nobody\n    PasswordAuthentication yes\n");
fixture_write($nested, "PubkeyAuthentication yes\n");
fixture_write("$root/dropins/10-later.conf", "PasswordAuthentication yes\n");
fixture_write($main, "Include $root/dropins/*.conf\nKbdInteractiveAuthentication no\nMatch User restricted\n    PasswordAuthentication no\n");
$config{'sshd_config'} = $main;
my $conf = &get_sshd_config();
is(&find_value('PasswordAuthentication', $conf), 'no', 'included first value wins');
is(&find_value('PermitRootLogin', $conf), 'no', 'root policy read from include');
is(&find_value('PubkeyAuthentication', $conf), 'yes', 'nested include read');
is(&find_value('KbdInteractiveAuthentication', $conf), 'no', 'global scope restored after included Match');
my $main_before = fixture_read($main);
&lock_file($main);
&save_directive('PasswordAuthentication', $conf, 'yes');
&save_directive('PubkeyAuthentication', $conf, 'no');
&save_directive('Port', $conf, ['2222', '2223']);
&flush_sshd_config();
&unlock_file($main);
like(fixture_read($policy), qr/PasswordAuthentication yes/, 'save reaches effective owner');
like(fixture_read($policy), qr/Match User nobody\n    PasswordAuthentication yes/, 'conditional setting retained');
like(fixture_read($nested), qr/PubkeyAuthentication no/, 'nested owner saved');
like(fixture_read($main), qr/^Port 2222\nPort 2223\nInclude /, 'new repeated values precede include in original order');
is(fixture_read("$root/dropins/10-later.conf"), "PasswordAuthentication yes\n", 'ignored later default preserved');
&get_sshd_config();
is(scalar(glob("$root/dropins/*.lock")), undef, 'include locks released');

# Native sshd validation needs a host key even when inspecting policy only.
system('ssh-keygen', '-q', '-t', 'ed25519', '-N', '', '-f', "$root/key") == 0 or die 'keygen';
fixture_write($main, "HostKey $root/key\n".fixture_read($main));
make_path('/run/sshd');
my $effective = `/usr/sbin/sshd -T -f '$main' -C user=admin,host=localhost,addr=127.0.0.1`;
is($?, 0, 'saved configuration accepted by OpenSSH');
like($effective, qr/^passwordauthentication yes$/m, 'saved password access effective');
like($effective, qr/^permitrootlogin no$/m, 'root stays disabled');
like($effective, qr/^pubkeyauthentication no$/m, 'nested saved choice effective');

fixture_write($main, "Include $policy\nInclude $policy\n");
$conf = &get_sshd_config();
&lock_file($main);
&save_directive('PasswordAuthentication', $conf, 'no');
&flush_sshd_config();
&unlock_file($main);
is(&find_value('PasswordAuthentication', &get_sshd_config()), 'no', 'repeated include safely saved once');

fixture_write($main, "ChallengeResponseAuthentication no\n");
is(&find_value('KbdInteractiveAuthentication', &get_sshd_config()), 'no', 'legacy authentication alias recognized');

# Unconditional Match sections override global defaults during OpenSSH's
# connection-specific pass, including when an owner is included twice.
fixture_write($policy, "PasswordAuthentication yes\n");
fixture_write($main, "HostKey $root/key\nPasswordAuthentication no\nInclude $policy\nMatch all\nInclude $policy\n");
$conf = &get_sshd_config();
is(&find_value('PasswordAuthentication', $conf), 'yes', 'Match all include overrides earlier global default');
$effective = `/usr/sbin/sshd -T -f '$main' -C user=admin,host=localhost,addr=127.0.0.1`;
like($effective, qr/^passwordauthentication yes$/m, 'native Match all result agrees');
&lock_file($main);
&save_directive('PasswordAuthentication', $conf, 'no');
&flush_sshd_config();
&unlock_file($main);
is(fixture_read($policy), "PasswordAuthentication no\n", 'unconditional owner changed once');
is(&find_value('PasswordAuthentication', &get_sshd_config()), 'no', 'unconditional save readback agrees');
fixture_write($main, "PasswordAuthentication no\nMatch User *\nPasswordAuthentication yes\n");
is(&find_value('PasswordAuthentication', &get_sshd_config()), 'yes', 'universal user match overrides global default');
fixture_write($main, "PasswordAuthentication no\nMatch User restricted\nPasswordAuthentication yes\n");
is(&find_value('PasswordAuthentication', &get_sshd_config()), 'no', 'specific match stays separate from default settings');
done_testing();
