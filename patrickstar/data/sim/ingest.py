#!/usr/bin/env python3
"""
Simulated participant data — ingest script (Patrick Star tools).

Rebuilds   patrickstar/data/sim/participants/<ID>/…   and   manifest.json
from a "PT Info" folder laid out like the study data:

    PT Info/
      MD112502/
        MD112502.csv                 ← thermocouple logger export (Run 1..N columns)
        MD112502_Tagger/*.json       ← Tagger session log (pre_trials.time_series)
      MD212786/ …

Usage (from anywhere):
    python3 patrickstar/data/sim/ingest.py "/path/to/PT Info"

What it writes, per participant:
    participants/<ID>/<ID>.csv            copied as-is (Thermocouple Analyzer input)
    participants/<ID>/<ID>_tagger.json    copied as-is (Thermocouple Analyzer input)
    manifest.json                         list of participants (date, exercise order, RPE,
                                          adjustments, session length) + photo set config

Photos (Face Blur) are NOT touched by this script — see README.md.
After running: review `git status`, then commit + push as usual.
"""
import glob, json, os, shutil, sys
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "participants")
MANIFEST = os.path.join(HERE, "manifest.json")


class Session:
    def __init__(self, path):
        obj = json.load(open(path))
        pt = obj["pre_trials"]
        self.obj = obj
        self.pairs = list(zip(pt["headers"], pt["responses"]))
        self.events = pt["time_series"]
        self.id = self.get("subject_id")

    def get(self, key):
        for k, v in self.pairs:
            if k.strip() == key:
                return v
        return None

    def t0(self):
        return float(self.events[0]["unix_timestamp"])

    def t_end(self):
        return float(self.events[-1]["unix_timestamp"])


def session_meta(sess):
    first = datetime.fromtimestamp(sess.t0())
    e1 = (sess.get("e1_type_of_exercise") or "").strip()
    e2 = (sess.get("e2_type_of_exercise") or "").strip()
    short = lambda s: "Weights" if s.lower().startswith("weight") else s
    def num(k):
        v = sess.get(k)
        try:
            return int(float(v))
        except (TypeError, ValueError):
            return None
    adj = sum(x for x in (num("wm_placement_adjustment"), num("e1_placement_adjustment"), num("e2_placement_adjustment")) if x is not None)
    return {
        "id": sess.id,
        "date": first.strftime("%Y-%m-%d"),
        "dateLabel": first.strftime("%b %-d, %Y"),
        "order": [short(e1), short(e2)],
        "rpe": {"warmup": num("wm_rpe"), "e1": num("e1_rpe"), "e2": num("e2_rpe"), "recovery": num("rc_rpe")},
        "adjustments": adj,
        "sessionMinutes": int(round((sess.t_end() - sess.t0()) / 60)),
    }


def main(src):
    src = os.path.abspath(src)
    dirs = sorted(d for d in glob.glob(os.path.join(src, "MD*")) if os.path.isdir(d))
    if not dirs:
        sys.exit(f"No MD* folders found in {src}")
    old = {}
    if os.path.exists(MANIFEST):
        try:
            old = json.load(open(MANIFEST))
        except Exception:
            old = {}
    participants = []
    for d in dirs:
        pid = os.path.basename(d)
        csv_path = os.path.join(d, pid + ".csv")
        tagger = sorted(glob.glob(os.path.join(d, "*_Tagger", "*.json")))
        if not os.path.exists(csv_path) or not tagger:
            print(f"  skip {pid}: missing csv or tagger json")
            continue
        sess = Session(tagger[-1])
        if sess.id != pid:
            print(f"  note {pid}: tagger subject_id is {sess.id}")
        meta = session_meta(sess)
        outdir = os.path.join(OUT, pid)
        os.makedirs(outdir, exist_ok=True)
        shutil.copyfile(csv_path, os.path.join(outdir, pid + ".csv"))
        shutil.copyfile(tagger[-1], os.path.join(outdir, pid + "_tagger.json"))
        meta["files"] = {
            "thermo": f"participants/{pid}/{pid}.csv",
            "tagger": f"participants/{pid}/{pid}_tagger.json",
        }
        participants.append(meta)
        print(f"  {pid}: {meta['sessionMinutes']} min session, order {meta['order']}")
    participants.sort(key=lambda m: m["date"])
    manifest = {
        "label": old.get("label", "Simulated data"),
        "note": old.get("note", "Simulated participant dataset for demonstration only — not study results."),
        "generated": datetime.now().strftime("%Y-%m-%d"),
        "photoSets": old.get("photoSets", []),
        "participants": participants,
    }
    json.dump(manifest, open(MANIFEST, "w"), indent=1)
    print(f"\nWrote {len(participants)} participants → {OUT}\nManifest → {MANIFEST}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
