# PRODUCTION ASSET PROMPT SYSTEM

This folder is the **visual production specification** for the episode. It is not a VOX-style illustration prompt library.

The agent's job is to turn the script into a **real, editable image asset pack**: isolated subjects, archive/documentary stills, evidence artifacts, designed graphics, cinematic backgrounds, logos, UI mockups, maps, and utility overlays. Video/B-roll is handled automatically by the engine from Pexels/Pixabay and is **not a user-generated prompt deliverable**.

## NON-NEGOTIABLE RULE

**DO NOT WRITE VIDEO-GENERATION PROMPTS.**

From this point forward, the asset-prompt system generates prompts only for **image assets**. If a beat would benefit from motion/B-roll:

1. identify that the beat needs video;
2. specify a concise `footage_query` / stock-search intent when useful;
3. let `tools/fetch-footage.py` automatically search Pexels + Pixabay;
4. let the engine choose, download, and register the best MP4;
5. do **not** include a video generation prompt in the prompt pack.

The user only needs to generate/provide the image assets requested by the prompt pack. The engine owns sourced video assets.

## ASSET CLASS OWNERSHIP

| Asset class | Prompt system output | Default medium |
|---|---|---|
| `01_SUBJECTS` | **YES — generate image prompt** | photorealistic isolated object/person/product |
| `02_ARCHIVE` | **YES — generate image prompt** | period-correct documentary still |
| `03_EVIDENCE` | **YES — generate image prompt** | realistic physical document/artifact |
| `04_GRAPHICS` | **YES — generate image prompt** | editorial designed graphic/data viz |
| `05_BACKGROUNDS` | **YES — generate image prompt** | cinematic environment / texture plate |
| `06_BROLL` | **NO — engine sources video** | Pexels/Pixabay MP4 |
| `07_LOGOS` | **YES — generate image prompt** | clean isolated brand mark |
| `08_UI_MOCKUPS` | **YES — generate image prompt** | believable interface/device mockup |
| `09_MAPS` | **YES — generate image prompt** | editorial geographic graphic |
| `10_MISC` | **YES — generate image prompt** | isolated utility mark |

A story may use several classes in the same beat.

## VIDEO/B-ROLL IS ENGINE-OWNED

When a beat needs real motion, the planner must **not** create a B-roll generation prompt.

Use this planning pattern instead:

```text
Asset class: 06_BROLL
Type: video
Source: AUTO_STOCK
Footage query: vintage 1970s digital camera laboratory Kodak engineer
Duration target: 2–5s
Purpose: archival/mechanism cut
```

`Footage query` is optional. The fetcher can derive a search query from the beat's visual/reveal/VO when no explicit query is supplied.

The runtime pipeline is:

```text
script
  ↓
beat requires footage
  ↓
Pexels + Pixabay search
  ↓
score orientation / resolution / duration
  ↓
download best MP4
  ↓
video/public/footage/
  ↓
video/src/footage.json
  ↓
Remotion render
```

The current engine already runs the footage stage inside the Vox episode pipeline. `tools/fetch-footage.py` is responsible for sourcing and registering the video asset.

## ASSET-FIRST THINKING

For every beat, answer in this order:

1. What factual claim is being made?
2. What visual would prove or clarify it?
3. Is that visual an object, historical image, document, statistic, environment, action, brand, interface, map, or utility?
4. Does one asset communicate it or do multiple independent layers communicate it better?
5. What exact file should the editor receive?

If the answer is **video/action**, route it to `06_BROLL` and stock sourcing. Do not write a generation prompt.

Prefer **specific visual evidence** over symbolic representation.

Bad:

> illustration representing a billionaire becoming richer

Good image asset plan:

- `subject_founder.png`
- `archive_company_office.jpg`
- `evidence_stock_certificate.png`
- `graphics_growth_curve.png`
- `background_financial_district.jpg`

Good video routing:

- `broll_trading_screen.mp4` → AUTO_STOCK, query `stock market trading screens`

