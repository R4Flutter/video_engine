"""Requirement-driven stock footage fetcher for the Vox/Remotion engine.

Reads the beat requirements already produced in ``video/src/script.json`` and
automatically sources B-roll from Pexels and/or Pixabay. Explicit
``footage_query`` / ``footage`` fields always win; otherwise the beat's visual,
reveal, VO, purpose and named entities are converted into several stock-search
queries.

The manifest is consumed by the Remotion renderer. No JSX or script editing is
required just to add B-roll: the renderer can place the selected clip behind
the authored beat module.

Usage:
    set PEXELS_API_KEY=...
    set PIXABAY_API_KEY=...
    python tools/fetch-footage.py

Existing downloads are kept unless --force is supplied. API responses are
cached for 24h under video/out/footage-cache.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Callable

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "video/src/script.json"
OUT = ROOT / "video/public/footage"
MANIFEST = ROOT / "video/src/footage.json"
CACHE = ROOT / "video/out/footage-cache"

PEXELS_VIDEO_API = "https://api.pexels.com/v1/videos/search"
PIXABAY_VIDEO_API = "https://pixabay.com/api/videos/"
CACHE_TTL = 24 * 60 * 60
TARGET_LONG_EDGE = 1920

GENERIC = {
    "the", "and", "then", "with", "onto", "page", "one", "two", "three",
    "hold", "still", "across", "words", "lands", "single", "big", "number",
    "card", "visual", "motion", "beats", "could", "have", "been", "would",
    "they", "them", "their", "that", "this", "from", "into", "over", "under",
    "while", "just", "back", "all", "more", "very", "it", "its", "of", "to",
    "a", "an", "is", "was", "were", "be", "in", "on", "for", "as", "at",
    "by", "or", "but", "so", "than", "did", "do", "does", "how", "why",
    "what", "who", "you", "we", "us", "our", "your", "company", "thing",
    "things", "frame", "module", "purpose", "reveal", "emotion", "question",
}

CONCEPTS = (
    (r"\bdigital camera\b", "digital camera"),
    (r"\bportable digital camera\b", "portable digital camera"),
    (r"\bfilm\b|\bfilm roll\b|\bprint\b", "35mm film photography"),
    (r"\bphotograph(?:y|ic)?\b", "photography"),
    (r"\bengineer\b|\bbuilt\b|\binvent(?:ed|ion)\b", "engineer laboratory"),
    (r"\bbankrupt(?:cy)?\b|\bchapter 11\b|\bdebt\b", "bankruptcy financial newspaper"),
    (r"\bcompetitors?\b|\bmarket\b|\bsony\b|\bcanon\b|\bfuji\b", "camera market competitors"),
    (r"\b1975\b", "1970s vintage technology"),
    (r"\b2012\b", "2012 business newspaper"),
    (r"\boffice\b", "corporate office"),
    (r"\bfactory\b", "industrial factory"),
)

NO_AUTO_FOOTAGE_PURPOSES = {"hook", "payoff"}
NO_AUTO_MODULES = {"kinetic"}


def request_json(url: str, *, headers: dict[str, str] | None = None) -> Any:
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.load(res)


def cached_json(cache_key: str, loader: Callable[[], Any]) -> Any:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / f"{hashlib.sha256(cache_key.encode()).hexdigest()}.json"
    if path.exists() and time.time() - path.stat().st_mtime < CACHE_TTL:
        return json.loads(path.read_text(encoding="utf8"))
    data = loader()
    path.write_text(json.dumps(data), encoding="utf8")
    return data


def clean_words(text: str) -> list[str]:
    words = re.findall(r"[A-Za-z0-9][A-Za-z0-9'-]+", text.lower())
    return [w.strip("-' ") for w in words if len(w.strip("-' ")) >= 3 and w not in GENERIC]


def concept_terms(text: str) -> list[str]:
    out: list[str] = []
    for pattern, replacement in CONCEPTS:
        if re.search(pattern, text, flags=re.IGNORECASE):
            out.extend(replacement.split())
    return out


def named_entities(text: str) -> list[str]:
    phrases = re.findall(r"\b(?:[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){0,2})\b", text)
    return [p for p in phrases if p.lower() not in {"the", "a"}]


def requirement_text(beat: dict[str, Any]) -> str:
    return " ".join(
        str(beat.get(k) or "")
        for k in ("name", "visual", "reveal", "vo", "question", "purpose", "emotion")
    ).strip()


def should_auto_fetch(beat: dict[str, Any]) -> bool:
    explicit = str(beat.get("footage_query") or beat.get("footage") or "").strip()
    if explicit or beat.get("module") == "footage":
        return True

    purpose = str(beat.get("purpose") or "").lower()
    module = str(beat.get("module") or "").lower()
    if purpose in NO_AUTO_FOOTAGE_PURPOSES or module in NO_AUTO_MODULES:
        return False

    visual = str(beat.get("visual") or "").lower()
    if any(x in visual for x in ("words land", "headline lands", "word card", "number slams")):
        return False

    return bool(requirement_text(beat))


def query_variants(beat: dict[str, Any]) -> list[str]:
    explicit = str(beat.get("footage_query") or beat.get("footage") or "").strip()
    source = explicit or requirement_text(beat)
    entities = named_entities(source)
    concepts = concept_terms(source)
    words = clean_words(source)

    primary: list[str] = []
    primary.extend(entities[:3])
    primary.extend(concepts[:5])
    for word in words:
        if word not in primary and len(primary) < 10:
            primary.append(word)

    def compact(items: list[str], n: int) -> str:
        return " ".join(items[:n]).strip()

    variants = [
        compact(primary, 9),
        compact(entities[:2] + concepts[:4] + words[:4], 8),
        compact(concepts[:5] + words[:5], 8),
    ]
    variants = [f"{q} documentary b-roll".strip() for q in variants if q]

    out: list[str] = []
    seen: set[str] = set()
    for q in variants:
        q = re.sub(r"\s+", " ", q).strip()
        if q and q not in seen:
            seen.add(q)
            out.append(q)
    return out[:3]


def choose_file(files: list[dict[str, Any]], *, portrait: bool, min_long_edge: int) -> dict[str, Any] | None:
    valid = [
        f for f in files
        if f.get("url") and int(f.get("width") or 0) and int(f.get("height") or 0)
    ]
    if not valid:
        return None

    def score(f: dict[str, Any]) -> tuple[int, int, int]:
        width = int(f["width"])
        height = int(f["height"])
        long_edge = max(width, height)
        orientation_penalty = 0 if (height > width) == portrait else 1
        resolution_penalty = 0 if long_edge >= min_long_edge else 1
        distance = abs(long_edge - min_long_edge)
        return orientation_penalty, resolution_penalty, distance

    return sorted(valid, key=score)[0]


def pexels_search(query: str, key: str, *, portrait: bool) -> list[dict[str, Any]]:
    params = urllib.parse.urlencode({
        "query": query,
        "orientation": "portrait" if portrait else "landscape",
        "size": "large",
        "per_page": 20,
    })
    url = f"{PEXELS_VIDEO_API}?{params}"
    data = cached_json(f"pexels:{url}", lambda: request_json(url, headers={"Authorization": key}))
    results: list[dict[str, Any]] = []
    for video in data.get("videos", []):
        files = [
            {"url": f.get("link"), "width": f.get("width"), "height": f.get("height"), "quality": f.get("quality")}
            for f in video.get("video_files", [])
            if f.get("file_type") == "video/mp4"
        ]
        chosen = choose_file(files, portrait=portrait, min_long_edge=TARGET_LONG_EDGE)
        if chosen:
            results.append({
                "provider": "pexels",
                "id": video.get("id"),
                "source_url": video.get("url"),
                "creator": (video.get("user") or {}).get("name"),
                "duration": float(video.get("duration") or 0),
                "file": chosen,
                "tags": "",
            })
    return results


def pixabay_search(query: str, key: str, *, portrait: bool) -> list[dict[str, Any]]:
    params = urllib.parse.urlencode({
        "key": key,
        "q": query,
        "video_type": "film",
        "safesearch": "true",
        "order": "popular",
        "per_page": 20,
        "min_width": 720,
        "min_height": 720,
    })
    url = f"{PIXABAY_VIDEO_API}?{params}"
    data = cached_json(f"pixabay:{url}", lambda: request_json(url, headers={"User-Agent": "video-engine/1.1"}))
    results: list[dict[str, Any]] = []
    for hit in data.get("hits", []):
        files = [
            {"url": rendition.get("url"), "width": rendition.get("width"), "height": rendition.get("height")}
            for rendition in (hit.get("videos") or {}).values()
            if rendition.get("url")
        ]
        chosen = choose_file(files, portrait=portrait, min_long_edge=TARGET_LONG_EDGE)
        if chosen:
            results.append({
                "provider": "pixabay",
                "id": hit.get("id"),
                "source_url": hit.get("pageURL"),
                "creator": hit.get("user"),
                "duration": float(hit.get("duration") or 0),
                "file": chosen,
                "tags": str(hit.get("tags") or ""),
            })
    return results


def token_score(item: dict[str, Any], query: str) -> float:
    haystack = " ".join(str(item.get(k) or "") for k in ("source_url", "creator", "tags")).lower()
    tokens = set(clean_words(query))
    if not tokens:
        return 0.0
    return sum(1 for token in tokens if token in haystack) / len(tokens)


def candidate_score(item: dict[str, Any], *, query: str, want_secs: float, portrait: bool, used_ids: set[tuple[str, Any]]) -> tuple:
    f = item["file"]
    width, height = int(f["width"]), int(f["height"])
    long_edge = max(width, height)
    orientation_penalty = 0 if (height > width) == portrait else 1
    duration = float(item.get("duration") or 0)
    duration_penalty = 0 if duration >= want_secs else 1
    duration_gap = abs(duration - want_secs)
    resolution_penalty = 0 if long_edge >= TARGET_LONG_EDGE else 1
    duplicate_penalty = 1 if (item["provider"], item["id"]) in used_ids else 0
    relevance = token_score(item, query)
    return (orientation_penalty, duration_penalty, resolution_penalty, duplicate_penalty, -relevance, duration_gap, -long_edge)


def download(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "video-engine/1.1"})
    with urllib.request.urlopen(req, timeout=180) as res, dest.open("wb") as out:
        while True:
            chunk = res.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk)


def existing_asset(beat_no: int) -> Path | None:
    for ext in ("mp4", "webm", "mov"):
        path = OUT / f"beat-{beat_no:02d}.{ext}"
        if path.exists():
            return path
    return None


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch requirement-driven B-roll")
    parser.add_argument("--force", action="store_true", help="replace existing beat videos")
    args = parser.parse_args()

    script = json.loads(SCRIPT.read_text(encoding="utf8"))
    width, height = int(script["width"]), int(script["height"])
    portrait = height >= width
    beats = [b for b in script.get("beats", []) if should_auto_fetch(b)]

    pexels_key = os.environ.get("PEXELS_API_KEY", "").strip()
    pixabay_key = os.environ.get("PIXABAY_API_KEY", "").strip()
    if not pexels_key and not pixabay_key:
        print("No PEXELS_API_KEY or PIXABAY_API_KEY set; footage stage skipped.", file=sys.stderr)
        return

    OUT.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, Any] = {}
    used_ids: set[tuple[str, Any]] = set()

    for beat in beats:
        n = int(beat["n"])
        have = existing_asset(n)
        if have and not args.force:
            manifest[str(n)] = {
                "file": f"footage/{have.name}",
                "status": "existing",
                "start": float(beat.get("start", 0)),
                "end": float(beat.get("end", 0)),
                "requirement": requirement_text(beat),
            }
            print(f"  beat {n:02d}  existing {have.name}")
            continue

        queries = query_variants(beat)
        if not queries:
            print(f"  beat {n:02d}  no searchable requirement", file=sys.stderr)
            continue

        want_secs = max(0.5, float(beat.get("end", 0)) - float(beat.get("start", 0)))
        candidates: list[dict[str, Any]] = []
        for query in queries:
            if pexels_key:
                try:
                    candidates.extend(pexels_search(query, pexels_key, portrait=portrait))
                except urllib.error.HTTPError as err:
                    print(f"  beat {n:02d}  Pexels HTTP {err.code}", file=sys.stderr)
                except Exception as err:
                    print(f"  beat {n:02d}  Pexels error: {err}", file=sys.stderr)
            if pixabay_key:
                try:
                    candidates.extend(pixabay_search(query, pixabay_key, portrait=portrait))
                except urllib.error.HTTPError as err:
                    print(f"  beat {n:02d}  Pixabay HTTP {err.code}", file=sys.stderr)
                except Exception as err:
                    print(f"  beat {n:02d}  Pixabay error: {err}", file=sys.stderr)
            if len(candidates) >= 12:
                break

        deduped: dict[tuple[str, Any], dict[str, Any]] = {}
        for item in candidates:
            deduped.setdefault((item["provider"], item["id"]), item)
        candidates = list(deduped.values())

        if not candidates:
            print(f"  beat {n:02d}  no video match for {queries[0]!r}", file=sys.stderr)
            continue

        best = sorted(
            candidates,
            key=lambda item: candidate_score(item, query=queries[0], want_secs=want_secs, portrait=portrait, used_ids=used_ids),
        )[0]
        used_ids.add((best["provider"], best["id"]))

        if have:
            have.unlink()

        dest = OUT / f"beat-{n:02d}.mp4"
        try:
            download(best["file"]["url"], dest)
        except Exception as err:
            print(f"  beat {n:02d}  download failed: {err}", file=sys.stderr)
            continue

        manifest[str(n)] = {
            "file": f"footage/{dest.name}",
            "provider": best["provider"],
            "asset_id": best["id"],
            "source_url": best["source_url"],
            "creator": best["creator"],
            "query": queries[0],
            "query_variants": queries,
            "requirement": requirement_text(beat),
            "start": float(beat.get("start", 0)),
            "end": float(beat.get("end", 0)),
            "duration": best["duration"],
            "width": best["file"]["width"],
            "height": best["file"]["height"],
        }
        print(f"  beat {n:02d}  {dest.name} <- {best['provider']} <- {queries[0]!r}")

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf8")
    print(f"\nfootage.json — {len(manifest)} video assets")


if __name__ == "__main__":
    main()
