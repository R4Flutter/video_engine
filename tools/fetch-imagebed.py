"""script.json + voice.json -> the image bed under the whole vox film.

    python tools/fetch-imagebed.py [--dry] [--slot S]

Port of the crime engine's fetch-imagebed.py, with the fetching removed:
**you supply the images.** The tool's job is the plan and the manifest — it
splits every beat into whole slots of ~3s from the narration word times (so
the picture changes on the clause), looks up the art-directed prompt for each
slot in image_prompts.py, prints every prompt so you can generate the pictures
yourself, and writes video/src/imagebed.json with only the slots whose image
actually exists on disk. Deleting an image is how you drop it from the bed;
dropping one into video/public/img/ adds it.

    --dry prints the whole plan — how many images, which slots, the exact
         prompts — and writes nothing. Run this first, make the images from
         the printed prompts, drop them in, then re-run without --dry.

The manifest prefers a transparent PNG (bed-2-1.png) over the JPG
(bed-2-1.jpg): the plates float over the paper background, so an opaque cream
rectangle is a render error. Generate with a transparent background, or
generate on solid cream and run tools/transparentize.py once.

Every slot in the vox bed is a user-supplied image; mockup-owned slots were
the old script's bank-app story and are disabled (see MOCKUP_SLOTS below).

Credits: a line per file in video/public/img/CREDITS.md
    `bed-2-1.png | Title | Artist | License | https://...`
is merged into video/src/credits.json (keyed by file, pruned by disk), so an
image you licensed stays attributable when you paste the description.

Idempotent: the manifest is rebuilt from disk every run, so re-running after a
script edit only changes what moved.
"""

import argparse
import json
import re
from pathlib import Path

from image_prompts import BED_STYLE, CURATED_FOR, PROMPTS

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "video/src/script.json"
VOICE = ROOT / "video/src/voice.json"
IMG = ROOT / "video/public/img"
MANIFEST = ROOT / "video/src/imagebed.json"
CREDITS = ROOT / "video/src/credits.json"
CREDITS_MD = IMG / "CREDITS.md"

SLOT = 3.0  # target seconds per image; the beat divides evenly into whole slots

# Slots whose picture is drawn by tools/app-mockup.py, not supplied. The
# mockups were the old script's bank-app slots; this script is story-led and
# every slot is user-supplied, so the set is empty. Re-enable per script by
# listing keys here (e.g. {"2-2", "3-1"}) — app-mockup.py still exists.
MOCKUP_SLOTS: set[str] = set()

# Words that describe the edit rather than the frame. Narration rarely has
# them, but a beat that quotes its own storyboard shouldn't draw a caption.
DIRECTION = re.compile(r"\b(camera|cuts?|zoom|caption|on-screen|title card)\b", re.I)


def proper_names(vo: str) -> set[str]:
    """Capitalised words that aren't sentence-initial — treated as real people.

    Over-removal is the safe direction: losing "Ohio" from a prompt costs a
    detail, keeping a victim's surname hands it to an image generator.
    """
    out: set[str] = set()
    for sentence in re.split(r"(?<=[.?!])\s+", vo):
        for token in sentence.split()[1:]:
            word = token.strip(".\"',;:!?()")
            if len(word) > 2 and word[0].isupper() and not word.isupper():
                out.add(word.lower())
    return out


def auto_prompt(clause: str, headline: str, named: set[str]) -> str | None:
    """The spoken clause, cleaned into something a diffusion model can draw.

    Fallback only: slots with a hand-written entry in image_prompts.py never
    reach this. The engine draws its own type, so bold text in the storyboard
    is stripped rather than risked into the picture.
    """
    clause = clause.replace("—", ", ").replace("–", ", ")
    clause = clause.encode("ascii", "ignore").decode()
    words = [
        w
        for w in clause.split()
        if w.strip(".\"',;:!?").lower() not in named and not DIRECTION.search(w)
    ]
    base = " ".join(words).strip(" .:,\"'")
    # A slot of "and every one of those" is four words of nothing. The beat's
    # on-screen headline is the concrete thing the beat is about, so it carries
    # the frame when the clause underneath it is connective tissue.
    if len(base) < 24 and headline:
        base = f"{headline.lower()}, {base}".strip(" ,")
    if len(base) < 12:
        return None
    return f"{base[:220]}, {BED_STYLE}"


def slots(start: float, end: float, target: float) -> list[tuple[float, float]]:
    """Split a beat into whole slots of roughly `target` seconds, never fewer
    than one. Even division keeps the cut on the beat, so an image never
    changes one frame before a page turn."""
    n = max(1, round((end - start) / target))
    step = (end - start) / n
    return [(start + i * step, start + (i + 1) * step) for i in range(n)]


