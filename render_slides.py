#!/usr/bin/env python3
# Render each deck slide to a standalone 1280x720 HTML, then Chrome-headless screenshots them.
import os, re, subprocess
BASE=os.path.dirname(os.path.abspath(__file__))
SRC=os.path.join(BASE,"labyrinth-project.html")
OUT=os.path.join(BASE,"images","product","slides")
os.makedirs(OUT, exist_ok=True)
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

html=open(SRC).read()
style=re.search(r"<style>(.*?)</style>", html, re.S).group(1)
slides=re.findall(r'(<section class="slide.*?</section>)', html, re.S)
print("found", len(slides), "slides")

wrapper="""<!DOCTYPE html><html><head><meta charset="UTF-8">
<base href="file://{base}/">
<style>
html,body{{margin:0;padding:0;background:#33333a;}}
{style}
/* export: fixed slide size, no deck chrome */
.deck{{gap:0}}
.slide{{width:1280px !important;height:720px !important;box-shadow:none !important;margin:0 !important}}
.bar{{display:none !important}}
/* demo slide: show poster, not the iframe */
.demo-frame{{display:none !important}}
.demo-print{{display:block !important}}
.demo-hint{{display:none !important}}
</style></head><body><div class="deck">{slide}</div></body></html>"""

paths=[]
for i,sl in enumerate(slides,1):
    # in export, swap iframe demo for the poster img if a demo-print exists
    p=os.path.join("/tmp",f"lab_slide{i}.html")
    open(p,"w").write(wrapper.format(base=BASE, style=style, slide=sl))
    outpng=os.path.join(OUT,f"slide{i}.png")
    subprocess.run([CHROME,"--headless=new","--disable-gpu","--hide-scrollbars",
        "--force-device-scale-factor=2","--window-size=1280,720",
        f"--screenshot={outpng}", "file://"+p],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    paths.append(outpng)
    print("rendered", os.path.basename(outpng), os.path.exists(outpng))
print("done")
