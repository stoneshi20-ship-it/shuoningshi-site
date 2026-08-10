# Locking the Patrick Star project (real, server-side)

The in-page passcode (folder `patrickstar/`) is a **soft gate**: it stops casual clicks, and the
6-digit code is now stored only as a SHA-256 hash (not plaintext). But it is still client-side —
anyone who opens the tool/image files directly, or reads the source, can bypass it. For genuinely
confidential content, protect it at the **server / host** level. Pick whichever matches your host:

## Netlify
- Site → **Site configuration → Access & security → Visitor access → Password protection**
  (or per-branch). Set a site password. Nothing to commit.

## Cloudflare Pages / Access
- **Cloudflare Zero Trust → Access → Applications** → add a self-hosted app for
  `yoursite.com/patrickstar/*` → require a One-time PIN / email / password.

## Apache / cPanel / most shared hosting (.htaccess)
Files are already included in `patrickstar/`:
- `.htaccess` and `.htpasswd` (user **apple**, password **020416**).
- Edit `.htaccess` → set `AuthUserFile` to the **absolute server path** of `patrickstar/.htpasswd`.
- Change the password anytime: `htpasswd patrickstar/.htpasswd apple`

## Nginx
```
location /patrickstar/ {
    auth_basic "Protected project";
    auth_basic_user_file /abs/path/patrickstar/.htpasswd;
}
```

> If the site is served as pure static files with no server config (e.g. plain GitHub Pages),
> true password protection isn't possible — move the confidential build to a host from the list above,
> or publish only a redacted version.
