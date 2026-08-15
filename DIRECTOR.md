# The director

A Short is not a short essay. An essay is judged on whether it holds a viewer
who already chose to watch. A Short is judged on whether it survives a thumb
that has not chosen anything yet — so roughly a third of the audience is gone
inside two seconds, and nothing that happens at second twenty gets them back.

This layer exists to make that measurable before you render.

---

## The failure it was built for

`UPLOAD_TODAY.md` §6 documented the last upload's actual problem, and it was
not the title, the tags or the posting time:

| Time | What a viewer saw |
|---|---|
| **0.00s** | **completely blank beige page** |
| 0.50s | YOUR SAVINGS ACCOUNT |
| 1.50s | YOUR SAVINGS ACCOUNT PAYS |
| ~5.0s | the complete claim, finally |

A thumb decides in roughly four tenths of a second. The video was judged on an
empty rectangle while the good part was still typing itself in underneath. The
kinetic reveal was a fine device — for beat three, not beat one.

Nothing in the build noticed, because nothing in the build was looking. Now
three things are:

1. **`Hook:` row** — the script names the exact text that must be complete on
   frame one.
2. **`frameZero` in the plan** — the director computes how long it must be held
   still to be readable, and the renderer obeys.
3. **`unwritten-hook` / `blank-frame-zero` QC** — a script with no frame-one
   line is a **FATAL** finding and `npm run gate` exits non-zero.

---

## The pipeline

```
script.md
   │  npm run script      → tools/parse-script.mjs
   ▼
video/src/script.json  +  video/src/voice.json (timing stub)
   │  npm run voice / align    → real narration + word timings
   │  npm run direct           → tools/direct.mjs
   ▼
video/src/director-plan.json   ← the edit: frame zero, camera, reveals,
   │                             music, silence, and who leaves where
   │  npm run qc               → findings, reasons, fixes
   │  npm run render
   ▼
out/final.mp4
```

Two commands matter while writing:

| command | what it tells you |
|---|---|
| `npm run direct` | the plan, the retention curve, and where it leaks |
| `npm run qc` | every finding, why it matters, and what to do about it |

Both take about two seconds. Run `qc` after every editing pass — it is the
fastest feedback loop in the project and it reads what a viewer would feel.

`npm run gate` is the same check with `--strict`: exit code 1 if anything is
FATAL. That is the one to put in front of a render once you trust it.

---

## What the director actually decides

Nine passes, all deterministic — the same script always produces the same
plan, so the renderer, the QC and the tests can never disagree about the edit.

| Pass | Question it answers |
|---|---|
| **frame zero** | what is legible on frame one, and for how long |
| **story** | what each beat is for (hook / turn / explain / proof / escalate / reveal / payoff / cta) |
| **curiosity** | is anything unresolved right now |
| **attention** | how often something has to change; what register the beat is in |
| **visual** | which module, which reveal, which caption mode — and is the frame repeating itself |
| **budget** | is too much moving at once, and what gets removed |
| **motion / audio** | camera, staged reveals, transitions, bed level, silence windows, accents |
| **swipe** | who leaves, where, and why |
| **assemble** | one artifact both the renderer and the QC read |

---

## The retention model, and its limits

`swipeCurve` estimates leaving as a hazard: each beat inherits the audience the
previous beat handed it and loses some share. The baseline comes from *when*
the beat happens; multipliers come from *what* it does — hook quality, open
loops, staleness, module repetition, information density, read speed, beat
length, and whether it is the ask.

Two honest caveats, because a number that looks precise gets trusted more than
it deserves:

1. **The constants are calibrated against the published shape of Shorts
   retention curves, not against this channel's analytics.** They rank two cuts
   of the same script against each other. They do not predict views.
2. **The model can only see the plan.** A boring idea, perfectly cut, scores
   well. The engine judges the edit — never the story.

