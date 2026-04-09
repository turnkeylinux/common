Common TurnKey configuration scripts
====================================

These configuration scripts will be applied to all TurnKey appliances.

Architechture family specific conf scripts
------------------------------------------

Architecture family specific conf scripts can be put in a relevant
subdirectory here.

Supported architechture families are:
- x86 (amd64 aka x86_64)
- arm (arm64 aka aarch64)

E.g. to run a new 'amd64-only' configuration script on amd64 builds (only):

```
cd common
mkdir -p conf/turnkey.d/x86.d
cat > conf/turnkey.d/x86.d/amd64-only <<EOF
# configuration script only for amd64 builds
#
# ...
EOF
chmod +x conf/turnkey.d/x86.d/amd64-only
```
