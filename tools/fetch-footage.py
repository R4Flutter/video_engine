"""Prompt-driven stock footage fetcher for the Vox/Remotion engine.

The prompt packs are the source of truth for B-roll. This tool reads
prompt/broll.md and prompts/broll-*.txt, extracts the shot subject/search intent
and beat timestamp, then searches BOTH Pexels and Pixabay and downloads the
best real motion clip. Script fields remain a fallback for beats without a
prompt-pack requirement.

Usage:
    set PEXELS_API_KEY=...
    set PIXABAY_API_KEY=...
    python tools/fetch-footage.py
    python tools/fetch-footage.py --force

API responses are cached for 24h under video/out/footage-cache.
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
PROMPT_DIRS = (ROOT / "prompt", ROOT / "prompts")

PEXELS_VIDEO_API = "https://api.pexels.com/v1/videos/search"
PIXABAY_VIDEO_API = "https://pixabay.com/api/videos/"
CACHE_TTL = 24 * 60 * 60
TARGET_LONG_EDGE = 1920

GENERIC = {
    "the", "and", "then", "with", "onto", "page", "one", "two", "three",
    "hold", "still", "across", "words", "single", "big", "number", "card",
    "visual", "motion", "beats", "could", "have", "been", "would", "they",
    "them", "their", "that", "this", "from", "into", "over", "under", "while",
    "just", "back", "all", "more", "very", "its", "of", "to", "a", "an", "is",
    "was", "were", "be", "in", "on", "for", "as", "at", "by", "or", "but", "so",
    "than", "did", "do", "does", "how", "why", "what", "who", "you", "we", "us",
    "our", "your", "company", "thing", "things", "frame", "module", "purpose",
    "reveal", "emotion", "question", "camera", "move", "style", "negative",
    "subject", "composition", "lighting", "detail", "mood", "prompt",
}

STOCK_STOP = {
    "paper-cut", "paper", "collage", "vector", "flat", "charcoal", "burnt-red",
    "cream", "deckle", "matte", "grain", "transparent", "background", "png",
    "photorealism", "photorealistic", "editorial", "soft", "shadow", "negative",
    "no", "faces", "face", "text", "numbers", "logos", "logo", "gradient",
    "frame", "edges", "field", "horizon", "safe", "zone", "opacity", "opacity",
}


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


def parse_time(value: str) -> float | None:
    match = re.search(r"(?<!\d)(\d{1,2}):(\d{2})(?!\d)", value)
    if not match:
        return None
    return int(match.group(1)) * 60 + int(match.group(2))


def clean_words(text: str) -> list[str]:
    words = re.findall(r"[A-Za-z0-9][A-Za-z0-9'-]+", text.lower())
    return [w.strip("-' ") for w in words if len(w.strip("-' ")) >= 3 and w not in GENERIC]


def stock_words(text: str) -> list[str]:
    return [w for w in clean_words(text) if w not in STOCK_STOP]


def parse_prompt_library() -> list[dict[str, Any]]:
    """Extract timestamped B-roll requirements from the prompt packs."""
    requirements: list[dict[str, Any]] = []

    broll_md = ROOT / "prompt/broll.md"
    if broll_md.exists():
        text = broll_md.read_text(encoding="utf8")
        for line in text.splitlines():
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) >= 4 and re.fullmatch(r"b\d+", cells[0], re.I):
                timestamp = parse_time(cells[1])
                if timestamp is not None and cells[2]:
                    requirements.append({
                        "beat_time": timestamp,
                        "query": cells[2],
                        "source": "prompt/broll.md",
                        "slot": cells[0],
                        "raw_prompt": cells[2],
                    })

    for directory in PROMPT_DIRS:
        if not directory.exists():
            continue
        for path in sorted(directory.glob("broll*.txt")):
            text = path.read_text(encoding="utf8")
            sections = re.split(r"(?=^PROMPT\s+\d+\s*\()", text, flags=re.MULTILINE)
            for section in sections:
                header = re.search(r"^PROMPT\s+(\d+)\s*\(([^)]*)\)", section, flags=re.MULTILINE)
                if not header:
                    continue
                timestamp = parse_time(header.group(2))
                if timestamp is None:
                    continue
                subject = re.search(r"^Subject:\s*(.+)$", section, flags=re.MULTILINE)
                composition = re.search(r"^Composition:\s*(.+)$", section, flags=re.MULTILINE)
                detail = re.search(r"^Detail:\s*(.+)$", section, flags=re.MULTILINE)
                query_parts = [x.group(1) for x in (subject, composition, detail) if x]
                raw_prompt = " ".join(query_parts).strip()
                if raw_prompt:
                    requirements.append({
                        "beat_time": timestamp,
                        "query": raw_prompt,
                        "source": str(path.relative_to(ROOT)).replace("\\", "/"),
                        "slot": f"prompt-{header.group(1)}",
                        "raw_prompt": raw_prompt,
                    })
    return requirements


def prompt_for_beat(beat: dict[str, Any], library: list[dict[str, Any]]) -> dict[str, Any] | None:
    start = float(beat.get("start", 0))
    if not library:
        return None
    exact = [r for r in library if abs(float(r["beat_time"]) - start) <= 0.75]
    if exact:
        # Prefer the concise stock-search intent from prompt/broll.md when both
        # the generic contract and an episode prompt describe the same beat.
        exact.sort(key=lambda r: (0 if r["source"] == "prompt/broll.md" else 1, len(r["query"])))
        return exact[0]
    nearest = min(library, key=lambda r: abs(float(r["beat_time"]) - start))
    return nearest if abs(float(nearest["beat_time"]) - start) <= 1.5 else None


def requirement_text(beat: dict[str, Any], prompt_req: dict[str, Any] | None = None) -> str:
    if prompt_req:
        return str(prompt_req["query"])
    explicit = str(beat.get("footage_query") or beat.get("footage") or "").strip()
    if explicit:
        return explicit
    return " ".join(str(beat.get(k) or "") for k in ("name", "visual", "reveal", "vo", "purpose", "emotion")).strip()


def should_auto_fetch(beat: dict[str, Any], prompt_req: dict[str, Any] | None) -> bool:
    # A real B-roll prompt is an explicit requirement and overrides the old
    # purpose-based exclusions (including hook/payoff).
    if prompt_req:
        return True
    explicit = str(beat.get("footage_query") or beat.get("footage") or "").strip()
    if explicit or beat.get("module") == "footage":
        return True
    purpose = str(beat.get("purpose") or "").lower()
    module = str(beat.get("module") or "").lower()
    if purpose in {"hook", "payoff"} or module == "kinetic":
        return False
    visual = str(beat.get("visual") or "").lower()
    if any(x in visual for x in ("words land", "headline lands", "word card", "number slams")):
        return False
    return bool(requirement_text(beat))


def query_variants(beat: dict[str, Any], prompt_req: dict[str, Any] | None) -> list[str]:
    source = requirement_text(beat, prompt_req)
    explicit = str(beat.get("footage_query") or beat.get("footage") or "").strip()

    if prompt_req and prompt_req["source"] == "prompt/broll.md":
        base = re.sub(r"\b(status-quo|mechanism|escalation|reveal|cut|use)\b", "", source, flags=re.I)
        return [re.sub(r"\s+", " ", f"{base.strip()} stock video").strip()]

    # Generation-style B-roll prompts contain lots of visual styling that stock
    # libraries cannot search. Keep the physical subject/action/context only.
    text = re.sub(r"^.*?Subject:\s*", "", source, flags=re.I)
    text = re.split(r"\b(?:Composition|Style|Lighting|Detail|Mood|Negative):", text, maxsplit=1, flags=re.I)[0]
    words = stock_words(text)
    concepts = []
    lower = text.lower()
    if "vintage" in lower or "1970s" in lower:
        concepts += ["vintage", "1970s"]
    if "laboratory" in lower or "lab" in lower:
        concepts += ["laboratory"]
    if "factory" in lower:
        concepts += ["factory"]
    if "bank vault" in lower:
        concepts += ["bank vault"]
    if "printing press" in lower:
        concepts += ["printing press"]
    if "newspaper" in lower:
        concepts += ["newspaper"]

    primary: list[str] = []
    for item in concepts + words:
        if item not in primary:
            primary.append(item)
    if explicit:
        primary = clean_words(explicit) + primary

    queries = [
        " ".join(primary[:8]),
        " ".join(primary[:5] + ["documentary", "stock", "video"]),
        " ".join(words[:6] + ["real", "footage"]),
    ]
    out: list[str] = []
    for q in queries:
        q = re.sub(r"\s+", " ", q).strip()
        if q and q not in out:
            out.append(q)
    return out[:3]


def choose_file(files: list[dict[str, Any]], *, portrait: bool, min_long_edge: int) -> dict[str, Any] | None:
    valid = [f for f in files if f.get("url") and int(f.get("width") or 0) and int(f.get("height") or 0)]
    if not valid:
        return None
    def score(f: dict[str, Any]) -> tuple[int, int, int]:
        width, height = int(f["width"]), int(f["height"])
        long_edge = max(width, height)
        orientation_penalty = 0 if (height > width) == portrait else 1
        resolution_penalty = 0 if long_edge >= min_long_edge else 1
        return orientation_penalty, resolution_penalty, abs(long_edge - min_long_edge)
    return sorted(valid, key=score)[0]


def pexels_search(query: str, key: str, *, portrait: bool) -> list[dict[str, Any]]:
    params = urllib.parse.urlencode({"query": query, "orientation": "portrait" if portrait else "landscape", "size": "large", "per_page": 40})
    url = f"{PEXELS_VIDEO_API}?{params}"
    data = cached_json(f"pexels:{url}", lambda: request_json(url, headers={"Authorization": key}))
    results: list[dict[str, Any]] = []
    for video in data.get("videos", []):
        files = [{"url": f.get("link"), "width": f.get("width"), "height": f.get("height")} for f in video.get("video_files", []) if f.get("file_type") == "video/mp4"]
        chosen = choose_file(files, portrait=portrait, min_long_edge=TARGET_LONG_EDGE)
        if chosen:
            results.append({"provider": "pexels", "id": video.get("id"), "source_url": video.get("url"), "creator": (video.get("user") or {}).get("name"), "duration": float(video.get("duration") or 0), "file": chosen, "tags": ""})
    return results


def pixabay_search(query: str, key: str, *, portrait: bool) -> list[dict[str, Any]]:
    params = urllib.parse.urlencode({"key": key, "q": query, "video_type": "film", "safesearch": "true", "order": "popular", "per_page": 40, "min_width": 720, "min_height": 720})
    url = f"{PIXABAY_VIDEO_API}?{params}"
    data = cached_json(f"pixabay:{url}", lambda: request_json(url, headers={"User-Agent": "video-engine/1.2"}))
    results: list[dict[str, Any]] = []
    for hit in data.get("hits", []):
        files = [{"url": r.get("url"), "width": r.get("width"), "height": r.get("height")} for r in (hit.get("videos") or {}).values() if r.get("url")]
        chosen = choose_file(files, portrait=portrait, min_long_edge=TARGET_LONG_EDGE)
        if chosen:
            results.append({"provider": "pixabay", "id": hit.get("id"), "source_url": hit.get("pageURL"), "creator": hit.get("user"), "duration": float(hit.get("duration") or 0), "file": chosen, "tags": str(hit.get("tags") or "")})
    return results


def token_score(item: dict[str, Any], query: str) -> float:
    haystack = " ".join(str(item.get(k) or "") for k in ("source_url", "creator", "tags")).lower()
    tokens = set(stock_words(query))
    return (sum(1 for token in tokens if token in haystack) / len(tokens)) if tokens else 0.0


def candidate_score(item: dict[str, Any], *, query: str, want_secs: float, portrait: bool, used_ids: set[tuple[str, Any]]) -> tuple:
    f = item["file"]
    width, height = int(f["width"]), int(f["height"])
    long_edge = max(width, height)
    orientation_penalty = 0 if (height > width) == portrait else 1
    duration = float(item.get("duration") or 0)
    duration_penalty = 0 if duration >= want_secs else 1
    resolution_penalty = 0 if long_edge >= TARGET_LONG_EDGE else 1
    duplicate_penalty = 1 if (item["provider"], item["id"]) in used_ids else 0
    relevance = token_score(item, query)
    # Relevance is intentionally before duration/resolution tie-breakers: a
    # semantically correct HD clip beats a gorgeous but unrelated 4K clip.
    return (orientation_penalty, duplicate_penalty, -relevance, duration_penalty, abs(duration - want_secs), resolution_penalty, -long_edge)


def download(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "video-engine/1.2"})
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
    parser = argparse.ArgumentParser(description="Fetch B-roll from Pexels/Pixabay using the prompt library")
    parser.add_argument("--force", action="store_true", help="replace existing beat videos")
    args = parser.parse_args()

    script = json.loads(SCRIPT.read_text(encoding="utf8"))
    width, height = int(script["width"]), int(script["height"])
    portrait = height >= width
    library = parse_prompt_library()
    beats = []
    for beat in script.get("beats", []):
        prompt_req = prompt_for_beat(beat, library)
        if should_auto_fetch(beat, prompt_req):
            beats.append((beat, prompt_req))

    pexels_key = os.environ.get("PEXELS_API_KEY", "").strip()
    pixabay_key = os.environ.get("PIXABAY_API_KEY", "").strip()
    if not pexels_key and not pixabay_key:
        print("No PEXELS_API_KEY or PIXABAY_API_KEY set; footage stage skipped.", file=sys.stderr)
        return

    OUT.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, Any] = {}
    used_ids: set[tuple[str, Any]] = set()

    for beat, prompt_req in beats:
        n = int(beat["n"])
        have = existing_asset(n)
        requirement = requirement_text(beat, prompt_req)
        queries = query_variants(beat, prompt_req)
        if not queries:
            print(f"  beat {n:02d}  no searchable prompt", file=sys.stderr)
            continue
        if have and not args.force:
            manifest[str(n)] = {"file": f"footage/{have.name}", "status": "existing", "start": float(beat.get("start", 0)), "end": float(beat.get("end", 0)), "requirement": requirement, "prompt_source": prompt_req["source"] if prompt_req else None, "prompt_slot": prompt_req["slot"] if prompt_req else None}
            print(f"  beat {n:02d}  existing {have.name}")
            continue

        want_secs = max(0.5, float(beat.get("end", 0)) - float(beat.get("start", 0)))
        candidates: list[dict[str, Any]] = []
        for query in queries:
            if pexels_key:
                try:
                    candidates.extend(pexels_search(query, pexels_key, portrait=portrait))
                except Exception as err:
                    print(f"  beat {n:02d}  Pexels error: {err}", file=sys.stderr)
            if pixabay_key:
                try:
                    candidates.extend(pixabay_search(query, pixabay_key, portrait=portrait))
                except Exception as err:
                    print(f"  beat {n:02d}  Pixabay error: {err}", file=sys.stderr)
            if len(candidates) >= 80:
                break

        deduped: dict[tuple[str, Any], dict[str, Any]] = {}
        for item in candidates:
            deduped.setdefault((item["provider"], item["id"]), item)
        candidates = list(deduped.values())
        if not candidates:
            print(f"  beat {n:02d}  no stock match for {queries[0]!r}", file=sys.stderr)
            continue

        # Score against every query and keep the best semantic match.
        best = min(
            candidates,
            key=lambda item: min(candidate_score(item, query=q, want_secs=want_secs, portrait=portrait, used_ids=used_ids) for q in queries),
        )
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
            "source": "AUTO_STOCK",
            "asset_id": best["id"],
            "source_url": best["source_url"],
            "creator": best["creator"],
            "query": queries[0],
            "query_variants": queries,
            "requirement": requirement,
            "prompt_source": prompt_req["source"] if prompt_req else None,
            "prompt_slot": prompt_req["slot"] if prompt_req else None,
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
