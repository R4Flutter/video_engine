"""Bridge to VIRALFORGE (C:\\Users\\rajna\\yt_engine) — the YouTube intelligence
engine. Wraps its modules so the finance pipeline can ask the corpus questions:

    python tools/viral.py hook "401k match free money" --mode money --facts "100% match" 
        -> data-driven hook candidates for the script's hook strategy (pre-script)
    python tools/viral.py patterns
        -> what the corpus says is working in this niche right now (pre-script)
    python tools/viral.py score out/vox.mp4 --title "..." [--assume-voice]
        -> 0-100 viral scorecard on the render, gated against measured thresholds
           (post-render, before publishing)

Everything runs as a subprocess inside the engine's own root so its `python -m`
imports resolve. The engine owns the intelligence; this file only carries
arguments across.

The engine's corpus (db/viralforge.db) is created on first run and grows with
`python -m harvester.deep_crawl`. Until it has 200+ videos every finding prints
confidence: LOW — the bridge passes that honesty through verbatim.
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

ENGINE = Path(
    os.environ.get("YT_ENGINE", r"C:\Users\rajna\yt_engine")
).resolve()


def run(args: list[str]) -> int:
    print(f"[viralforge] python -m {' '.join(args)}", file=sys.stderr)
    return subprocess.run(
        [sys.executable, "-m", *args], cwd=ENGINE, check=False
    ).returncode


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Ask the VIRALFORGE corpus questions from the finance pipeline."
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    h = sub.add_parser("hook", help="generate hook candidates for a topic")
    h.add_argument("topic", nargs="+")
    h.add_argument("--mode", default="money",
                   choices=sorted({"retention_optimized", "money", "story",
                                   "contrarian", "documentary"}))
    h.add_argument("--facts", nargs="*", default=[],
                   help="verified facts the generator may use, e.g. \"100% employer match\"")
    h.add_argument("--duration", type=int, default=8)

    s = sub.add_parser("score", help="score a rendered video 0-100")
    s.add_argument("video", help="path to the render, e.g. out/vox.mp4")
    s.add_argument("--title", default=None, help="candidate title to score too")
    s.add_argument("--assume-voice", action="store_true",
                   help="skip whisper transcription (narration already muxed into the file)")

    sub.add_parser("patterns", help="current hook patterns + learned effect sizes")
    sub.add_parser("benchmark", help="corpus status (videos, hooks, confidence level)")

    c = sub.add_parser("crawl", help="run the harvest pipeline (needs YOUTUBE_API_KEY)")
    c.add_argument("--top", type=int, default=50, help="deep-crawl this many outliers")
    c.add_argument("--pipeline", action="store_true",
                   help="full run_mvp.py (crawl -> outliers -> patterns -> benchmarks)")

    args = ap.parse_args()

    if args.cmd == "hook":
        cmd = ["miner.hooks", "generate", " ".join(args.topic)]
        if args.mode:
            cmd += ["--mode", args.mode]
        if args.facts:
            cmd += ["--facts", *args.facts]
        cmd += ["--duration", str(args.duration)]
        return run(cmd)

    if args.cmd == "score":
        cmd = ["analyzer.score", str(Path(args.video).resolve())]
        if args.title:
            cmd += ["--title", args.title]
        if args.assume_voice:
            cmd += ["--assume-voice"]
        return run(cmd)

    if args.cmd == "patterns":
        return run(["miner.hooks", "patterns-learned"])

    if args.cmd == "benchmark":
        return run(["miner.hooks", "benchmark"])

    if args.cmd == "crawl":
        if args.pipeline:
            return run(["run_mvp"])
        return run(["harvester.deep_crawl", "--top", str(args.top)])

    return 2


if __name__ == "__main__":
    sys.exit(main())