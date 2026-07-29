# Gallery Admin

A tiny local tool to manage the photos on your **Gallery** page —
upload, drag-to-reorder, caption, and delete. No dependencies, no build.

## Run it

From the site folder:

    python3 gallery-admin/server.py

Then open:

    http://localhost:4321/admin

Stop the server with **Ctrl+C** in the terminal.

## How it works

- Photos live in `images/photography/`.
- Your order + captions are saved to `images/photography/manifest.json`.
- The public gallery (`photography.html`) reads that manifest — ordered,
  with captions. If there's no manifest, it falls back to auto-detecting
  any images in the folder.

## Publishing

The gallery is still a static site. After you upload/arrange photos, just
commit `images/photography/` (the images **and** `manifest.json`) and deploy
as usual — the live site will show exactly what you arranged.

The `manifest.json` is fetched over HTTP, so it works on the deployed site.
When opening `photography.html` directly from disk (double-click, `file://`),
the browser may block that fetch and fall back to auto-detection — that's
expected; it looks correct once served (locally via this tool, or deployed).
