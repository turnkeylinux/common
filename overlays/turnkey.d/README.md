Common TurnKey overlays
=======================

These overlays will be applied to all TurnKey appliances.

Architechture family specific overlays
--------------------------------------

Architecture family specific overlays can be put in a relevant
subdirectory here.

Supported architechture families are:
- x86 (amd64 aka x86_64)
- arm (arm64 aka aarch64)

E.g. to add a new /etc/some-app/amd64-only.conf overlay that should only be
added to amd64 builds:

```
cd common
mkdir -p overlays/turnkey.d/x86.d/etc/some-app
cat > overlays/turnkey.d/x86.d/etc/some-app/amd64-only.conf <<EOF
# config only for amd64 builds
#
# ...
EOF
```
