# Simulated participant data (Patrick Star tools)

Demo dataset behind the **Simulated data** button in Face Blur and the Thermocouple
Analyzer. Everything here is served as plain static files (works on
GitHub Pages) and is labelled "simulated / demo only" in the tools.

```
data/sim/
  manifest.json            list of participants + the photo set — read by simdata.js
  participants/<ID>/
    <ID>.csv               thermocouple logger export   → Thermocouple Analyzer
    <ID>_tagger.json       Tagger session log           → Thermocouple Analyzer
  photos/set-a/            front / back / left / right / top (1600 px, no EXIF) → Face Blur
  ingest.py                rebuilds participants/ + manifest.json from a "PT Info" folder
```

## Passcode

The button asks for the same 6-digit code as the Patrick Star page. The code is stored
only as a SHA-256 hash in `../tools/simdata.js` (`HASH`). To change it:

```
printf 'NEWCODE' | shasum -a 256        # macOS
```

paste the hash into `simdata.js` — and into `patrickstar/index.html` if you want the page
gate to match. The gate is client-side (it stops casual clicks; it is not real security).

## Adding / refreshing participants (semi-automatic publish)

1. Put the new participant folder in your local **PT Info** folder, same layout as the
   others (`MD######/MD######.csv` + `MD######_Tagger/*.json`).
2. From the site folder run:
   ```
   python3 patrickstar/data/sim/ingest.py "/Users/shuoningshi/Desktop/apple intern & website/Apple Intern/PT Info"
   ```
   It rewrites `participants/` and `manifest.json` (photo set config is kept).
3. `git add patrickstar/data/sim && git commit -m "sim data: add MD……" && git push`
   — the tools pick it up on the next page load.

The manifest row for each participant (date, exercise order, RPE, adjustments, session
length) is read from the Tagger log; it only feeds the picker list.

## Changing the photo set

Replace the five files in `photos/set-a/` (keep the names, keep them ~1600 px, strip EXIF —
`exiftool -all= file.jpg` or re-export from Preview) or add another set to
`manifest.json → photoSets` with the same `views` keys. The tools load the first set.
Only use photos you have consent to publish — this folder is public once pushed.
