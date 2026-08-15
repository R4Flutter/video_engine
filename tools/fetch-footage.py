"""script.json footage keywords -> archival imagery in video/public/footage/.

    set PIXABAY_API_KEY=...  &&  python tools/fetch-footage.py [--force]

or (the original backend)

    set PEXELS_API_KEY=...   &&  python tools/fetch-footage.py [--force]

Pixabay wins when both are set: its key is a query param, so it needs no header.
The Pixabay video API has no orientation filter, so the aspect match is done
here instead of by the server.

One asset per beat that asks for imagery, named beat-N.mp4 or beat-N.jpg, plus a
manifest at video/src/footage.json that the ArchivalBG component reads.
Idempotent: a beat whose asset is already on disk is skipped, so re-running after
a script edit only fetches what changed.

A `footage` beat wants motion and takes a still only if no clip matches; a
`doodle` beat wants a still, because a hand-drawn mark reads better over one.

Without a key this exits quietly and writes whatever is already downloaded — the
vox modules fall back to plain paper, so the episode still renders.

Free key: https://www.pexels.com/api/  (Pexels asks for a credit in the caption.)
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "video/src/script.json"
OUT = ROOT / "video/public/footage"
MANIFEST = ROOT / "video/src/footage.json"

VIDEO_API = "https://api.pexels.com/videos/search"
PHOTO_API = "https://api.pexels.com/v1/search"
# Pixabay keys are query params, not headers; same shape of response for both.
PIX_VIDEO_API = "https://pixabay.com/api/videos/"
PIX_PHOTO_API = "https://pixabay.com/api/"
# Which kind of asset each module wants, best first.
WANTS = {"footage": ("video", "photo"), "doodle": ("photo", "video")}


def get(url: str, key: str, params: dict):
    req = urllib.request.Request(
        f"{url}?" + urllib.parse.urlencode(params), headers={"Authorization": key}
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.load(res)


def pix_get(url: str, key: str, params: dict):
    params = dict(params, key=key, safesearch="true")
    req = urllib.request.Request(
        f"{url}?" + urllib.parse.urlencode(params),
        headers={"User-Agent": "Mozilla/5.0 (finance-stickman/1.0)"},
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.load(res)


def pix_video(query: str, key: str, portrait: bool, want_secs: float):
    """Pixabay has no orientation filter for video — pick the clip whose aspect
    matches the canvas and whose long edge sits closest to the target without
    going under it. The API serves a small set of pre-rendered sizes (large is
    ~1920 on the long edge for HD clips)."""
    hits = pix_get(
        PIX_VIDEO_API, key, {"q": query, "per_page": 15}
    ).get("hits", [])
    if not hits:
        return None
    target = 1920  # the long edge of either canvas
    hits.sort(key=lambda h: (h.get("duration", 0) < want_secs, -h.get("duration", 0)))
    for hit in hits:
        sizes = hit.get("videos") or {}
        files = [
            (f.get("width", 0), f.get("height", 0), f.get("url"))
            for f in sizes.values()
            if f and f.get("url")
        ]
        if not files:
            continue
        files.sort(
            key=lambda fw: (
                # wrong aspect first: a portrait clip on a 16:9 canvas crops hard
                fw[0] < fw[1] if portrait else fw[0] >= fw[1],
                max(fw[0], fw[1]) < target,
                abs(max(fw[0], fw[1]) - target),
            )
        )
        return files[0][2]
    return None


def pix_photo(query: str, key: str, portrait: bool):
    """The image API does take an orientation — but only horizontal/vertical,
    and a landscape photo already crops fine on a portrait canvas."""
    hits = pix_get(
        PIX_PHOTO_API,
        key,
        {
            "q": query,
            "image_type": "photo",
            "orientation": "vertical" if portrait else "horizontal",
            "per_page": 15,
        },
    ).get("hits", [])
    if not hits:
        return None
    # largeImageURL runs ~1920 on the long edge; webformat is a 640 fallback.
    for hit in hits:
        link = hit.get("largeImageURL") or hit.get("webformatURL")
        if link:
            return link
    return None


def search_video(query: str, key: str, portrait: bool, want_secs: float):
    """The best single clip for a keyword, or None. 'Best' is the file closest to
    the canvas without going under it — upscaled stock reads as mush."""
    videos = get(
        VIDEO_API,
        key,
        {
            "query": query,
            "orientation": "portrait" if portrait else "landscape",
            "per_page": 15,
            "size": "medium",
        },
    ).get("videos", [])
    if not videos:
        return None

    target = 1920 if portrait else 1080  # the long edge of the canvas
    # OffthreadVideo does not loop, so a clip shorter than its beat freezes on
    # its last frame. Long enough beats everything else; among those, longest
    # first, because the beat retimes when the read changes.
    videos.sort(key=lambda v: (v.get("duration", 0) < want_secs, -v.get("duration", 0)))
    for video in videos:
        files = [
            f
            for f in video.get("video_files", [])
            if f.get("file_type") == "video/mp4" and f.get("height")
        ]
        if not files:
            continue
        files.sort(
            key=lambda f: (
                max(f["width"], f["height"]) < target,
                abs(max(f["width"], f["height"]) - target),
            )
        )
        return files[0]["link"]
    return None


def search_photo(query: str, key: str, portrait: bool):
    """The best single still for a keyword, or None."""
    photos = get(
        PHOTO_API,
        key,
        {
            "query": query,
            "orientation": "portrait" if portrait else "landscape",
            "per_page": 15,
        },
    ).get("photos", [])
    target = 1920 if portrait else 1080
    photos.sort(key=lambda p: abs(max(p.get("width", 0), p.get("height", 0)) - target))
    for photo in photos:
        link = (photo.get("src") or {}).get("original")
        if link:
            return link
    return None


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="re-download clips that exist")
    args = ap.parse_args()

    script = json.loads(SCRIPT.read_text(encoding="utf8"))
    portrait = script["height"] >= script["width"]
    beats = [b for b in script["beats"] if b.get("module") in WANTS]
    OUT.mkdir(parents=True, exist_ok=True)
    key = os.environ.get("PEXELS_API_KEY", "").strip()
    pix_key = os.environ.get("PIXABAY_API_KEY", "").strip()
    backend = "pixabay" if pix_key else "pexels"

    if beats and not key and not pix_key:
        print("no PEXELS_API_KEY or PIXABAY_API_KEY set - skipping download.", file=sys.stderr)

    def existing(n: int):
        return next((p for p in (OUT / f"beat-{n}.mp4", OUT / f"beat-{n}.jpg") if p.exists()), None)

    for beat in beats:
        have = existing(beat["n"])
        if have and not args.force:
            print(f"  beat {beat['n']}  have {have.name}")
            continue
        if not key and not pix_key:
            continue
        # The script's own words are the fallback query, so a beat that forgot
        # its Footage row still gets something on screen.
        query = (
            beat.get("footage") or re.sub(r"[^\w\s]", " ", beat.get("visual", ""))[:80]
        ).strip()
        if not query:
            continue
        # Pixabay treats a comma list as one fuzzy phrase; the first keyword is
        # the one the beat was written around, so that is what it searches.
        pix_query = query.split(",")[0].strip()

        link, ext = None, None
        for kind in WANTS[beat["module"]]:
            try:
                if kind == "video":
                    link = (
                        pix_video(pix_query, pix_key, portrait, beat["end"] - beat["start"])
                        if backend == "pixabay"
                        else search_video(query, key, portrait, beat["end"] - beat["start"])
                    )
                else:
                    link = (
                        pix_photo(pix_query, pix_key, portrait)
                        if backend == "pixabay"
                        else search_photo(query, key, portrait)
                    )
            except urllib.error.HTTPError as err:
                print(
                    f"  beat {beat['n']}  {backend} {err.code} - {err.reason}",
                    file=sys.stderr,
                )
                break
            if link:
                ext = "mp4" if kind == "video" else "jpg"
                break
        if not link:
            print(f"  beat {beat['n']}  no match for {query!r}", file=sys.stderr)
            continue

        if have:  # --force, and the new asset may be the other kind
            have.unlink()
        dest = OUT / f"beat-{beat['n']}.{ext}"
        # Pixabay's CDN 403s urllib's default User-Agent; Pexels does not care.
        req = urllib.request.Request(
            link,
            headers={"User-Agent": "Mozilla/5.0 (finance-stickman/1.0)"},
        )
        with urllib.request.urlopen(req, timeout=120) as res, open(dest, "wb") as out:
            out.write(res.read())
        print(f"  beat {beat['n']}  {dest.name}  <- {query!r}")

    # Rebuilt from disk every run, so deleting an asset is how you drop it.
    manifest = {
        str(b["n"]): f"footage/{existing(b['n']).name}"
        for b in beats
        if existing(b["n"])
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf8")
    print(f"\n{MANIFEST.name} - {len(manifest)}/{len(beats)} beats have imagery")


if __name__ == "__main__":
    main()
