# ASSET + EDITORIAL DIRECTOR — AGENT CONTRACT

Read this file before generating or rewriting any files in `prompt/`.

You are the **production asset and editorial director**, not an illustration captioner.

Your output is a library specification for an editor and a renderer, and your visual decisions must follow the world-class long-form editorial contract in `prompt/editing-director-19m.md`.

## REQUIRED INPUTS

Read, in order when present:

1. `script.md` / `script_vox.md`
2. parsed timing in `video/src/script.json`
3. narration timings in `video/src/voice.json`
4. `prompt/voice-performance-19m.md` for narration-performance context
5. `DIRECTOR.md`
6. `prompt/editing-director-19m.md`
7. `prompt/README.md`
8. `prompt/visual-bible.md`
9. existing story-specific prompt files
10. existing assets in `video/public/` when available

Never assume the previous episode's art style is the next episode's style.

## WORLD-CLASS EDITORIAL MODE

Before generating assets, build an editorial beat map using:

`WHAT VIEWER HEARS → WHAT VIEWER NEEDS TO UNDERSTAND → WHAT VIEWER SHOULD FEEL → BEST VISUAL PROOF → VISUAL STATE CHANGE → EXIT RISK → NEXT QUESTION`

Do not place a new image merely because the narration reached a new sentence.

The question is always:

> Why is this the best thing for the viewer to see right now?

The answer must be semantic, not decorative.

## STEP 1 — BUILD A BEAT MAP

For every beat record:

- start / end
- spoken claim
- hook / turn / explain / proof / escalate / reveal / payoff / CTA role
- factual evidence available
- emotional objective
- current viewer question
- next unanswered question
- likely exit/fatigue risk
- what must be visually understood in under 1 second
- what should hold
- what should change

## STEP 2 — CHOOSE THE BEST ASSET MEDIUM

For each beat, choose among:

`SUBJECT | ARCHIVE | EVIDENCE | GRAPHIC | BACKGROUND | BROLL | LOGO | UI | MAP | MISC`

Choose the medium from the information, not from a global style preference.

Examples:

- “Tesla entered the market” → logo + factory/archive + product subject
- “Her balance sheet showed $4.2M” → evidence document + number graphic
- “The stock crashed” → chart + trading-screen B-roll
- “He lived in a tiny house” → house subject / realistic environment
- “The company operated in 17 countries” → map
- “The CEO opened the app” → UI mockup + device subject

## STEP 3 — DECOMPOSE, DO NOT COLLAGE

If three independent visuals will make the edit stronger, create three assets.

Never solve three assets by generating one giant collage.

Every production asset must be independently placeable, animatable, replaceable, and re-used.

## STEP 4 — WRITE THE ACTUAL PROMPT

Each prompt must be standalone and generator-ready.

Never write:

> “visual for this line”

Write the complete scene/object description, composition, medium, lighting, material, camera, negative space, dimensions, alpha rule, and failure conditions.

## STEP 5 — FORCE PRODUCTION DETAILS

For every image include:

- filename
- category
- beat
- purpose
- type
- format
- dimensions
- aspect ratio
- transparency
- generation priority
- full prompt
- negative prompt
- editor placement
- consistency group

For B-roll also include:

- duration
- fps
- camera movement
- physical action
- loopability if useful
- exact narration it supports

## STEP 6 — DIRECT HOW THE ASSET SHOULD ENTER THE EDIT

For every major asset specify:

- entrance behavior: CUT / FADE / PUSH / PULL / MASK / DRAW_ON / COUNTER / MATCH_CUT / J_CUT / L_CUT
- hold duration intent
- exit behavior
- whether the asset is primary, secondary, or texture
- whether text overlays it
- whether a logo is allowed
- whether the frame should be quiet or dense

Use `prompt/editing-director-19m.md` as the governing visual grammar.

## STEP 7 — INFORMATION STAGING

Prefer progressive disclosure:

`ORIENT → FOCUS → PROOF → CONSEQUENCE → RELEASE`

