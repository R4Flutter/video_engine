"""calibrate.py — Phase 2 of the closed loop: real YouTube retention in,
next-episode coefficients out.

    python tools/engine/calibrate.py --csv retention.csv [--script video/src/script.json]
        [--out C:/Users/rajna/yt_engine/reports/retention_coefficients.json]
        [--prior <same>] [--alpha 1.0] [--prior-weight 3000] [--dry]

Input CSV (canonical long format, one row per minute per video):

    video_id,video_title,duration_sec,minute,retention_pct
    abc123,The Company That Sells You Nothing,1161,0,96.4
    abc123,The Company That Sells You Nothing,1161,1,87.2
    ...

retention_pct is the audience-retention chart value at that minute (any
consistent scale works: heat_z is z-scored within each video, so the scale
cancels). Export it from YouTube Studio -> Audience retention, or pull it from
the YouTube Analytics API. Video rows whose title matches --script's title are
aligned to that episode's beats (narration sentences, even-read timing, the
same honest approximation the rest of the pipeline uses until a voice take
exists).

What it does (mirrors yt_engine/miner/alignment.py exactly so the label and
feature semantics stay identical to the corpus fit):

  1. resample each video's per-minute curve to per-second retention
  2. split the episode narration into sentences, featurize (verbatim port)
  3. attach heat_z (within-video z-score over the sentence window)
  4. residualize on the CORPUS position curve (50 bins) — same confound
     control as the corpus fit
  5. closed-form ridge on the 15 language features, standardized with the
     CORPUS moments so residual units never drift
  6. shrink the fitted coefficients toward the corpus prior:
         effect = (n_own * effect_own + prior_weight * effect_corpus)
                  / (n_own + prior_weight)
     with prior_weight = 3000 effective corpus sentences. As episodes are
     published and added here, the coefficients move from "the corpus says"
     toward "your channel measures" — that is the learning loop.

The model schema (coefficients/effect, position_curve, n_sentences, ...) is
unchanged, so the director and retention-score.mjs consume the recalibrated
file without any code change. retention_moments.json is never rewritten.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent.parent
YT_ENGINE = Path("C:/Users/rajna/yt_engine")  # sibling repo — model + corpus artifacts live here
DEFAULT_OUT = YT_ENGINE / "reports" / "retention_coefficients.json"
DEFAULT_MOMENTS = YT_ENGINE / "reports" / "retention_moments.json"

# --------------------------------------------------------------- lexicons
# Verbatim ports of miner/alignment.py — the features must match the corpus
# fit bit-for-bit or the "corpus-calibrated" claim silently breaks.
CONTRAST = re.compile(r"\b(but|however|yet|although|though|instead|despite|until)\b", re.I)
CONSEQUENCE = re.compile(r"\b(so|therefore|because|which meant|thus|as a result|that's why)\b", re.I)
DOLLAR = re.compile(r"(\$\s?[\d,.]+|\b\d[\d,.]*\s?(dollars?|bucks)\b)", re.I)
PERCENT = re.compile(r"(\d+(\.\d+)?\s?%|\bpercent\b)", re.I)
DIGITS = re.compile(r"\d")
SPELLED = re.compile(
    r"\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|"
    r"fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|trillion)\b", re.I)
ROUND_NUM = re.compile(r"\b(\d+)(000|00)\b|\b(ten|hundred|thousand|million|billion)\b", re.I)
TITLES = re.compile(r"\b(mr|mrs|ms|dr|ceo|founder|president|chairman|billionaire|investor)\b", re.I)
ORG_HINT = re.compile(
    r"\b(inc|corp|corporation|company|bank|group|holdings|ventures|capital|fund|llc|ltd)\b", re.I)
ABSTRACT = re.compile(
    r"^(the\s+)?(economy|market|value|growth|inflation|system|industry|concept|idea|"
    r"problem|situation|process|strategy|business model)\b", re.I)
PROPER = re.compile(r"(?<!^)(?<![.!?]\s)\b([A-Z][a-zA-Z]{2,})\b")
STOP_CAPS = {"I", "The", "But", "And", "So", "It", "This", "That", "He", "She", "They",
             "We", "You", "In", "On", "At", "If", "When", "What", "Why", "How", "Now"}
SENT = re.compile(r"(?<=[.!?\"'])\s+")

FEATURES = ["has_dollar", "has_number", "number_specific", "has_percent", "is_question",
            "is_contrast", "is_consequence", "names_person", "names_org", "new_entity",
            "abstract_subj", "sec_since_entity", "sec_since_number", "word_count", "wpm", "len_delta"]


# -------------------------------------------------------------- featurize
def featurize_sentences(beats: list[dict], duration: float) -> list[dict]:
    """Sentences from script.json beats, even-read timing, verbatim features."""
    out: list[dict] = []
    last_entity_t = 0.0
    last_number_t = 0.0
    prev_len = None
    seen_entities: set[str] = set()
    for b in beats:
        vo = b.get("vo") or ""
        dur = max(0.1, float(b.get("end", 0)) - float(b.get("start", 0)))
        parts = [p.strip() for p in SENT.split(vo) if p.strip()]
        if not parts:
            continue
        bw = max(1, len(vo.split()))
        cum = 0
        for part in parts:
            wc = len(part.split())
            t_start = float(b.get("start", 0)) + dur * (cum / bw)
            cum += wc
            t_end = float(b.get("start", 0)) + dur * (cum / bw)
            s = {"t_start": t_start, "t_end": t_end, "text": part, "word_count": wc,
                 "wpm": (wc / max(0.3, t_end - t_start)) * 60,
                 "rel_pos": t_start / max(1.0, duration)}
            has_dollar = bool(DOLLAR.search(part))
            has_num = bool(DIGITS.search(part) or SPELLED.search(part))
            s["has_dollar"] = int(has_dollar)
            s["has_number"] = int(has_num)
            s["has_percent"] = int(bool(PERCENT.search(part)))
            s["number_specific"] = int(has_num and not ROUND_NUM.search(part))
            s["is_question"] = int(part.rstrip().endswith("?"))
            s["is_contrast"] = int(bool(CONTRAST.search(part)))
            s["is_consequence"] = int(bool(CONSEQUENCE.search(part)))
            proper = {m for m in PROPER.findall(part) if m not in STOP_CAPS}
            s["names_person"] = int(bool(TITLES.search(part)) or len(proper) > 0)
            s["names_org"] = int(bool(ORG_HINT.search(part)))
            fresh = proper - seen_entities
            s["new_entity"] = int(bool(fresh))
            s["abstract_subj"] = int(bool(ABSTRACT.match(part.strip())))
            s["sec_since_entity"] = round(t_start - last_entity_t, 2)
            s["sec_since_number"] = round(t_start - last_number_t, 2)
            s["len_delta"] = float(wc - prev_len) if prev_len is not None else 0.0
            if proper:
                seen_entities |= proper
                last_entity_t = t_start
            if has_num:
                last_number_t = t_start
            prev_len = wc
            out.append(s)
    return out


def attach_heat(sents: list[dict], curve: np.ndarray) -> None:
    """heat_z within the video (position residualized later). Port of align.py."""
    mu, sd = float(curve.mean()), float(curve.std()) or 1e-6
    n = len(curve)
    for s in sents:
        a, b = int(s["t_start"]), max(int(s["t_end"]), int(s["t_start"]) + 1)
        if a >= n:
            s["heat_z"] = None
            continue
        here = float(curve[a:min(b, n)].mean())
        s["heat_z"] = round((here - mu) / sd, 4)


# -------------------------------------------------------------- csv input
def read_retention_csv(path: Path) -> list[dict]:
    rows: list[dict] = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            try:
                rows.append({
                    "video_id": (r.get("video_id") or "").strip(),
                    "video_title": (r.get("video_title") or "").strip(),
                    "duration_sec": float(r["duration_sec"]),
                    "minute": float(r["minute"]),
                    "retention": float(r["retention_pct"]),
                })
            except (KeyError, ValueError) as e:
                raise SystemExit(f"{path}: bad row {r}: {e} — expected columns "
                                 f"video_id,video_title,duration_sec,minute,retention_pct")
    if not rows:
        raise SystemExit(f"{path}: no rows")
    videos = {}
    for r in rows:
        v = videos.setdefault(r["video_id"], {"title": r["video_title"], "duration_sec": r["duration_sec"], "points": []})
        v["points"].append((r["minute"], r["retention"]))
    out = []
    for vid, v in videos.items():
        pts = sorted(v["points"])
        minutes = np.array([p[0] for p in pts])
        vals = np.array([p[1] for p in pts], dtype=float)
        if len(pts) < 2 or v["duration_sec"] < 30:
            continue
        per_second = np.interp(np.arange(int(v["duration_sec"]), dtype=float), minutes, vals)
        out.append({"video_id": vid, "title": v["title"], "duration_sec": v["duration_sec"], "curve": per_second})
    return out


# --------------------------------------------------------------- fit/blend
def fit_ridge(X: np.ndarray, y: np.ndarray, alpha: float) -> np.ndarray:
    n = X.shape[0]
    A = X.T @ X + alpha * np.eye(X.shape[1])
    return np.linalg.solve(A, X.T @ y)


def main() -> None:
    ap = argparse.ArgumentParser(description="self-calibrate the retention model on real YouTube retention")
    ap.add_argument("--csv", required=True, help="retention CSV (long format, see header)")
    ap.add_argument("--script", default=str(ROOT / "video/src/script.json"))
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    ap.add_argument("--prior", default=str(DEFAULT_OUT))
    ap.add_argument("--alpha", type=float, default=1.0)
    ap.add_argument("--prior-weight", type=float, default=3000.0, help="effective corpus sentences the prior counts as")
    ap.add_argument("--dry", action="store_true")
    args = ap.parse_args()

    prior_path = Path(args.prior)
    moments_path = DEFAULT_MOMENTS
    if not prior_path.exists():
        raise SystemExit(f"prior model not found: {prior_path} — run the yt_engine fit first")
    if not moments_path.exists():
        raise SystemExit(f"corpus moments not found: {moments_path}")
    prior = json.loads(prior_path.read_text(encoding="utf8"))
    moments = json.loads(moments_path.read_text(encoding="utf8"))["features"]
    if "features" in prior and "coefficients" not in prior:
        raise SystemExit(f"{prior_path}: unexpected schema")

    script = json.loads(Path(args.script).read_text(encoding="utf8"))
    title = (script.get("title") or "").lower()
    videos = read_retention_csv(Path(args.csv))
    aligned = [v for v in videos if v["title"].lower() == title]
    if not aligned and len(videos) == 1:
        aligned = videos
    skipped = len(videos) - len(aligned)
    if skipped:
        print(f"  {skipped} video(s) in the CSV have no matching episode script — skipped (no transcript to align)")

    if not aligned:
        raise SystemExit("no video in the CSV matches the episode title — pass --script for the published episode")

    coef_prior = {c["feature"]: c["effect"] for c in prior["coefficients"]}
    feat_list = [f for f in FEATURES if f != "rel_pos"]

    sentences: list[dict] = []
    for v in aligned:
        sents = featurize_sentences(script.get("beats") or [], v["duration_sec"])
        attach_heat(sents, v["curve"])
        for s in sents:
            if s["heat_z"] is not None:
                s["video_id"] = v["video_id"]
                sentences.append(s)
    if len(sentences) < 100:
        raise SystemExit(f"only {len(sentences)} aligned sentences across {len(aligned)} video(s) — "
                         f"publish more episodes before calibrating")

    curve = np.array(prior["position_curve"], dtype=float)
    bins = np.clip((np.array([s["rel_pos"] for s in sentences]) * 50).astype(int), 0, 49)
    y = np.array([s["heat_z"] for s in sentences]) - curve[bins]
    X = np.array([[s.get(f, 0) for f in feat_list] for s in sentences], dtype=float)
    for j, f in enumerate(feat_list):
        mu, sd = moments[f]["mean"], moments[f]["std"] or 1e-6
        X[:, j] = (X[:, j] - mu) / sd

    own = fit_ridge(X, y, args.alpha)
    n_own = len(sentences)
    w = args.prior_weight
    effects = {}
    for j, f in enumerate(feat_list):
        prior_effect = coef_prior.get(f, 0.0)
        blended = (n_own * own[j] + w * prior_effect) / (n_own + w)
        effects[f] = {"prior": prior_effect, "own": round(float(own[j]), 4), "blended": round(float(blended), 4)}

    print(f"CALIBRATE  {len(aligned)} video(s) · {n_own} sentences · alpha {args.alpha} · prior weight {w}")
    print(f"  blended = (own*{n_own} + prior*{w}) / {n_own + w}")
    for f in feat_list:
        e = effects[f]
        moved = "  <--" if abs(e["blended"] - e["prior"]) > 0.005 else ""
        print(f"  {f:<16} prior {e['prior']:+.4f} -> own {e['own']:+.4f} -> blended {e['blended']:+.4f}{moved}")

    if args.dry:
        print("  dry run — nothing written")
        return

    new = dict(prior)
    new["coefficients"] = [
        {**c, "effect": effects[c["feature"]]["blended"],
         "self_effect": effects[c["feature"]]["own"],
         "self_blended": True}
        for c in prior["coefficients"]
    ]
    new["self_calibrated_videos"] = len(aligned)
    new["self_calibrated_sentences"] = n_own
    new["self_calibrated_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    new["prior_weight"] = w
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(new, indent=2), encoding="utf8")
    print(f"WROTE {out}")


if __name__ == "__main__":
    sys.exit(main())