def plan(script: dict, voice: dict, target: float, curated_ok: bool) -> list[dict]:
    """The whole bed: one entry per slot, with the words spoken over it."""
    takes = {b["n"]: b for b in voice.get("beats", [])}
    out: list[dict] = []
    for beat in script["beats"]:
        named = proper_names(beat.get("vo", ""))
        words = takes.get(beat["n"], {}).get("words", [])
        for i, (a, b) in enumerate(slots(beat["start"], beat["end"], target), 1):
            key = f"{beat['n']}-{i}"
            # Word times in voice.json are relative to the beat's own start.
            said = " ".join(
                w["w"]
                for w in words
                if a <= beat["start"] + (w["start"] + w["end"]) / 2 < b
            )
            if key in MOCKUP_SLOTS:
                text = None
                file = f"footage/mockup-{beat['n']}.png"
            else:
                curated = PROMPTS.get(key) if curated_ok else None
                text = curated or auto_prompt(said or beat.get("vo", ""), beat.get("text", ""), named)
                if text is None:
                    continue
                file = f"img/bed-{key}.jpg"
            out.append(
                {
                    "key": key,
                    "start": round(a, 3),
                    "end": round(b, 3),
                    "file": file,
                    "prompt": text,
                }
            )
    return out


def rebuild_credits(live_files: set[str]) -> None:
    """Merge video/public/img/CREDITS.md into credits.json, pruned by disk.

    Keyed by filename so a deleted image drops its credit on the next run and
    re-adding an image does not resurrect the old attribution.
    """
    if not CREDITS_MD.exists():
        return
    entries: list[dict] = []
    for line in CREDITS_MD.read_text(encoding="utf8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 4:
            continue
        entries.append(
            {
                "file": parts[0],
                "title": parts[1],
                "artist": parts[2],
                "license": parts[3],
                "source": parts[4] if len(parts) > 4 else "",
            }
        )
    by_file = {e["file"]: e for e in entries}
    prior = {}
    if CREDITS.exists():
        try:
            prior = {c["file"]: c for c in json.loads(CREDITS.read_text(encoding="utf8"))}
        except (ValueError, KeyError):
            prior = {}
    by_file.update({f: c for f, c in prior.items() if f in live_files and f not in by_file})
    live = [c for f, c in sorted(by_file.items()) if f in live_files]
    CREDITS.write_text(json.dumps(live, indent=2) + "\n", encoding="utf8")
    if live:
        print(f"{CREDITS.name} - {len(live)} asset(s) to credit. Paste these into the")
        print("  video description before publishing.")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true", help="print the plan, write nothing")
    ap.add_argument("--slot", type=float, default=SLOT, help="target seconds per image")
    args = ap.parse_args()

    script = json.loads(SCRIPT.read_text(encoding="utf8"))
    voice = json.loads(VOICE.read_text(encoding="utf8")) if VOICE.exists() else {}
    # The curated prompt table is one video's art direction, keyed by that
    # video's slot numbers. Applying it to another script is the wrong picture
    # with no error — so it only unlocks for the script it was written against.
    curated_ok = Path(script.get("source", "")).name == CURATED_FOR
    if not curated_ok and PROMPTS:
        print(
            f"curated prompts are for {CURATED_FOR}; this is "
            f"{Path(script.get('source', '?')).name} - using clause-derived prompts"
        )

    shots = plan(script, voice, args.slot, curated_ok)

    if args.dry:
        for s in shots:
            how = "mockup (app-mockup.py)" if s["prompt"] is None else "you supply"
            print(f"  {s['key']:<5} {s['start']:>6.2f}-{s['end']:>6.2f}s  [{how}]")
            if s["prompt"]:
                print(f"         {s['prompt'][:110]}")
        mock = sum(1 for s in shots if s["prompt"] is None)
        print(f"\n{len(shots)} slots across {script['durationInSeconds']:.0f}s: "
              f"{len(shots) - mock} image(s) to supply, {mock} drawn by the mockup tool")
        print(f"  make them at {IMG}/ (e.g. {shots[0]['file']}), then re-run without --dry")
        return

    IMG.mkdir(parents=True, exist_ok=True)

    def pick(s: dict) -> dict:
        """Prefer a transparent PNG on disk; fall back to the JPG."""
        f = s["file"]
        alt = ROOT / "video/public" / (f[:-4] + ".png") if f.endswith(".jpg") else None
        if alt and alt.exists():
            return {**s, "file": f[:-4] + ".png"}
        return s

    # Rebuilt from disk, so deleting an image is how you drop it from the bed,
    # and a slot without a file never makes it into the manifest.
    have = [
        {k: s[k] for k in ("start", "end", "file")}
        for s in (pick(x) for x in shots)
        if (ROOT / "video/public" / s["file"]).exists()
    ]
    MANIFEST.write_text(json.dumps(have, indent=1) + "\n", encoding="utf8")
    print(f"\n{MANIFEST.name} - {len(have)}/{len(shots)} slots have imagery")

    missing = [s for s in shots if not (ROOT / "video/public" / pick(s)["file"]).exists()]
    if missing:
        print(f"  missing {len(missing)} - generate these from the prompts above:")
        for s in missing:
            print(f"    {s['key']:<5} {pick(s)['file']}")

    live = {pick(s)["file"] for s in shots}
    rebuild_credits(live)
    print("  review video/public/img/ before rendering: no faces, no text baked in")


if __name__ == "__main__":
    main()