Recalibrate `baselineHazard()` in `SwipeRisk.ts` once there are twenty uploads
of real retention data. Until then it is a comparator, not a forecast.

---

## The direction rows

Rows that stage the frame — `On-screen text`, `Visual`, `Motion FX`, `Module` —
work as they always did. These direct the *edit*. Every one is optional, and
every one you leave blank is a decision the machine makes on your behalf.

| Row | Values | What reads it |
|---|---|---|
| `Hook` | free text, **beat 1 only** | frame zero — the single highest-leverage row in the file |
| `Purpose` | hook, turn, explain, proof, escalate, reveal, payoff, cta | camera, music, silence, the arc, the retention model |
| `Question` | free text | opens a loop; the swipe model's largest single term |
| `Reveal` | free text: what the viewer now knows | music drop, pre-reveal silence, a boom, `sparse-reveals` QC |
| `Emotion` | curiosity, surprise, tension, recognition, indignation, clarity, relief, satisfaction | camera lean, music, `flat-emotion` QC |
| `Camera` | hold, push, pull, punch, settle | the camera; beat 1 is forced to `hold` regardless |
| `Music` | swell / drop / quiet / hold | the bed under this beat |
| `Silence` | pre / post / drop | carves the bed out around the line |
| `Sfx` | boom, riser, stamp, tick, chime, pop, whoosh, whoosh-up, shimmer, chime-warm, coin | an accent on top of the earned ones |
| `Caption mode` | NONE / EMPHASIS / SUBTITLE / FULL | how many words reach the frame |
| `Reveal mode` | IMMEDIATE / SEQUENTIAL / PROGRESSIVE / MASK / DRAW_ON / COUNTER_REVEAL / HIDDEN_THEN_REVEAL | staging |
| `Loop` | `true`, final beat | marks the frame built to cut back to frame one |
| `J-cut` / `L-cut` | seconds, e.g. `0.3` | audio leads / trails the picture |

---

## Rules the director will not let you break

These are enforced, not suggested. They exist because each one was a way a
Short died:

- **Beat one holds.** No camera move on the hook frame — a moving camera
  competes with reading the one line the whole video depends on.
- **Beat one reveals IMMEDIATE.** Whatever staging a module normally does, the
  first beat shows its complete claim on frame one.
- **Captions never fall below EMPHASIS.** The essay engine trims captions first
  to buy motion budget. A Short cannot: a large share of the feed is watched
  muted, so stripping the words trades the channel that is definitely reaching
  the viewer for one that might not be. The camera gets calmed instead.
- **No module runs back to back.** In thirty seconds a repeat reads as one long
  beat.
- **The ask comes after the payoff.** Asking before delivering loses the half
  of the audience still deciding.

---

## Reading the scores

```
hook            the first three seconds, weighted at 34% of the total
pacing          dead frames, overlong beats, average shot length
curiosity       is anything ever pending; do reveals land often enough
visualVariety   repetition, domination, frame competition, legibility
audio           bed movement, silence, accent density
loop            does the ending bring back what the hook planted
```

`OVERALL` blends the craft scores with the projected retention, because a cut
cannot honestly be "9 out of 10" while a fifth of the audience reaches the end.

```
under 6.0 → fix the findings before rendering
6.0–7.5   → renderable, but the top finding is worth an hour
over 7.5  → ship it
```

---

## Tests

```
npm run test:director     # 16 invariants
npm run check             # parser contract + the above
```

The invariants worth knowing about: the plan is deterministic, an unwritten
hook is FATAL, the retention curve never rises, a broken hook costs more than a
broken middle, and every scheduled sfx names a file that actually exists.

---

## What this does not do

It does not know whether the idea is good. It cannot tell you that "four
forgotten subscriptions" is a better video than "compound interest explained".
It will happily give a perfect score to a beautifully cut piece about nothing.

Picking what to make is still the whole job. This only makes sure that when you
pick well, the edit does not throw it away in the first two seconds.
