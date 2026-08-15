"""Lightweight CPU-only validation for the production asset prompt system.

Run from the repo root:
    python tools/check-prompt-system.py

This deliberately validates the prompt contract, not model output. Heavy
image/video generation never belongs in this check on a 16 GB CPU machine.
"""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROMPT = ROOT / "prompt"
REQUIRED = (
    "README.md",
    "AGENT.md",
    "visual-bible.md",
    "manifest.md",
)


def fail(message: str) -> None:
    raise SystemExit(f"[prompt-system] ERROR: {message}")


def main() -> None:
    if not PROMPT.is_dir():
        fail("prompt/ directory is missing")

    for name in REQUIRED:
        if not (PROMPT / name).is_file():
            fail(f"prompt/{name} is missing")

    readme = (PROMPT / "README.md").read_text(encoding="utf-8").lower()
    agent = (PROMPT / "AGENT.md").read_text(encoding="utf-8").lower()

    required_terms = (
        "asset-first",
        "06_broll",
        "real alpha channel",
        "cpu-first",
        "p0",
        "p1",
        "p2",
    )
    for term in required_terms:
        if term not in readme:
            fail(f"README.md is missing required contract term: {term}")

    agent_terms = (
        "production asset director",
        "choose the best asset medium",
        "decompose, do not collage",
        "cpu / 16 gb ram gate",
        "self-critique",
    )
    for term in agent_terms:
        if term not in agent:
            fail(f"AGENT.md is missing required rule: {term}")

    # Only global policy files are checked for accidental style lock-in.
    # Story-specific files are allowed to deliberately override the visual bible.
    global_files = (PROMPT / "README.md", PROMPT / "AGENT.md")
    banned_global = ("global vox-style", "default paper-cut")
    for path in global_files:
        text = path.read_text(encoding="utf-8").lower()
        for phrase in banned_global:
            if phrase in text:
                fail(f"{path.name} contains accidental global style lock-in: {phrase}")

    print(f"[prompt-system] OK — {len(REQUIRED)} core contract files validated")
    print("[prompt-system] CPU-only check; no model inference performed")


if __name__ == "__main__":
    main()
