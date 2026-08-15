"""script.json narration -> one directed Chatterbox take per beat.

    .venv-tts/Scripts/python tools/voice.py [--voice ref.wav] [--force]

Chatterbox pins torch==2.6.0, so it lives in its own venv and never touches the
interpreter that runs tools/align.py. Writes video/public/audio/vo/beat-N.wav
plus voice-plan.json (the direction each beat was read with); align.py turns
those takes into word timings and retimes the episode around them.

Takes are cached on what determines them — the spoken text, the two direction
dials, the sampler settings and the reference voice. Edit one line of the
script and only that beat is re-read; the rest are already on disk and are
byte-identical to what a full re-run would produce. --force re-reads everything.
"""

import argparse
import hashlib
import json
import os
import re
from pathlib import Path

# torch/chatterbox are imported inside main(): align.py borrows speakable() and
# runs on the interpreter that has no Chatterbox in it.

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "video/src/script.json"
OUT = ROOT / "video/public/audio/vo"
PLAN = OUT / "voice-plan.json"
CACHE = OUT / ".takes.json"

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
    # Vox mode: an explainer, not a pitch. Steadier, a shade lower energy and
    # slower throughout, with longer silences — the pauses are the argument.
    "kinetic":     (0.46, 0.46, 0.34),  # claim / payoff: deliberate, let it sit
    "footage":     (0.40, 0.50, 0.26),  # status quo: flat, almost reported
    "doodle":      (0.44, 0.48, 0.30),  # the pivot: a touch more weight
    "icon":        (0.42, 0.49, 0.24),  # mechanism: even, step by step
    "chart":       (0.44, 0.47, 0.32),  # the number: articulate it, then hold
    "compare":     (0.48, 0.46, 0.30),  # the turn: name both sides evenly
    "stat":        (0.52, 0.42, 0.46),  # the cost: land it, then leave a gap
}
DEFAULT = (0.58, 0.40, 0.28)

# The narration is written to be read, not spoken: currency symbols and % have
# no pronunciation and a TTS model will either skip them or spell them out.
SPEAK = [
    (re.compile(r"₹\s*([\d,]+)\s*(lakh|crore)s?\b", re.I), r"\1 \2 rupees"),
    (re.compile(r"₹\s*([\d,]+)"), r"\1 rupees"),
    (re.compile(r"\$\s*([\d,]+(?:\.\d+)?)\s*(k|thousand|million|billion)\b", re.I), r"\1 \2 dollars"),
    (re.compile(r"\$\s*([\d,]+(?:\.\d+)?)"), r"\1 dollars"),
    (re.compile(r"(\d)%"), r"\1 percent"),
    (re.compile(r"(?<=\d),(?=\d)"), ""),  # 3,000 -> 3000, read as "three thousand"
]


def speakable(text: str) -> str:
    for pattern, repl in SPEAK:
        text = pattern.sub(repl, text)
    return re.sub(r"\s+", " ", text).strip()


def fingerprint(**parts) -> str:
    """Everything that decides how a take comes out, hashed. Miss one input and
    the cache goes stale silently, so this takes the whole set by keyword."""
    blob = json.dumps(parts, sort_keys=True, ensure_ascii=False)
    return hashlib.sha1(blob.encode("utf8")).hexdigest()[:16]


def voice_id(path: str | None) -> str | None:
    """The reference wav by content, not by name — swapping ref.wav for a
    different recording under the same filename has to invalidate the takes."""
    if not path:
        return None
    p = Path(path)
    if not p.exists():
        return f"missing:{path}"
    return hashlib.sha1(p.read_bytes()).hexdigest()[:16]


