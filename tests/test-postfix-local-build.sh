#!/bin/bash
set -Eeuo pipefail

script=${1:-conf/turnkey.d/postfix-local}
test -x "$script"

fixture=$(mktemp -d)
listener_pid=
cleanup() {
    if [[ -n "$listener_pid" ]]; then
        kill "$listener_pid" 2>/dev/null || true
        wait "$listener_pid" 2>/dev/null || true
    fi
    rm -rf -- "$fixture"
}
trap cleanup EXIT

mkdir -p "$fixture/bin"
export FIXTURE_LOG="$fixture/calls"

cat > "$fixture/bin/postconf" <<'EOF'
#!/bin/bash
printf 'postconf:%s\n' "$*" >> "$FIXTURE_LOG"
EOF
cat > "$fixture/bin/postmulti" <<'EOF'
#!/bin/bash
test "$*" = '-p check'
printf 'postmulti:%s\n' "$*" >> "$FIXTURE_LOG"
EOF
cat > "$fixture/bin/systemctl" <<'EOF'
#!/bin/bash
test "$*" = 'enable postfix@-.service'
printf 'systemctl:%s\n' "$*" >> "$FIXTURE_LOG"
EOF
cat > "$fixture/bin/postfix" <<'EOF'
#!/bin/bash
echo 'postfix must not be started' >&2
exit 99
EOF
chmod +x "$fixture/bin/"*

python3 - "$fixture/listener-ready" <<'PY' &
import pathlib
import socket
import sys
import time

listener = socket.socket()
listener.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
listener.bind(("127.0.0.1", 25))
listener.listen()
pathlib.Path(sys.argv[1]).touch()
while True:
    time.sleep(1)
PY
listener_pid=$!

for unused in {1..50}; do
    [[ -e "$fixture/listener-ready" ]] && break
    sleep 0.1
done
test -e "$fixture/listener-ready"

PATH="$fixture/bin:/usr/bin:/bin" HOSTNAME=tkldev-fixture "$script"

kill -0 "$listener_pid"
python3 - <<'PY'
import socket

with socket.create_connection(("127.0.0.1", 25), timeout=2):
    pass
PY

grep -qx 'postmulti:-p check' "$FIXTURE_LOG"
grep -qx 'systemctl:enable postfix@-.service' "$FIXTURE_LOG"
test "$(grep -c '^postmulti:' "$FIXTURE_LOG")" -eq 1
