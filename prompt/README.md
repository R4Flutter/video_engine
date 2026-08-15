# PRODUCTION ASSET PROMPT SYSTEM

This folder is the **visual production specification** for the episode. It is not a VOX-style illustration prompt library.

The agent's job is to turn the script into a **real, editable asset pack**: isolated subjects, archive/documentary stills, evidence artifacts, designed graphics, cinematic backgrounds, B-roll video, logos, UI mockups, maps, and utility overlays. Each useful visual is an independent production asset with a deterministic filename, format, dimensions, transparency rule, beat, purpose, and generator-ready prompt.

## NON-NEGOTIABLE RULE

**Do not default every story to paper-cut, flat vector, collage, infographic, or VOX style.**

Use the medium that best represents the claim:

| Asset class | Default medium | Typical output |
|---|---|---|
| `01_SUBJECTS` | photorealistic isolated object/person/product | transparent PNG |
| `02_ARCHIVE` | period-correct documentary photography | JPG/PNG |
| `03_EVIDENCE` | realistic physical document/artifact | PNG/JPG |
| `04_GRAPHICS` | editorial designed graphic/data viz | transparent PNG/SVG |
| `05_BACKGROUNDS` | cinematic environment / texture plate | JPG/PNG |
| `06_BROLL` | realistic motion/video | MP4 |
| `07_LOGOS` | clean isolated brand mark | transparent PNG/SVG |
| `08_UI_MOCKUPS` | believable interface/device mockup | PNG |
| `09_MAPS` | editorial geographic graphic | PNG/SVG |
| `10_MISC` | isolated utility mark | transparent PNG/SVG |

A story may use several classes in the same beat.

## ASSET-FIRST THINKING

For every beat, answer in this order:

1. What factual claim is being made?
2. What visual would prove or clarify it?
3. Is that visual an object, historical image, document, statistic, environment, action, brand, interface, map, or utility?
4. Does one asset communicate it or do multiple independent layers communicate it better?
5. What exact file should the editor receive?

Prefer **specific visual evidence** over symbolic representation.

Bad:

> illustration representing a billionaire becoming richer

Good asset plan:

- `subject_founder.png`
- `archive_company_office.jpg`
- `evidence_stock_certificate.png`
- `graphics_growth_curve.png`
- `background_financial_district.jpg`
- `broll_trading_screen.mp4`

## PRODUCTION QUALITY BAR

Every prompt must be independently executable without the model seeing the rest of the script.

Each image prompt must specify, where relevant:

- exact subject
- era / historical accuracy
- viewpoint / camera angle
- framing
- composition / placement
- negative space for captions
- lighting
- material / surface
- environment
- color palette
- realism or art medium
- aspect ratio
- exact dimensions
- transparency requirement
- edge quality / compositing requirement
- what must not appear

Every B-roll prompt must also specify:

- duration target
- camera movement
- lens / perspective when relevant
- subject motion
- environmental motion
- realism
- frame rate intent when important
- prohibited objects / text / watermarks

## TRANSPARENT ASSET RULE

For compositing assets, the prompt must literally state:

`TRANSPARENT BACKGROUND — REAL ALPHA CHANNEL — NO WHITE OR CHECKERBOARD BACKGROUND`

The generated file must be a true alpha PNG. A fake checkerboard or white matte is invalid.

## DEFAULT DIMENSIONS

Use the script-specific requirement first. Otherwise use:

- Isolated subjects / props: `2048x2048` PNG
- Vertical plates: `1080x1920` PNG/JPG
- Wide environments / graphics: `2048x1152` PNG/JPG
- Evidence documents: `2048x1536` PNG/JPG
- Logos / utility marks: `2048x2048` transparent PNG/SVG
- Maps: `2048x1152` PNG/SVG
- UI mockups: `2048x1152` PNG
- B-roll: `1920x1080` MP4, 3–8 seconds by default

Never silently change an aspect ratio because it is easier for a generator.

## CPU / 16 GB RAM CONSTRAINT

The prompt system must be **CPU-first and memory-conscious**.