def wav_seconds(path: Path) -> float:
    """Length of an already-written take, without waking torch.

    Hand-rolled rather than `wave` or torchaudio: torchaudio drags torch in and
    the whole point of a cache hit is not paying that, and torchaudio writes
    these as 32-bit float (WAVE format tag 3), which the standard library's
    `wave` module refuses outright."""
    raw = path.read_bytes()
    if raw[:4] != b"RIFF" or raw[8:12] != b"WAVE":
        raise ValueError(f"{path} is not a RIFF WAVE file")

    channels = bits = rate = data = 0
    pos = 12
    while pos + 8 <= len(raw):
        kind = raw[pos : pos + 4]
        size = int.from_bytes(raw[pos + 4 : pos + 8], "little")
        body = pos + 8
        if kind == b"fmt ":
            channels = int.from_bytes(raw[body + 2 : body + 4], "little")
            rate = int.from_bytes(raw[body + 4 : body + 8], "little")
            bits = int.from_bytes(raw[body + 14 : body + 16], "little")
        elif kind == b"data":
            # A truncated file reports the size it meant to write, not the size
            # it managed to — trust the bytes that are actually there.
            data = min(size, len(raw) - body)
        pos = body + size + (size & 1)  # chunks are word-aligned

    if not (channels and bits and rate and data):
        raise ValueError(f"{path} has no readable fmt/data chunk")
    return data / (channels * (bits // 8)) / rate


def trim(wav, sr: int, floor: float = 0.02, pad: float = 0.04):
    """Drop the lead-in and tail-off silence so a beat starts on its first word."""
    loud = (wav.abs().max(dim=0).values > floor).nonzero()
    if not len(loud):
        return wav
    edge = int(pad * sr)
    return wav[:, max(0, int(loud[0]) - edge) : min(wav.shape[-1], int(loud[-1]) + edge)]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", help="reference wav to clone (7-20s of clean speech)")
    # Left unset, each beat uses its own direction from DELIVERY above.
    ap.add_argument("--exaggeration", type=float, help="override energy for every beat")
    ap.add_argument("--cfg", type=float, help="override pace for every beat")
    ap.add_argument("--temperature", type=float, default=0.75)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--force", action="store_true", help="re-read every beat")
    args = ap.parse_args()

    script = json.loads(SCRIPT.read_text(encoding="utf8"))
    OUT.mkdir(parents=True, exist_ok=True)
    cached = {} if args.force else json.loads(CACHE.read_text("utf8")) if CACHE.exists() else {}
    ref = voice_id(args.voice)

    # Pass one: what each take should be, and whether we already have it. No
    # torch yet — with nothing to re-read, loading the model is pure waiting.
    takes = []
    for beat in script["beats"]:
        if not beat["vo"]:
            continue
        energy, pace, hold = DELIVERY.get(beat["module"], DEFAULT)
        if args.exaggeration is not None:
            energy = args.exaggeration
        if args.cfg is not None:
            pace = args.cfg
        text = speakable(beat["vo"])
        path = OUT / f"beat-{beat['n']}.wav"
        stamp = fingerprint(
            text=text,
            energy=energy,
            pace=pace,
            temperature=args.temperature,
            seed=args.seed,
            voice=ref,
        )
        takes.append(
            {
                "n": beat["n"],
                "name": beat["name"],
                "spoken": text,
                "energy": energy,
                "pace": pace,
                "holdAfter": hold,
                "path": path,
                "stamp": stamp,
                "fresh": cached.get(str(beat["n"])) == stamp and path.exists(),
            }
        )

    todo = [t for t in takes if not t["fresh"]]
    reused = len(takes) - len(todo)
    print(f"{len(takes)} beats — {reused} cached, {len(todo)} to read")

    model = None
    if todo:
        global torch, ta, ChatterboxTTS
        import torch
        import torchaudio as ta
        from chatterbox.tts import ChatterboxTTS

        device = "cuda" if torch.cuda.is_available() else "cpu"
        if device == "cpu":
            # Torch defaults to physical cores and then leaves half the machine
            # idle behind a thread pool that never grows. On a laptop doing
            # nothing else, the whole box is ours.
            torch.set_num_threads(max(1, os.cpu_count() or 1))
        print(f"chatterbox on {device} ({torch.get_num_threads()} threads)")
        model = ChatterboxTTS.from_pretrained(device=device)

    plan = []
    stamps = {str(t["n"]): t["stamp"] for t in takes if t["fresh"]}
    for take in takes:
        if take["fresh"]:
            secs = wav_seconds(take["path"])
            print(f"  beat {take['n']}  {secs:5.2f}s  cached")
        else:
            # Same seed every beat, so re-running the pipeline gives the same read.
            torch.manual_seed(args.seed)
            wav = trim(
                model.generate(
                    take["spoken"],
                    audio_prompt_path=args.voice,
                    exaggeration=take["energy"],
                    cfg_weight=take["pace"],
                    temperature=args.temperature,
                ).cpu(),
                model.sr,
            )
            ta.save(str(take["path"]), wav, model.sr)
            secs = wav.shape[-1] / model.sr
            # Banked as soon as the wav is on disk: a run killed at beat nine
            # keeps the eight reads it already paid for.
            stamps[str(take["n"])] = take["stamp"]
            CACHE.write_text(json.dumps(stamps, indent=2), encoding="utf8")
            print(
                f"  beat {take['n']}  {secs:5.2f}s  "
                f"e{take['energy']} p{take['pace']}  {take['spoken']}"
            )

        plan.append(
            {
                "n": take["n"],
                "name": take["name"],
                "spoken": take["spoken"],
                "energy": take["energy"],
                "pace": take["pace"],
                "holdAfter": take["holdAfter"],
                "seconds": round(secs, 3),
            }
        )

    PLAN.write_text(json.dumps(plan, indent=2, ensure_ascii=False), encoding="utf8")
    CACHE.write_text(json.dumps(stamps, indent=2), encoding="utf8")
    print(f"\n{OUT} — now run: python tools/align.py")


if __name__ == "__main__":
    main()
