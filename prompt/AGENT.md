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
7. `prompt/asset-source-policy.md`
8. existing story-specific prompt files
9. existing assets in `video/public/` when available

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

## STEP 3 — CHOOSE THE SOURCE BEFORE WRITING A PROMPT

Every visual asset must receive a source classification before any prompt is written. Read `prompt/asset-source-policy.md` as the authoritative source-routing contract.

Use exactly one primary source value for image assets:

- `REAL_STOCK` → real photograph acquired from Pexels/Pixabay. **Do not write a generation prompt.** Write only a concrete stock query/routing entry.
- `USER_GENERATED_MANUAL` → user must generate/provide the image. **Write the complete standalone production prompt.**
- `EXTERNAL_BRAND_ASSET` → official/licensed brand artwork. **Do not fabricate trademarks with AI.**
- `AUTO_STOCK` → engine-owned video/B-roll. **Do not write a video-generation prompt.**

Decision rule:

1. If a believable real photograph can communicate the visual without requiring exact custom composition → `REAL_STOCK`.
2. If the asset is story-specific, evidence-like, transparent, graphical, UI-based, map-based, or requires exact composition → `USER_GENERATED_MANUAL`.
3. If authenticity is a factual requirement, never invent an AI image and present it as archival evidence.
4. When real stock and generated approximation are both acceptable, prefer `REAL_STOCK`.

### CRITICAL OUTPUT RULE

**Only `USER_GENERATED_MANUAL` assets receive executable generation prompts.**

Do not waste prompt text on stock photographs. A stock entry must say `Generation prompt: NONE` and contain `Stock query: ...`.

## STEP 4 — DECOMPOSE, DO NOT COLLAGE

If three independent visuals will make the edit stronger, create three assets.

Never solve three assets by generating one giant collage.

Every production asset must be independently placeable, animatable, replaceable, and re-used.

## STEP 5 — WRITE THE ACTUAL PROMPT

For `USER_GENERATED_MANUAL` assets, each prompt must be standalone and generator-ready.

Never write:

> “visual for this line”

Write the complete scene/object description, composition, medium, lighting, material, camera, negative space, dimensions, alpha rule, and failure conditions.

For `REAL_STOCK` assets, do not write a generation prompt. Write a concise, searchable stock query with subject + place/era/action when relevant.

## STEP 6 — FORCE PRODUCTION DETAILS

For every image include:

- filename
- category
- source
- beat
- purpose
- type
- format
- dimensions
- aspect ratio
- transparency
- generation priority
- prompt only when source is `USER_GENERATED_MANUAL`
- stock query only when source is `REAL_STOCK`
- editor placement
- consistency group

For B-roll also include:

- duration
- fps
- camera movement
- physical action
- loopability if useful
- `source: AUTO_STOCK`
- no generation prompt

## STEP 7 — REALISM GATE

Before writing the final pack, reject prompts that accidentally turn a realistic asset into an illustration.

Reject phrases such as:

- “paper-cut”
- “flat vector”
- “Vox-style”
- “editorial collage”
- “cartoon”

when the subject is supposed to be photographic, unless the story visual bible explicitly requests that medium.

Likewise, do not make historical documentary photography look like modern CGI.

## STEP 8 — CPU / 16 GB RAM GATE

The local machine is a 16 GB RAM CPU-only system.

Therefore the prompt pack must not depend on local heavyweight generation or processing.

The local pipeline should remain:

`read → plan → source-route → prompt only manual assets → manifest → validate → organize → Remotion/FFmpeg render`

Generation can happen externally; the repo remains lightweight.

## STEP 9 — P0 COVERAGE

Before finishing, ensure P0 assets exist for:

- frame-zero hook
- main factual proof
- strongest escalation
- reveal / key number
- payoff
- final CTA / closing visual when useful

## STEP 10 — FINAL OUTPUT

Generate or update only the category files actually needed.

Typical pack:

```text
prompt/
├── README.md
├── AGENT.md
├── asset-source-policy.md
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
└── misc.md
```

Never create a generation prompt for `REAL_STOCK` or `AUTO_STOCK`.

## STEP 11 — SELF-CRITIQUE

Before returning the prompt pack, ask:

1. Would an editor genuinely want these files on the timeline?
2. Is the asset concrete enough to generate without seeing the script?
3. Is the chosen medium appropriate?
4. Is the source classification correct?
5. Did I avoid generating a stock-replaceable real photograph?
6. Did I produce enough independent assets for compositing?
7. Did I accidentally turn the story into an illustration pack?
8. Are B-roll needs routed to AUTO_STOCK?
9. Are evidence assets believable physical artifacts?
10. Could the asset set be generated and handled on the CPU-only 16 GB local machine without heavy inference?

If any answer is no, revise the prompt pack before finishing.
