"""Narration wavs -> word timings, and the episode retimed to fit them.

    python tools/align.py

Reads video/public/audio/vo/beat-N.wav, transcribes each with word timestamps,
maps those timings back onto the *scripted* words (so captions keep the ₹ and
the spelling the script wrote), then rewrites video/src/script.json so every
beat, overlay and sfx cue sits where the voice actually put it.

Runs on the normal interpreter — faster-whisper uses CTranslate2, not torch, so
it stays clear of the Chatterbox venv.
"""

import argparse
import difflib
import json
import re
import sys
from pathlib import Path

from faster_whisper import WhisperModel

sys.path.insert(0, str(Path(__file__).resolve().parent))
from voice import speakable  # same normalisation the TTS was fed

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "video/src/script.json"
VOICE = ROOT / "video/src/voice.json"
VO = ROOT / "video/public/audio/vo"
PLAN = VO / "voice-plan.json"

HOLD = 0.28  # silence after a beat when voice-plan.json has no direction for it
MIN_BEAT = 1.0
SNAP = 0.6  # an sfx cue this close to an overlay cue was authored to hit with it

norm = lambda w: re.sub(r"[^\w%]", "", w).lower()


def spoken_tokens(vo: str):
    """Every token the model was asked to say, tagged with the written word it
    came from — "₹3,000" is one word on screen but two in the mouth."""
    toks, owners = [], []
    for i, word in enumerate(vo.split()):
        for tok in speakable(word).split():
            if norm(tok):
                toks.append(norm(tok))
                owners.append(i)
    return toks, owners


def word_times(vo: str, heard):
    """Scripted words, timed by what the recording actually says.

    `heard` is whisper's [(token, start, end)]. Aligning on the token stream
    rather than trusting equal counts means a dropped or merged word shifts the
    words around it instead of desynchronising the rest of the beat.
    """
    written = vo.split()
    toks, owners = spoken_tokens(vo)
    hw = [norm(w) for w, _, _ in heard]

    spans: dict[int, list[float]] = {}
    matcher = difflib.SequenceMatcher(None, toks, hw, autojunk=False)
    for a, b, size in matcher.get_matching_blocks():
        for k in range(size):
            owner = owners[a + k]
            _, start, end = heard[b + k]
            span = spans.setdefault(owner, [start, end])
            span[0] = min(span[0], start)
            span[1] = max(span[1], end)

    if not spans:  # nothing matched: fall back to an even split of the clip
        total = heard[-1][2] if heard else 0.0
        step = total / max(1, len(written))
        return [
            {"w": w, "start": i * step, "end": (i + 1) * step}
            for i, w in enumerate(written)
        ]

    # Words whisper never matched (a swallowed "a", an odd contraction) split the
    # gap between their timed neighbours rather than each guessing on its own.
    known = sorted(spans)
    out = []
    for i, w in enumerate(written):
        if i in spans:
            start, end = spans[i]
        else:
            before = max((j for j in known if j < i), default=None)
            after = min((j for j in known if j > i), default=None)
            a = spans[before][1] if before is not None else 0.0
            b = spans[after][0] if after is not None else spans[known[-1]][1]
            lo = before if before is not None else -1
            hi = after if after is not None else len(written)
            start = a + (b - a) * (i - lo) / (hi - lo)
            end = a + (b - a) * (i + 1 - lo) / (hi - lo)
        out.append({"w": w, "start": round(start, 3), "end": round(max(end, start + 0.05), 3)})

    # Monotonic: a caption that jumps backwards flickers.
    for i in range(1, len(out)):
        out[i]["start"] = max(out[i]["start"], out[i - 1]["start"])
        out[i]["end"] = max(out[i]["end"], out[i]["start"] + 0.05)
    return out


def reanchor(cues, old, new, beats):
    """Move a cue onto the new timeline. A cue whose first word is spoken in the
    beat lands on that word; everything else keeps its position within the beat."""
    out = []
    for cue in cues:
        i = next((k for k, b in enumerate(old) if b[0] <= cue["at"] < b[1]), len(old) - 1)
        (o_start, o_end), (n_start, n_end) = old[i], new[i]
        at = n_start + (cue["at"] - o_start) / max(0.001, o_end - o_start) * (n_end - n_start)
        head = norm(str(cue.get("text", "")).split(" ")[0])
        if head and cue["at"] > o_start:
            hit = next((w for w in beats[i]["words"] if norm(w["w"]) == head), None)
            if hit:
                at = n_start + hit["start"]
        out.append({**cue, "at": round(min(at, n_end - 0.05), 3)})
    return out