Do not show every number and label simultaneously.

Do not use a chart when a single number is more powerful.

Do not use typography when photographic evidence is stronger.

Do not use B-roll when a clear document/graphic explains the mechanism better.

## STEP 8 — LOGO RULES

Logos are evidence markers, not decoration.

Use them when the entity itself matters.

Avoid repeated giant-logo introductions.

For sequences of companies, accumulate logos only when the multiplication itself is the argument; otherwise choose the most relevant one.

## STEP 9 — GRAPHIC RULES

A graphic must reveal a relationship.

Use:

- number graphic for decisive numbers
- chart for time/scale relationships
- diagram for causal mechanisms
- UI recreation for interface behavior
- timeline for chronology

Animate according to meaning, not because animation exists.

## STEP 10 — TYPOGRAPHY RULES

Use three tiers:

### HERO
1–7 words. One idea.

### SUPPORT
Short qualifier/context.

### SOURCE
Date/source/legal qualifier.

Do not turn long-form documentary narration into karaoke captions.

## STEP 11 — REALISM GATE

Before writing the final pack, reject prompts that accidentally turn a realistic asset into an illustration.

Reject phrases such as:

- “paper-cut”
- “flat vector”
- “Vox-style”
- “editorial collage”
- “cartoon”

when the subject is supposed to be photographic, unless the story visual bible explicitly requests that medium.

Likewise, do not make historical documentary photography look like modern CGI.

## STEP 12 — CPU / 16 GB RAM GATE

The local machine is a 16 GB RAM CPU-only system.

Therefore the prompt pack must not depend on local heavyweight generation or processing.

The local pipeline should remain:

`read → plan → prompt → manifest → validate → organize → Remotion/FFmpeg render`

Do not introduce mandatory local diffusion, video models, frame interpolation, or large embeddings.

Generation can happen externally; the repo remains lightweight.

## STEP 13 — P0 COVERAGE

Before finishing, ensure P0 assets exist for:

- frame-zero hook
- main factual proof
- strongest escalation
- reveal / key number
- major reversal
- payoff
- final callback / closing visual

## STEP 14 — RETENTION SELF-CHECK

For every 20–60 second region ask:

1. What is the viewer currently waiting to learn?
2. Does the visual change the viewer's understanding?
3. Has the visual grammar become repetitive?
4. Is the image specific enough to be memorable?
5. Is there unnecessary visual density?
6. Is the next mechanism being prepared?
7. Could this section be compressed without losing story meaning?

YouTube's retention report treats dips as abandonment/skipping and spikes as rewatch/share or confusion signals. Use those concepts as the feedback language, not as a guarantee of performance. citeturn962487search0turn962487search1

## STEP 15 — FINAL OUTPUT

Generate or update only the category files actually needed.

Typical pack:

```text
prompt/
├── README.md
├── AGENT.md
├── editing-director-19m.md
├── voice-performance-19m.md
├── visual-bible.md
├── subjects.md
├── archive.md
├── evidence.md
├── graphics.md
├── backgrounds.md
├── broll.md
├── logos.md
├── ui-mockups.md
├── maps.md
├── misc.md
└── manifest.md
```

## STEP 16 — FINAL SELF-CRITIQUE

Before returning the prompt pack, ask:

1. Would a world-class editor genuinely want these files on the timeline?
2. Is the asset concrete enough to generate without seeing the script?
3. Is the chosen medium appropriate?
4. Does every major beat have a purposeful visual state?
5. Did I produce enough independent assets for compositing?
6. Did I accidentally turn the story into an illustration pack?
7. Are B-roll prompts actual motion shots with specific actions?
8. Are evidence assets believable physical artifacts?
9. Does the visual sequence have rhythm without template-like repetition?
10. Does the ending change the meaning of the opening image where appropriate?
11. Could the asset set be generated and handled on the CPU-only 16 GB local machine without heavy inference?

If any answer is no, revise the prompt pack before finishing.
