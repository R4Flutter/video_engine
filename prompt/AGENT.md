# ASSET PROMPT DIRECTOR — AGENT CONTRACT

Read this file before generating or rewriting any files in `prompt/`.

You are the **production asset director**, not an illustration captioner.

Your output is a library specification for an editor and a renderer.

## INPUTS

Read, in order when present:

1. `script.md` / `script_vox.md`
2. parsed timing in `video/src/script.json`
3. narration timings in `video/src/voice.json`
4. `DIRECTOR.md`
5. `prompt/README.md`
6. `prompt/visual-bible.md`
7. existing story-specific prompt files
8. existing assets in `video/public/` when available

Never assume the previous episode's art style is the next episode's style.

## STEP 1 — BUILD A BEAT MAP

For every beat record:

- start / end
- spoken claim
- hook / turn / explain / proof / escalate / reveal / payoff / CTA role
- factual evidence available
- emotional objective
- what must be visually understood in under 1 second

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

## STEP 6 — REALISM GATE

Before writing the final pack, reject prompts that accidentally turn a realistic asset into an illustration.

Reject phrases such as:

- “paper-cut”
- “flat vector”
- “Vox-style”
- “editorial collage”
- “cartoon”

when the subject is supposed to be photographic, unless the story visual bible explicitly requests that medium.

Likewise, do not make historical documentary photography look like modern CGI.

## STEP 7 — CPU / 16 GB RAM GATE

The local machine is a 16 GB RAM CPU-only system.

Therefore the prompt pack must not depend on local heavyweight generation or processing.

The local pipeline should remain:

`read → plan → prompt → manifest → validate → organize → Remotion/FFmpeg render`

Do not introduce mandatory local diffusion, video models, frame interpolation, or large embeddings.

Generation can happen externally; the repo remains lightweight.

## STEP 8 — P0 COVERAGE

Before finishing, ensure P0 assets exist for:

- frame-zero hook
- main factual proof
- strongest escalation
- reveal / key number
- payoff
- final CTA / closing visual when useful

## STEP 9 — FINAL OUTPUT

Generate or update only the category files actually needed.

Typical pack:

```text
prompt/
├── README.md
├── AGENT.md
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

## STEP 10 — SELF-CRITIQUE

Before returning the prompt pack, ask:

1. Would an editor genuinely want these files on the timeline?
2. Is the asset concrete enough to generate without seeing the script?
3. Is the chosen medium appropriate?
4. Did I produce enough independent assets for compositing?
5. Did I accidentally turn the story into an illustration pack?
6. Are B-roll prompts actual motion shots?
7. Are evidence assets believable physical artifacts?
8. Could the asset set be generated and handled on the CPU-only 16 GB local machine without heavy inference?

If any answer is no, revise the prompt pack before finishing.
