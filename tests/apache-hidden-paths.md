# Apache hidden-path integration regression

Run on a disposable appliance with the candidate shared security configuration.
Use a dedicated HTTP virtual host and document root, with `AllowOverride None`
and `Require all granted`. Add a matching `<Location />` containing
`Require all granted` to exercise application route authorization precedence.

Create harmless fixtures in that document root:

| File | Content |
| --- | --- |
| `public.txt` | `PUBLIC` |
| `.env` | `SECRET` |
| `.git/config` | `SECRET` |
| `.well-known/acme-challenge/probe` | `CHALLENGE` |
| `.well-known/.private` | `SECRET` |
| `.well-known/.git/config` | `SECRET` |
| `route.php` | `<?php echo "ROUTED:" . $_SERVER["PATH_INFO"];` |

Add `Alias /aliased-private /path/to/document-root/.git` inside the virtual
host. Run `apache2ctl configtest` and reload Apache. From an independent client,
verify these responses and that none contains the fixture secret:

| Request | Expected result |
| --- | --- |
| `/public.txt` | 200, `PUBLIC` |
| `/.env`, `/%2eenv` | 403 |
| `/.git/config`, `/aliased-private/config` | 403 |
| `/.well-known/acme-challenge/probe` | 200, `CHALLENGE` |
| `/.well-known/.private`, `/.well-known/.git/config` | 403 |
| `/route.php/dav/uploads/admin/id/.file` | 200, matching `ROUTED:` path |
| `/route.php/dav/files/admin/.hidden/test` | 200, matching `ROUTED:` path |

Repeat against the appliance's actual routes. For Nextcloud, upload a file
larger than one chunk, complete the final MOVE, download it and compare its
digest. Also create and read a legitimate dotfile and dotdirectory through
WebDAV, and confirm physical application configuration remains inaccessible.
The synthetic route establishes Apache's boundary; the real application
establishes upload integration. Remove the disposable virtual host and fixtures
after retaining the results.
