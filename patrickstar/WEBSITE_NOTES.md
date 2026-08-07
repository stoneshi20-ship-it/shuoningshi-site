# Patrick Star — Project Website: Handoff Notes

Hand this file (and the path below) to any new Claude window so it can update the site consistently.

## File
- **The whole site is ONE self-contained file:** `~/Desktop/Patrick Star Toolbox/index.html`
  (all CSS + HTML + JS inline — no build step, no external assets except `assets/intro.mp4` and the `tools/` apps).
- **Preview:** `open "/Users/stoneshi/Desktop/Patrick Star Toolbox/index.html"`. It's a `file://` page; Safari may cache — hard-refresh with **Cmd+Shift+R**, or open with a cache-buster: `open "file:///Users/stoneshi/Desktop/Patrick%20Star%20Toolbox/index.html?fresh=$(date +%s)"`.
- After editing, validate: `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('index.html').read()); print('ok')"`.

## Visual style (match the deck)
- White background; **blue accent `--blue:#2e8bff`** for section headers (`.sec`), links, timeline.
- Text `--text:#1d1d1f`, gray `--gray:#86868b`, faint `--faint:#aeaeb2`, hairline `--hair:#e6e6e8`.
- Font: Helvetica Neue / -apple-system. Sticky nav reads **"Human Engineering | Patrick Star | Final Project"**. Footer has the Apple logo + "Apple Confidential / Preliminary, Subject to Change".
- Section pattern: `<div class="sec">Title</div>` (blue), then `<p class="lead">…</p>`, then content. Sub-labels use `<p class="subh">…</p>`.

## Section order (each is `<section id="…">`, and the nav links to them)
`hero` (intro video → research question) → `overview` → `study` (phase bar, RPE scale, participants) → `equipment` → `tools` (cards open apps in the `#ov` iframe overlay) → `numbers` ("At a Glance" rings + big numbers) → `results` (8-PT temperature table) → `findings` (split **Temperature** / **Fit & wearing**) → `next` ("Next Steps": ongoing + improvements, split Temperature/Fit) → `timeline` (date-driven progress bar) → footer.
Nav order must include all of these; add new sections to the `<nav>` link list too.

## Data / content rules
- **N = 8** participants (target 20). Temp table (Results) has 8 rows: MD105366, MD112502, MD146757, MD160880, MD121815, MD153340, MD767528, MD179539 — columns Room BL / PT BL / Cardio / Weight-lifting / Recovery (°F).
- **"At a Glance" = ONLY experimental/measured/observed data**, never design-set parameters. (e.g. 50/50 gender is a recruitment *target*, NOT a finding — do not put it here.) Current cards: rings 4/8 fell, 2/8 wouldn't reuse; big numbers 73°F room, +7°F donning, 89°F peak (85–94).
- Terminology: the **website says "AirPods Max"**; the separate PPTX deck (`~/Desktop/HE_B515_Presentation_7min.pptx`) says **"B515"** (codename). Keep each consistent with itself.
- Temperature numbers come from the thermocouple analyzer (`tools/thermo_analyzer.html`), aligned per participant. If temps change, update the Results table AND the At-a-Glance numbers.

## Tools section
- Cards (`.tool` buttons) open `tools/…` apps inside the `#ov` iframe overlay. The canonical thermo analyzer lives at `~/Desktop/Claude/Data Analysis/thermo_analyzer.html`; the copy in `tools/` is re-synced from it (with a `tbx-unify` style injected to hide the tool's own header).

## Coordination (important)
- **Don't edit `index.html` from two windows at the same time** — last save wins and can clobber the other's changes. Do website edits in one window at a time.
