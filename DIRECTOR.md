# The director

This repository now has two editorial modes: **SHORTS** and **LONGFORM_19M**. They must never share retention assumptions.

For **The Company That Sells You Nothing**, the production mode is **LONGFORM_19M** and `prompt/editing-director-19m.md` is the controlling editorial specification.

The Shorts rules described later in this document remain available for actual short-form episodes, but they do **not** override the 19-minute director. In particular, long-form is not allowed to inherit Shorts constraints such as constant caption pressure, mandatory rapid visual changes, loop-oriented endings, or a global hold/punch rhythm.

## Long-form authority

For the 19:14 documentary, the precedence order is:

1. `script.md` — human-readable story and narration authority.
2. `script_beats.md` — parser-safe production representation of that story.
3. `prompt/editing-director-19m.md` — camera, B-roll, evidence, sound, transition, and retention direction.
4. `tools/direct.mjs` — deterministic plan generation.
5. `tools/qc.mjs` / `tools/story-qc.mjs` — production gates.
6. Remotion — rendering only; it must not invent editorial intent.

## Long-form principles

The film is judged on sustained curiosity, not swipe survival. The retention arc is:

`mystery → answer → complication → proof → reversal → payoff`

Camera movement is motivated by a narrative verb: establish, notice, investigate, escalate, compare, reverse, reveal, reflect, resolve.

B-roll is evidence. A shot must answer a noun or verb in the narration; generic "business" footage is a failure.

Important evidence becomes **more stable** when it lands. Dense numbers and legal documents should not be buried under motion.

The final callback reuses the opening image with a changed meaning. The ending is a practical viewer action, not a generic subscription CTA.

## Pipeline

```
script.md
   │  editorial master
   ▼
script_beats.md
   │  parser-safe 40-beat / 19:14 production representation
   ▼
video/src/script.json + voice.json
   │
   ├─ voice / align
   ├─ footage (Pexels + Pixabay)
   ├─ direct
   ├─ story-qc + qc
   └─ VoxWide (1920×1080)
            │
            ▼
       out/vox.mp4
```

The 19-minute episode should be run with:

```console
cd video
npm run episode:vox
```

### Quality gate

Before rendering, the director must be able to answer yes to these:

- frame zero states the contradiction immediately,
- every chapter has a forward question,
- the film changes industry at the midpoint,
- the film contains genuine reversals,
- every B-roll shot is semantically justified,
- important evidence is readable before motion resumes,
- camera movement has a purpose point,
- the opening visual returns with new meaning,
- the ending resolves rather than selling.

## Legacy Shorts section

The original Shorts guidance below is retained for genuine short-form episodes only. If an episode is 16:9, targets a runtime around 19 minutes, or explicitly selects `LONGFORM_19M`, the long-form rules above take precedence.

---

## Legacy Shorts guidance

A Short is not a short essay. An essay is judged on whether it holds a viewer who already chose to watch. A Short is judged on whether it survives a thumb that has not chosen anything yet.

The original Shorts pipeline uses `script.md → parse-script.mjs → direct.mjs → director-plan.json`, with frame-zero checks, compact beats, caption emphasis, and a post-payoff CTA. Those constraints remain useful when the project is actually producing Shorts.

The long-form director intentionally does not inherit those constraints.
