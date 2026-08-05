# Finance short — video engine

`script.md` is the only thing that changes per episode. Everything under `src/`
is the engine that stages it.

```
script.md ──parse-script.mjs──▶ src/script.json ──▶ <FinanceShort/> ──▶ out/final.mp4
 beats                           beats  → scene modules          ▲
 text timing table               texts  → the headline track     │
 sound design table              sfx    → the audio track        │
                                   │                             │
                                   ├──voice.py───▶ public/audio/vo/beat-N.wav
                                   └──align.py───▶ src/voice.json
                                        word timings, and script.json
                                        retimed so the edit fits the read
```

The timecodes in `script.md` are the author's intent, not the final cut. Once a
take exists, `align.py` rewrites every beat, overlay and sfx cue from the
recording: **the voice is the clock.**

## Commands

```console
npm i
npm run episode   # script → voice → align → typecheck → out/final.mp4
npm run dev       # Remotion Studio
npm run script    # re-parse script.md only
npm run voice     # re-record the narration only  (Chatterbox, ~4 min on CPU)
npm run align     # re-time the episode to the current takes
npm run render    # render only
```

The voice needs a one-off install, kept in its own venv because Chatterbox pins
`torch==2.6.0` and would otherwise downgrade the interpreter everything else
uses:

```console
python -m venv .venv-tts                       # from the repo root
.venv-tts/Scripts/pip install chatterbox-tts
```

Delivery is tuned in `human_like_voice.md`.

Sound assets are synthesised, not downloaded — regenerate with
`python tools/make_audio.py video/public/audio` from the repo root.

## Where things live

| File | Role |
|---|---|
| `src/theme.ts` | colours, type, safe zones, ₹ formatting — the only place branding lives |
| `src/elements.tsx` | the visual vocabulary: coin, jar, chart, pile, badge, presenter |
| `src/scenes.tsx` | one module per beat; `MODULES` maps a beat's `module` to a component |
| `src/Overlays.tsx` | the headline track (slam/wipe/type/count/pop/fade) and word-lit captions |
| `src/FinanceShort.tsx` | staging: sequences, camera, narration, ducked music, sfx |
| `src/voice.json` | what the narrator said and exactly when — generated, never edited |
| `tools/voice.py` | direction + Chatterbox; one take per beat |
| `tools/align.py` | word timings, and the retime that makes the edit follow the voice |

## Adding a beat type

Write the beat in `script.md`, add its keyword to `MODULES` in
`tools/parse-script.mjs`, and add a component under the same key in
`src/scenes.tsx`. Nothing else needs to know about it.

## Not built yet

- **Research/fact layer.** The numbers in `script.md` are written by hand; nothing
  verifies them.
- **Per-word vocal emphasis.** Chatterbox directs a whole line, not a syllable, so
  emphasis is per beat (`DELIVERY` in `tools/voice.py`). The captions carry the
  word-level emphasis instead.
- **A second TTS provider.** `voice.py` talks to Chatterbox directly. Swapping
  engines means rewriting that one file, not adding an interface to it.
