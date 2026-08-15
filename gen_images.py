#!/usr/bin/env python3
"""
Generate all Labyrinth product images with one command.

Setup (once):
    export OPENAI_API_KEY="sk-..."          # your key with image access

Run:
    python3 gen_images.py                    # generates every shot into images/product/
    python3 gen_images.py hero context       # only the named shots

Uses OpenAI's gpt-image-1. No extra packages needed (uses urllib).
Swap the STYLE / SHOTS text to retarget any other image API or Midjourney.
"""
import os, sys, json, base64, urllib.request

API_KEY = os.environ.get("OPENAI_API_KEY")
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "images", "product")

STYLE = (
    "Minimalist premium product photography of a palm-sized flying-saucer / lens-shaped desk object, "
    "Ø140 x 24 mm matte white ceramic, a smooth convex disc with a rounded bulging edge (full bull-nose, "
    "like a smooth pebble or UFO) and no sharp corners anywhere. "
    # --- the spiral, defined hard so it does NOT become concentric rings ---
    "Engraved into the gently domed top face is ONE single continuous unbroken spiral line, like a "
    "fingerprint or a classic labyrinth: it starts at one point on the outer edge and winds inward in a "
    "single connected path, gradually approaching the center, and finally flows into a small round dish at "
    "the very center. It is exactly one continuous groove from edge to center, NOT concentric circles, NOT "
    "separate rings, NOT a target, NOT a bullseye - a single spiraling channel (U-shaped, ~14 mm wide, "
    "5 mm deep, sized to a fingertip), its outer entry fading in from the surface. "
    # --- the light: WARM light band ---
    "A soft WARM amber-white light band glows continuously from inside the whole groove, like a warm "
    "light tube recessed in the channel - a gentle, low, cozy warm glow (candle / amber, color ~2200-2700K), "
    "not blue, not cyan, not cold. "
    "Warm off-white seamless background, soft studio lighting, one gentle shadow, calm and serene, lots "
    "of negative space, ultra-detailed, photorealistic, 8k. "
    "No text, no logos, no visible buttons or LEDs, no concentric rings, no bullseye pattern."
)

# name -> (prompt, size)   sizes: 1024x1024 | 1536x1024 (landscape) | 1024x1536 (portrait)
SHOTS = {
    "hero":     ("Three-quarter hero view, the warm amber glow tracing the single spiral inward to the center dish, generous empty space above for a title.", "1536x1024"),
    "topdown":  ("Perfectly top-down, showing clearly that it is ONE continuous spiral line winding from the outer edge into the center dish (like a fingerprint), the warm light glowing along the whole single path.", "1024x1024"),
    "hand":     ("Close-up of a calm index finger resting inside the groove mid-trace, the warm glow just ahead of the fingertip, very shallow depth of field.", "1024x1536"),
    "context":  ("On a minimal light-wood executive desk beside a closed laptop and a notebook, soft window light, a blurred bright office behind, the warm groove glow visible.", "1536x1024"),
    "macro":    ("Extreme macro of the U-shaped groove cross-section and the continuous warm light band inside it, showing the satin ceramic surface and rounded edges.", "1536x1024"),
    "variants": ("Three versions side by side on seamless light grey: matte white ceramic, dark graphite aluminium, honed pale stone, each with the same single warm-glowing spiral.", "1536x1024"),
    "inhand":   ("Held in an open palm to show its palm-sized scale, soft daylight, neutral background, warm groove glow.", "1024x1024"),
    "exploded": ("Technical exploded view: the disc separated vertically into a clean stack of parallel layers evenly spaced along one shared vertical axis, hovering with soft shadows and thin faint guide lines. From top to bottom: (1) the domed white-ceramic top plate with the single engraved spiral groove and center dish; (2) a frosted light-diffuser ring; (3) a ring of tiny warm LEDs on a slim circular board; (4) a thin warming layer; (5) a small central controller board with a coin battery; (6) the hollowed ceramic base; (7) a soft silicone foot ring with a recessed USB-C power contact. Every part fully rounded, satin white ceramic and pale grey components.", "1536x1024"),
}


def generate(name, prompt, size):
    body = json.dumps({
        "model": "gpt-image-1",
        "prompt": STYLE + " " + prompt,
        "size": size,
        "n": 1,
    }).encode()
    req = urllib.request.Request(
        "https://api.openai.com/v1/images/generations",
        data=body,
        headers={"Authorization": "Bearer " + API_KEY, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as r:
        data = json.load(r)
    img = base64.b64decode(data["data"][0]["b64_json"])
    path = os.path.join(OUT_DIR, name + ".png")
    with open(path, "wb") as f:
        f.write(img)
    print("  saved", os.path.relpath(path))


if __name__ == "__main__":
    if not API_KEY:
        sys.exit("Set OPENAI_API_KEY first:  export OPENAI_API_KEY=\"sk-...\"")
    os.makedirs(OUT_DIR, exist_ok=True)
    wanted = sys.argv[1:] or list(SHOTS.keys())
    for name in wanted:
        if name not in SHOTS:
            print("  ? unknown shot:", name, "(options:", ", ".join(SHOTS), ")"); continue
        print("Generating", name, "...")
        try:
            generate(name, *SHOTS[name])
        except Exception as e:
            print("  ! failed:", e)
    print("Done →", os.path.relpath(OUT_DIR))