Do not design a workflow that requires the local machine to run large diffusion/video models, frame interpolation, upscaling stacks, or multi-model orchestration.

The local pipeline should only:

- parse prompts
- generate manifests
- validate filenames
- validate dimensions and alpha
- organize assets
- create lightweight composites
- render with the existing Remotion/FFmpeg pipeline

Heavy image/video generation is external or model-provider work. Do not add a local GPU requirement to the asset specification.

For local checks prefer deterministic, low-memory tools and stream files rather than loading complete video collections into RAM.

## FILENAME CONTRACT

Use:

`<category>_<subject>_<variant>.<ext>`

Examples:

- `lambo_side.png`
- `founder_portrait.png`
- `wall_street_1929.jpg`
- `stock_certificate.png`
- `revenue_report.png`
- `trading_room.jpg`
- `car_drive.mp4`
- `tesla.png`
- `stock_app.png`
- `world_map.png`
- `arrow_up.png`

Never use `image1.png`, `final.png`, `asset.png`, `visual.png`, `temp.png`, or opaque IDs.

## BEAT COVERAGE

A strong 30–60 second short normally needs a **library**, not one picture per beat. As a starting range:

- 8–20 primary image assets
- 5–15 supporting assets
- 3–8 graphic assets
- 3–8 B-roll clips
- utility assets only where they add edit value

These are planning ranges, not a quota. Do not generate meaningless assets just to hit a number.

## VISUAL CONSISTENCY

Consistency means the whole asset pack feels like it belongs to the same film, while each medium remains appropriate.

Define a visual bible before writing prompts:

- primary / secondary colors
- contrast level
- grain / texture
- lighting language
- camera language
- documentary treatment
- graphic system
- shadow language for cutouts
- compositing assumptions
- typography zone / safe area

Do not turn that bible into a global art-style straitjacket.

A historical photograph stays photographic. A financial statement stays a document. A Lamborghini cutout stays a clean product/automotive asset. A chart stays a chart.

## OUTPUT FILES

The production prompt pack should contain these files when the story needs them:

```text
prompt/
├── README.md
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

Do not create empty category files just for appearance. If a category has no valid use in the story, omit it from the generated pack or mark it `NOT USED` in the manifest.

## REQUIRED ENTRY FORMAT

Every asset entry must contain:

```text
Filename: stock_certificate.png
Slot: 03_EVIDENCE
Beat: 0:18
Purpose: factual proof / hero artifact
Type: image
Format: PNG
Dimensions: 2048x1536
Transparency: REAL ALPHA (or OPAQUE if photographed)
Generation priority: P0

Prompt:
<standalone production-ready prompt>

Negative prompt:
<specific failure modes>

Placement:
<how the editor uses it>

Consistency group:
<visual-bible group>
```

For video add:

```text
Duration: 5s
FPS: 24 or 30
Camera motion: <exact movement>
```

## GENERATION PRIORITY

Use priorities so a CPU-only workflow can work incrementally:

- `P0` = essential to understand the story
- `P1` = strong supporting visual
- `P2` = optional polish / alternate shot

Generate P0 first, then P1, then P2 only when the cut needs them.

## HARD NEGATIVES

Unless the asset explicitly needs them, never bake in:

- captions
- subtitles
- UI chrome
- watermarks
- fake logos
- random typography
- decorative borders
- collage sheets
- contact sheets
- multiple unrelated assets in one image
- generic “VOX-style” treatment
- unnecessary people or faces
- modern objects inside historical scenes

## FINAL QC

Before the prompt pack is considered production-ready, the agent must verify:

- every important beat has a visual strategy
- assets are concrete and independent
- asset class is appropriate
- filenames are deterministic
- dimensions are specified
- alpha requirements are explicit
- B-roll is described as actual motion, not a still-image prompt
- no two assets are needlessly fused into one image
- no story-wide style drift
- prompts are directly executable
- P0 assets cover the hook, proof, escalation, reveal, payoff, and CTA
- the plan is feasible on a 16 GB CPU-only local machine

The goal is not “more prompts.” The goal is a **professional asset library that an editor can actually assemble.**