def selftest() -> None:
    """python tools/align.py --selftest — the two bits of logic worth breaking."""
    vo = "See, ₹100 a day is only ₹3,000 a month."
    heard = [(w, i * 0.4, i * 0.4 + 0.35) for i, w in enumerate(speakable(vo).split())]
    words = word_times(vo, heard)
    assert [w["w"] for w in words] == vo.split(), "captions must keep the written words"
    # "₹100" is one word on screen and two in the mouth: it owns both slots.
    at = {w["w"]: (w["start"], w["end"]) for w in words}
    assert abs(at["₹100"][0] - heard[1][1]) < 1e-3, at["₹100"]
    assert abs(at["₹100"][1] - heard[2][2]) < 1e-3, at["₹100"]
    assert all(a["start"] <= b["start"] for a, b in zip(words, words[1:])), "monotonic"

    # A word whisper never heard still gets time, between its neighbours.
    gapped = word_times(vo, [h for i, h in enumerate(heard) if i != 4])
    assert len(gapped) == len(vo.split())
    assert all(w["end"] > w["start"] for w in gapped)

    # Nothing recognised at all: fall back to an even split rather than crash.
    assert len(word_times(vo, [("zzz", 0.0, 2.0)])) == len(vo.split())

    # A cue whose first word is spoken lands on that word, not on a proportion.
    beats = [{"words": [{"w": "Follow", "start": 4.0, "end": 4.4}]}]
    cue = reanchor([{"at": 29.0, "text": "FOLLOW FOR MORE"}], [(27.0, 30.0)], [(10.0, 20.0)], beats)
    assert cue[0]["at"] == 14.0, cue
    # And one that opens its beat stays pinned to the top of the beat.
    head = reanchor([{"at": 27.0, "text": "ANYTHING"}], [(27.0, 30.0)], [(10.0, 20.0)], beats)
    assert head[0]["at"] == 10.0, head
    print("ok — word timing and cue re-anchoring")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="base.en")
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        return selftest()

    script = json.loads(SCRIPT.read_text(encoding="utf8"))
    hold = (
        {p["n"]: p["holdAfter"] for p in json.loads(PLAN.read_text(encoding="utf8"))}
        if PLAN.exists()
        else {}
    )
    model = WhisperModel(args.model, device="cpu", compute_type="int8")

    beats, cursor = [], 0.0
    old_spans, new_spans = [], []
    for beat in script["beats"]:
        path = VO / f"beat-{beat['n']}.wav"
        if not path.exists():
            raise SystemExit(f"missing {path} — run tools/voice.py first")
        segments, info = model.transcribe(
            str(path), word_timestamps=True, initial_prompt=speakable(beat["vo"])
        )
        heard = [
            (w.word.strip(), w.start, w.end) for s in segments for w in (s.words or [])
        ]
        words = word_times(beat["vo"], heard)
        speech = words[-1]["end"] if words else info.duration
        dur = max(MIN_BEAT, round(speech + hold.get(beat["n"], HOLD), 3))

        beats.append(
            {
                "n": beat["n"],
                "file": f"vo/{path.name}",
                "start": round(cursor, 3),
                "dur": dur,
                "speech": round(speech, 3),
                "words": words,
            }
        )
        old_spans.append((beat["start"], beat["end"]))
        new_spans.append((round(cursor, 3), round(cursor + dur, 3)))
        cursor += dur
        print(f"  beat {beat['n']}  {speech:5.2f}s speech  {len(words)} words")

    total = round(cursor, 3)
    for beat, (start, end) in zip(script["beats"], new_spans):
        beat["start"], beat["end"] = start, end
    script["durationInSeconds"] = total
    script["texts"] = reanchor(script["texts"], old_spans, new_spans, beats)
    script["sfx"] = reanchor(script["sfx"], old_spans, new_spans, beats)
    # script.md authors an overlay and its accent on the same timecode. Once the
    # overlay has been pulled onto a spoken word, the accent follows it.
    for cue in script["sfx"]:
        near = min(script["texts"], key=lambda t: abs(t["at"] - cue["at"]), default=None)
        if near and abs(near["at"] - cue["at"]) < SNAP:
            cue["at"] = near["at"]

    SCRIPT.write_text(json.dumps(script, indent=2, ensure_ascii=False), encoding="utf8")
    VOICE.write_text(
        json.dumps({"total": total, "beats": beats}, indent=2, ensure_ascii=False),
        encoding="utf8",
    )
    print(f"\n{total}s episode — {VOICE.name} written, script.json retimed")


if __name__ == "__main__":
    main()
