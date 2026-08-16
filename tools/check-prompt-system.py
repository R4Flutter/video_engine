"""Lightweight CPU-only validation for the production asset prompt system.

Run from the repo root:
    python tools/check-prompt-system.py

This validates the prompt contract, including deterministic source routing.
Heavy image/video generation never belongs in this check on a 16 GB CPU machine.
"""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROMPT = ROOT / "prompt"
REQUIRED = (
    "README.md",
    "AGENT.md",
    "asset-source-policy.md",
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
    policy = (PROMPT / "asset-source-policy.md").read_text(encoding="utf-8").lower()
    manifest = (PROMPT / "manifest.md").read_text(encoding="utf-8").lower()

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
        "choose the source before writing a prompt",
        "decompose, do not collage",
        "cpu / 16 gb ram gate",
        "self-critique",
    )
    for term in agent_terms:
        if term not in agent:
            fail(f"AGENT.md is missing required rule: {term}")

    policy_terms = (
        "real_stock",
        "user_generated_manual",
        "pexels or pixabay",
        "generation prompt: none",
        "do not waste prompt text on stock photographs",
    )
    for term in policy_terms:
        if term not in policy:
            fail(f"asset-source-policy.md is missing required routing rule: {term}")

    manifest_terms = (
        '"source": "real_stock"',
        '"source": "user_generated_manual"',
        "stockquery",
        "generationprompt",
    )
    for term in manifest_terms:
        if term not in manifest:
            fail(f"manifest.md is missing required source field/rule: {term}")

    # Only global policy files are checked for accidental style lock-in.
    global_files = (PROMPT / "README.md", PROMPT / "AGENT.md")
    banned_global = ("global vox-style", "default paper-cut")
    for path in global_files:
        text = path.read_text(encoding="utf-8").lower()
        for phrase in banned_global:
            if phrase in text:
                fail(f"{path.name} contains accidental global style lock-in: {phrase}")

    print(f"[prompt-system] OK — {len(REQUIRED)} core contract files validated")
    print("[prompt-system] Source routing: REAL_STOCK / USER_GENERATED_MANUAL / AUTO_STOCK validated")
    print("[prompt-system] CPU-only check; no model inference performed")


if __name__ == "__main__":
    main()
