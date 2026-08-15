# Video engine — two vocabularies, one pipeline

A script is the only thing that changes per episode. Everything under `src/` is
the engine that stages it.

```
script.md      ──parse-script.mjs──▶ src/script.json ──▶ <FinanceShort/> ─▶ out/final.mp4
script_vox.md                         beats  → scene modules       ▲
 beats                                texts  → the headline track  │  <VoxExplain/> ─▶ out/vox.mp4
 text timing table                    sfx    → the audio track     │
 sound design table                     │                          │
                                        ├──voice.py───▶ public/audio/vo/beat-N.wav
                                        ├──align.py───▶ src/voice.json
                                        │                word timings, and script.json
                                        │                retimed so the edit fits the read
                                        └──fetch-footage.py──▶ public/footage/beat-N.mp4
```

The timecodes in a script are the author's intent, not the final cut. Once a
take exists, `align.py` rewrites every beat, overlay and sfx cue from the
recording: **the voice is the clock.**

## The two vocabularies

`**Style:**` in the script header picks which one renders. Nothing else branches
— beats, voice, alignment, ducking, sfx and camera are shared.

| | Finance | Vox |
|---|---|---|
| Composition | `FinanceShort` | `VoxExplain` |
| Look | dark teal stage, gold objects, a presenter | ink on paper, one red accent, archival clips |
| Modules | `coinDrop` `coinStack` `investChart` `jarFill` `mountain` `payoff` `outro` | `kinetic` `doodle` `compare` `icon` `chart` `stat` `footage` |
| Text | headline track + word-lit captions | kinetic type driven by the same `voice.json` |
| Camera | pushes, and a shake on the payoff word | slow drift, never a shake |

A beat picks its module from its own **Visual** line, so a new episode in the
same shape needs zero code.

## Commands

```console
npm i
npm run episode      # script → voice → align → typecheck → out/final.mp4
npm run episode:vox  # script:vox → voice → align → footage → typecheck → out/vox.mp4
npm run dev          # Remotion Studio (both compositions)
npm run script       # re-parse script.md only
npm run script:vox   # re-parse script_vox.md only
npm run voice        # re-record the narration only  (Chatterbox, ~4 min on CPU)
npm run align        # re-time the episode to the current takes
npm run footage      # download the archival clips a vox script asked for
npm run render       # render only
npm run render:vox   # render the vox composition only
```

`script.json` holds **one** episode at a time — whichever script was parsed last.
Switching vocabularies means re-running `script` (or `script:vox`) and `voice`.

### The vox modules

| Module | Stages | Reads from the beat |
|---|---|---|
| `kinetic` | the words fill the page, landing as they're spoken | narration |
| `doodle` | imagery under a headline, with one hand-drawn mark | `On-screen text`, `Footage`, `Motion FX` (picks the mark) |
| `compare` | two quantities growing on the same axis, gap boxed by hand | `Data` |
| `icon` | mechanism steps as line-icon cards | `Icons` |
| `chart` | an ink line drawing in, with a running value | `Data`, `On-screen text` (unit) |
| `stat` | one number, alone, counting up under an underline | `Data` |
| `footage` | full-bleed imagery under a headline | `On-screen text`, `Footage` |

`Data` and `Icons` are `key: value` pairs, comma separated. `Data` keeps the unit
the script wrote (`0.4%`, `$2260`), so no module has to be told it twice.

### Imagery

`doodle` and `footage` beats download from Pexels — a still for `doodle` (a mark
reads better over one), a clip for `footage`. Needs a free key; without one those
beats fall back to a plain page and still render:

```console
set PEXELS_API_KEY=...        # https://www.pexels.com/api/
npm run footage
```

Everything else on screen is drawn in code and needs no assets at all.

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
| `src/theme.ts` | colours, type, safe zones, number formatting — the only place branding lives |
| `src/staging.tsx` | shared by both compositions: ducked music, sfx, narration, camera |
| `src/elements.tsx` | finance vocabulary: coin, jar, chart, pile, badge, presenter |
| `src/scenes.tsx` | one finance module per beat; `MODULES` maps `module` → component |
| `src/Overlays.tsx` | the headline track (slam/wipe/type/count/pop/fade) and word-lit captions |
| `src/FinanceShort.tsx` | finance staging |
| `src/vox/elements.tsx` | vox vocabulary: `PaperBG` `KineticText` `DrawIn` `LineIcon` `InkChart` `ArchivalBG` `Kicker` |
| `src/vox/scenes.tsx` | one vox module per beat; `VOX_MODULES` maps `module` → component |
| `src/VoxShort.tsx` | vox staging |
| `src/voice.json` | what the narrator said and exactly when — generated, never edited |
| `src/footage.json` | which beats have a downloaded clip — generated by `fetch-footage.py` |
| `tools/voice.py` | direction + Chatterbox; one take per beat |
| `tools/align.py` | word timings, and the retime that makes the edit follow the voice |
| `tools/fetch-footage.py` | Pexels clips for the beats that asked for footage |
| `tools/check.mjs` | guards the script → json contract for both vocabularies |

## Adding a beat type

Write the beat in the script, add its keyword to `MODULES` in
`tools/parse-script.mjs` (under `finance` or `vox`), and add a component under
the same key in the matching `scenes.tsx`. Nothing else needs to know about it.

A vox beat can also carry `**Icons**`, `**Data**` and `**Footage**` rows —
`key: value` pairs, comma separated — which the `icon`, `chart` and footage
modules stage. They are all optional.

## Not built yet

- **Vox maps.** The signature "country draws in" module. Needs `d3-geo` plus a
  topojson atlas asset; every other vox module ships.
- **16:9 essays.** `**Format:** landscape` already flips `script.json` to
  1920×1080 and the vox components size off the canvas, but the layouts have
  only been shot in 9:16.
- **Research/fact layer.** The numbers in a script are written by hand; nothing
  verifies them.
- **Per-word vocal emphasis.** Chatterbox directs a whole line, not a syllable, so
  emphasis is per beat (`DELIVERY` in `tools/voice.py`). The captions carry the
  word-level emphasis instead.
- **A second TTS provider.** `voice.py` talks to Chatterbox directly. Swapping
  engines means rewriting that one file, not adding an interface to it.