## PRODUCTION QUALITY BAR

Every **image prompt** must be independently executable without the model seeing the rest of the script.

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

**Do not add duration, FPS, camera-motion, or video-generation instructions to image prompts.** Those belong to the engine's stock-video sourcing layer.

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

**No default video dimensions belong in the user prompt pack.** Video resolution/duration is handled by the sourcing pipeline.

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
- source/cache stock video metadata and files
- render with the existing Remotion/FFmpeg pipeline

Heavy image generation is external/model-provider work. Video generation is **not part of the user's asset-generation workload**.

## FILENAME CONTRACT

For generated/provided image assets use:

`<category>_<subject>_<variant>.<ext>`

Examples:

- `lambo_side.png`
- `founder_portrait.png`
- `wall_street_1929.jpg`
- `stock_certificate.png`
- `revenue_report.png`
- `trading_room.jpg`
- `tesla.png`
- `stock_app.png`
- `world_map.png`
- `arrow_up.png`

Stock video filenames are runtime-owned, e.g. `beat-04.mp4`. Do not ask the user to generate or rename them.

Never use `image1.png`, `final.png`, `asset.png`, `visual.png`, `temp.png`, or opaque IDs for generated images.

## BEAT COVERAGE

A strong 30–60 second short normally needs a **library**, not one picture per beat. As a starting range:

- 8–20 primary image assets
- 5–15 supporting image assets
- 3–8 graphic assets
- 3–8 automatically sourced B-roll clips
- utility assets only where they add edit value

These are planning ranges, not a quota. Do not generate meaningless assets just to hit a number.

**The B-roll count is a runtime sourcing target, not a number of prompts the user must generate.**

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

A historical photograph stays photographic. A financial statement stays a document. A Lamborghini cutout stays a clean product/automotive asset. A chart stays a chart. Stock video remains real motion sourced by the engine.

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
├── logos.md
├── ui-mockups.md
├── maps.md
└── misc.md
```

**Do not create `broll.md` as a video-generation prompt library.** If a story needs B-roll, record stock-search intent in the manifest/asset plan and let the engine source it.

Do not create empty category files just for appearance. If a category has no valid use in the story, omit it from the generated pack or mark it `NOT USED` in the manifest.

## REQUIRED IMAGE ENTRY FORMAT

Every generated/provided image asset entry must contain:

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
<standalone production-ready image prompt>

Negative prompt:
<specific failure modes>

Placement:
<how the editor uses it>

Consistency group:
<visual-bible group>
```

For a video need, use a routing entry instead:

```text
Filename: beat-04.mp4
Slot: 06_BROLL
Beat: 0:08
Purpose: real-motion supporting cut
Type: video
Source: AUTO_STOCK
Footage query: vintage camera laboratory
Generation prompt: NONE

The engine owns acquisition, filename, resolution selection, download, and provenance.
```

## GENERATION PRIORITY

Use priorities so a CPU-only workflow can work incrementally:

- `P0` = essential to understand the story
- `P1` = strong supporting visual
- `P2` = optional polish / alternate shot

Generate P0 first, then P1, then P2 only when the cut needs them.

Do not count automatically sourced video as a user generation task.

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

For image prompts, never include instructions that imply the output should be a video.

## FINAL QC

Before the prompt pack is considered production-ready, the agent must verify:

- every important beat has a visual strategy
- assets are concrete and independent
- asset class is appropriate
- filenames are deterministic
- dimensions are specified for generated images
- alpha requirements are explicit where needed
- video needs are routed to AUTO_STOCK rather than written as generation prompts
- no two assets are needlessly fused into one image
- no story-wide style drift
- image prompts are directly executable
- P0 assets cover the hook, proof, escalation, reveal, payoff, and CTA
- the plan is feasible on a 16 GB CPU-only local machine

The goal is not “more prompts.” The goal is a **professional image asset library + automatic video-sourcing layer that an editor can actually assemble.**
