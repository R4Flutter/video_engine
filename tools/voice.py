"""script.json narration -> one directed Chatterbox take per beat.

    .venv-tts/Scripts/python tools/voice.py [--voice ref.wav]

Chatterbox pins torch==2.6.0, so it lives in its own venv and never touches the
interpreter that runs tools/align.py. Writes video/public/audio/vo/beat-N.wav
plus voice-plan.json (the direction each beat was read with); align.py turns
those takes into word timings and retimes the episode around them.
"""

import argparse
import json
import re
from pathlib import Path

# torch/chatterbox are imported inside main(): align.py borrows speakable() and
# runs on the interpreter that has no Chatterbox in it.

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "video/src/script.json"
OUT = ROOT / "video/public/audio/vo"
PLAN = OUT / "voice-plan.json"

# --------------------------------------------------------------- direction
# Chatterbox exposes exactly two performance dials, so delivery is those two
# plus the silence after the line. `exaggeration` is energy; `cfg` is pace, and
# lower is faster — they move together or an excited read comes out sluggish.
#
#   beat role         energy  pace   silence after
DELIVERY = {
    "coinDrop":    (0.72, 0.32, 0.45),  # hook: straight in, no run-up
    "coinStack":   (0.50, 0.42, 0.22),  # setup: conversational
    "investChart": (0.58, 0.40, 0.26),  # the turn
    "jarFill":     (0.54, 0.46, 0.34),  # first big number: articulate it
    "mountain":    (0.62, 0.39, 0.30),  # build
    "payoff":      (0.76, 0.34, 0.50),  # reveal, then let it land
    "outro":       (0.50, 0.45, 0.55),  # CTA: friendly, and room for the badge
}
DEFAULT = (0.58, 0.40, 0.28)

# The narration is written to be read, not spoken: ₹ and % have no
# pronunciation and a TTS model will either skip them or spell them out.
SPEAK = [
    (re.compile(r"₹\s*([\d,]+)\s*(lakh|crore)s?\b", re.I), r"\1 \2 rupees"),
    (re.compile(r"₹\s*([\d,]+)"), r"\1 rupees"),
    (re.compile(r"(\d)%"), r"\1 percent"),
    (re.compile(r"(?<=\d),(?=\d)"), ""),  # 3,000 -> 3000, read as "three thousand"
]


def speakable(text: str) -> str:
    for pattern, repl in SPEAK:
        text = pattern.sub(repl, text)
    return re.sub(r"\s+", " ", text).strip()


def trim(wav, sr: int, floor: float = 0.02, pad: float = 0.04):
    """Drop the lead-in and tail-off silence so a beat starts on its first word."""
    loud = (wav.abs().max(dim=0).values > floor).nonzero()
    if not len(loud):
        return wav
    edge = int(pad * sr)
    return wav[:, max(0, int(loud[0]) - edge) : min(wav.shape[-1], int(loud[-1]) + edge)]


def main() -> None:
    global torch, ta, ChatterboxTTS
    import torch
    import torchaudio as ta
    from chatterbox.tts import ChatterboxTTS

    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", help="reference wav to clone (7-20s of clean speech)")
    # Left unset, each beat uses its own direction from DELIVERY above.
    ap.add_argument("--exaggeration", type=float, help="override energy for every beat")
    ap.add_argument("--cfg", type=float, help="override pace for every beat")
    ap.add_argument("--temperature", type=float, default=0.75)
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()

    script = json.loads(SCRIPT.read_text(encoding="utf8"))
    OUT.mkdir(parents=True, exist_ok=True)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"chatterbox on {device}")
    model = ChatterboxTTS.from_pretrained(device=device)

    plan = []
    for beat in script["beats"]:
        if not beat["vo"]:
            continue
        energy, pace, hold = DELIVERY.get(beat["module"], DEFAULT)
        if args.exaggeration is not None:
            energy = args.exaggeration
        if args.cfg is not None:
            pace = args.cfg
        text = speakable(beat["vo"])

        # Same seed every beat, so re-running the pipeline gives the same read.
        torch.manual_seed(args.seed)
        wav = trim(
            model.generate(
                text,
                audio_prompt_path=args.voice,
                exaggeration=energy,
                cfg_weight=pace,
                temperature=args.temperature,
            ).cpu(),
            model.sr,
        )
        ta.save(str(OUT / f"beat-{beat['n']}.wav"), wav, model.sr)

        secs = wav.shape[-1] / model.sr
        plan.append(
            {
                "n": beat["n"],
                "name": beat["name"],
                "spoken": text,
                "energy": energy,
                "pace": pace,
                "holdAfter": hold,
                "seconds": round(secs, 3),
            }
        )
        print(f"  beat {beat['n']}  {secs:5.2f}s  e{energy} p{pace}  {text}")

    PLAN.write_text(json.dumps(plan, indent=2, ensure_ascii=False), encoding="utf8")
    print(f"\n{OUT} — now run: python tools/align.py")


if __name__ == "__main__":
    main()
