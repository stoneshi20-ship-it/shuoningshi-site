#!/usr/bin/env python3
# ============================================================
# Gallery admin — local, zero-dependency management server.
#
# Run:   python3 gallery-admin/server.py
# Then:  open http://localhost:4321/admin
#
# Lets you upload, reorder, caption, and delete photos.
# Everything is written to  images/photography/  and an ordered
# manifest.json that the public gallery (photography.html) reads.
# ============================================================

import json
import os
import re
import http.server
import socketserver
from urllib.parse import urlparse, parse_qs, unquote

PORT = 4321
HERE = os.path.dirname(os.path.abspath(__file__))
SITE_ROOT = os.path.abspath(os.path.join(HERE, ".."))
PHOTO_DIR = os.path.join(SITE_ROOT, "images", "photography")
MANIFEST = os.path.join(PHOTO_DIR, "manifest.json")

IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
MIME = {
    ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
    ".json": "application/json", ".svg": "image/svg+xml", ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
    ".gif": "image/gif", ".avif": "image/avif", ".ico": "image/x-icon",
}


def ensure_dir():
    os.makedirs(PHOTO_DIR, exist_ok=True)


def safe_name(name):
    """Keep only a safe basename — no path traversal."""
    name = os.path.basename(str(name or ""))
    return re.sub(r"[^\w.\-]", "_", name)


def list_image_files():
    ensure_dir()
    return sorted(
        f for f in os.listdir(PHOTO_DIR)
        if os.path.splitext(f)[1].lower() in IMG_EXTS
    )


def read_manifest():
    """Read manifest, then reconcile with what's actually on disk:
    drop entries whose file is gone, append new files found on disk."""
    entries = []
    try:
        with open(MANIFEST, "r", encoding="utf-8") as fh:
            raw = json.load(fh)
        if isinstance(raw, list):
            entries = raw
        elif isinstance(raw, dict) and isinstance(raw.get("photos"), list):
            entries = raw["photos"]
    except (FileNotFoundError, ValueError):
        pass

    on_disk = list_image_files()
    known, ordered = set(), []
    for e in entries:
        f = safe_name(e.get("file") if isinstance(e, dict) else e)
        if f and f in on_disk and f not in known:
            cap = e.get("caption", "") if isinstance(e, dict) else ""
            ordered.append({"file": f, "caption": cap or ""})
            known.add(f)
    for f in on_disk:
        if f not in known:
            ordered.append({"file": f, "caption": ""})
    return ordered


def write_manifest(entries):
    ensure_dir()
    clean = []
    for e in (entries or []):
        f = safe_name(e.get("file") if isinstance(e, dict) else e)
        if not f:
            continue
        cap = e.get("caption", "") if isinstance(e, dict) else ""
        clean.append({"file": f, "caption": cap or ""})
    with open(MANIFEST, "w", encoding="utf-8") as fh:
        json.dump(clean, fh, indent=2, ensure_ascii=False)
    return clean


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # keep the console quiet

    # ---- helpers ----
    def _json(self, code, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _body(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        return self.rfile.read(length) if length else b""

    def _serve_static(self, pathname):
        rel = unquote(pathname)
        if rel == "/":
            rel = "/index.html"
        file_path = os.path.abspath(os.path.join(SITE_ROOT, rel.lstrip("/")))
        if not file_path.startswith(SITE_ROOT):
            self.send_error(403, "Forbidden"); return
        if not os.path.isfile(file_path):
            self.send_error(404, "Not found"); return
        with open(file_path, "rb") as fh:
            data = fh.read()
        self.send_response(200)
        self.send_header("Content-Type", MIME.get(os.path.splitext(file_path)[1].lower(), "application/octet-stream"))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    # ---- routes ----
    def do_GET(self):
        parsed = urlparse(self.path)
        p = parsed.path
        if p in ("/admin", "/admin/"):
            return self._serve_static("/gallery-admin/admin.html")
        if p == "/api/photos":
            return self._json(200, {"photos": read_manifest()})
        return self._serve_static(p)

    def do_POST(self):
        parsed = urlparse(self.path)
        p = parsed.path
        q = parse_qs(parsed.query)

        if p == "/api/upload":
            name = safe_name((q.get("name") or [""])[0])
            if not name or os.path.splitext(name)[1].lower() not in IMG_EXTS:
                return self._json(400, {"error": "Invalid or unsupported filename."})
            data = self._body()
            if not data:
                return self._json(400, {"error": "Empty upload."})
            ensure_dir()
            base, ext = os.path.splitext(name)
            final, n = name, 1
            while os.path.exists(os.path.join(PHOTO_DIR, final)):
                final = "%s-%d%s" % (base, n, ext); n += 1
            with open(os.path.join(PHOTO_DIR, final), "wb") as fh:
                fh.write(data)
            return self._json(200, {"ok": True, "file": final})

        if p == "/api/save":
            try:
                payload = json.loads(self._body().decode("utf-8") or "[]")
            except ValueError:
                return self._json(400, {"error": "Invalid JSON."})
            entries = payload if isinstance(payload, list) else payload.get("photos")
            return self._json(200, {"ok": True, "photos": write_manifest(entries)})

        if p == "/api/delete":
            try:
                payload = json.loads(self._body().decode("utf-8") or "{}")
            except ValueError:
                payload = {}
            f = safe_name(payload.get("file"))
            target = os.path.join(PHOTO_DIR, f)
            if f and os.path.isfile(target):
                os.remove(target)
            manifest = [e for e in read_manifest() if e["file"] != f]
            write_manifest(manifest)
            return self._json(200, {"ok": True, "photos": manifest})

        self.send_error(404, "Not found")


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    ensure_dir()
    print("\n  Gallery admin running")
    print("  → Admin:  http://localhost:%d/admin" % PORT)
    print("  → Site:   http://localhost:%d/" % PORT)
    print("\n  Photos are stored in: %s" % PHOTO_DIR)
    print("  Stop with Ctrl+C.\n")
    with Server(("127.0.0.1", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  Stopped.\n")
