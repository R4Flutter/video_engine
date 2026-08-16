# PRODUCTION ASSET PROMPT SYSTEM

This folder is the visual production specification for an episode. It is **not** a generic AI-art prompt library.

The planner produces the smallest professional asset library an editor needs: believable real photographs from stock where stock is correct, plus custom generated layers where exact control is required.

## AUTHORITATIVE SOURCE ROUTING

Read `asset-source-policy.md` before planning assets.

Every visual must be source-routed **before** a prompt is written:

| Source | Meaning | User generates? | Prompt? |
|---|---|---:|---:|
| `REAL_STOCK` | Real still from Pexels/Pixabay | No | No; stock query only |
| `USER_GENERATED_MANUAL` | Custom image the user generates/provides | Yes | Yes |
| `EXTERNAL_BRAND_ASSET` | Official/licensed brand artwork | No | No |
| `AUTO_STOCK` | Engine-owned Pexels/Pixabay video | No | No; footage query only |

### GOLDEN RULE

**If a believable real photograph can do the job, use `REAL_STOCK`. If the edit needs an exact custom artifact, transparent layer, graphic, UI, map, evidence insert, or controlled composition, use `USER_GENERATED_MANUAL`.**

Do not generate a fake photograph just because it is more cinematic. Do not use a generic stock document when the story needs a specific evidence artifact.

## REAL_STOCK — PEXELS / PIXABAY

Use `REAL_STOCK` for:

- real locations, storefronts, buildings and streets
- real people doing generic actions
- real gyms, offices, factories, shops and laboratories
- generic physical objects when exact identity is not important
- natural environments and atmospheric establishing photography
- suitable authentic archival/documentary photographs

Stock entry:

```text
Source: REAL_STOCK
Provider: PEXELS_OR_PIXABAY
Stock query: 1990s American gym exterior storefront
Generation prompt: NONE
```

Never give the user a generation prompt for a stock asset.

## USER_GENERATED_MANUAL — PROMPTS ONLY HERE

Use `USER_GENERATED_MANUAL` for:

- evidence documents, receipts, bills, statements and membership cards
- exact story-specific objects and props
- transparent PNG cutouts requiring controlled edges
- arrows, loops and callouts
- charts and data graphics
- exact maps/highlights
- UI/device mockups
- custom background/texture plates
- controlled recreations where exact composition is required
- precise product/prop arrangements unavailable from stock

Every manual asset gets a complete standalone production prompt, negative prompt, dimensions, alpha/opaque rule, placement and consistency group.

## VIDEO / B-ROLL

B-roll is engine-owned. The prompt system does **not** write video-generation prompts.

```text
Source: AUTO_STOCK
Footage query: vintage camera laboratory
Generation prompt: NONE
```

The runtime searches Pexels/Pixabay, chooses and downloads the clip, registers provenance, and handles duration/cropping.

## ASSET CLASSES

| Slot | Default routing |
|---|---|
| `01_SUBJECTS` | Manual unless a real generic photograph is clearly better |
| `02_ARCHIVE` | Real stock/authentic archive |
| `03_EVIDENCE` | Manual unless an authentic source document is available |
| `04_GRAPHICS` | Manual |
| `05_BACKGROUNDS` | Stock for real environments; manual for custom plates/textures |
| `06_BROLL` | Auto stock |
| `07_LOGOS` | Official/licensed external asset |
| `08_UI_MOCKUPS` | Manual unless a real screenshot is required |
| `09_MAPS` | Manual |
| `10_MISC` | Manual unless a generic photograph is sufficient |

Defaults may be overridden by the actual visual requirement.

## REQUIRED IMAGE ENTRY

```text
Filename:
Slot:
Beat:
Purpose:
Type: image
Format:
Dimensions:
Transparency:
Source: REAL_STOCK | USER_GENERATED_MANUAL | EXTERNAL_BRAND_ASSET
Provider:
Generation priority: P0 | P1 | P2
Stock query: <only for REAL_STOCK>

Prompt:
<only for USER_GENERATED_MANUAL>

Negative prompt:
<only for USER_GENERATED_MANUAL>

Placement:
Consistency group:
```

## PRODUCTION QUALITY BAR

Manual prompts must specify, where relevant:

- exact subject
- era and historical accuracy
- viewpoint/camera angle
- framing and composition
- negative space for captions
- lighting
- material/surface detail
- environment
- realistic color and exposure
- exact dimensions/aspect ratio
- transparency or opaque requirement
- edge/compositing requirements
- explicit failure conditions

Transparent assets must state:

`TRANSPARENT BACKGROUND — REAL ALPHA CHANNEL — NO WHITE OR CHECKERBOARD BACKGROUND`

Never include captions, subtitles, watermarks, fake logos, random typography, decorative borders, contact sheets, collage sheets, unrelated objects, or video instructions unless explicitly required.

## DEFAULT DIMENSIONS

- isolated subjects/props: `2048x2048` PNG
- vertical plates: `1080x1920` PNG/JPG
- wide environments/graphics: `2048x1152` PNG/JPG
- evidence documents: `2048x1536` PNG/JPG
- logos/utility marks: `2048x2048` transparent PNG/SVG when licensed/source-controlled
- maps: `2048x1152` PNG/SVG
- UI mockups: `2048x1152` PNG

## PRIORITIES

- `P0` essential hook/proof/reveal
- `P1` strong supporting visual
- `P2` optional polish/alternate

Do not generate assets just to hit a quota. A short needs a focused library, not one generated image per beat.

## CPU / 16 GB RAM

The local pipeline stays CPU-first:

`read → beat map → source-route → prompt manual assets → manifest → validate → organize → Remotion/FFmpeg render`

No mandatory local diffusion, video generation, frame interpolation, heavyweight embeddings, or other large-model inference belongs in the production asset pipeline.

## FINAL QC

Before acceptance:

- every important beat has a visual strategy
- every asset has an explicit source
- stock-replaceable photographs are not unnecessarily generated
- only manual assets have generation prompts
- stock assets have concrete searchable queries
- B-roll is `AUTO_STOCK`
- evidence is believable and independently compositable
- filenames and dimensions are deterministic
- alpha requirements are explicit
- P0 assets cover hook, proof, escalation, reveal and payoff
- no fake historical evidence is presented as authentic
- the pack remains feasible on the 16 GB CPU-only local machine

The goal is **professional real-world visuals + exact custom assets**, not maximum AI generation.
