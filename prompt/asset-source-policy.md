# ASSET SOURCE POLICY

This is the authoritative routing policy for image assets in the production prompt system.

## PURPOSE

Every visual asset must be assigned a source before a prompt is written.

Primary image routes:

- `REAL_STOCK` — acquire a real photograph from **Pexels or Pixabay**. Do not write a user-generation prompt.
- `USER_GENERATED_MANUAL` — the user must generate/provide the asset manually. Write a complete standalone production prompt.

Video remains engine-owned `AUTO_STOCK` and is not part of the user image-generation workload.

## ROUTING RULE

1. If the visual is a real-world photograph, real person, real place, real activity, real environment, or generic physical object that stock can credibly represent → `REAL_STOCK`.
2. If it needs exact story-specific composition, controlled transparency, a custom evidence artifact, diagram, map, UI, graphic, utility overlay, or precise object that stock cannot provide → `USER_GENERATED_MANUAL`.
3. Never use generated imagery as factual archival evidence. If authenticity matters, require a real source; otherwise clearly treat a reconstruction as a reconstruction.
4. If stock is too generic, misleading, or cannot satisfy the exact visual requirement, use `USER_GENERATED_MANUAL`.

## REAL_STOCK — PEXELS/PIXABAY

Use stock for:

- real locations, storefronts, buildings and streets
- real people performing generic actions
- workplaces, factories, offices, gyms, laboratories and shops
- generic physical objects where exact identity is not required
- natural environments and atmospheric photography
- real-world establishing photographs
- suitable authentic archival/documentary photographs when available

For `REAL_STOCK`:

- `generationPrompt` must be `null`.
- provide a concrete `stockQuery`.
- do not ask the user to generate it.
- prefer searchable nouns and era/location terms over vague cinematic adjectives.

Example:

```text
Source: REAL_STOCK
Provider: PEXELS_OR_PIXABAY
Stock query: 1990s American gym exterior storefront
Generation prompt: NONE
```

## USER_GENERATED_MANUAL — WRITE THE PROMPT

Use manual generation for:

- receipts, bills, contracts, statements, certificates and membership cards
- exact story-specific objects and props
- transparent cutouts requiring controlled edges
- arrows, loops, callouts and utility overlays
- editorial charts and data graphics
- maps with exact highlighted regions
- custom UI/device mockups
- custom texture/background plates
- controlled recreations where composition is more important than authenticity
- exact product/prop arrangements stock cannot reliably provide
- any asset requiring exact dimensions, alpha, negative space or layer separation

For `USER_GENERATED_MANUAL`:

- `generationPrompt` is mandatory and standalone.
- specify subject, composition, view, lighting, materials, realism, dimensions, alpha/opaque requirement and failure conditions where relevant.
- use a deterministic filename.

## DO NOT CONFUSE STOCK WITH GENERATED ART

A real photograph should not be replaced by AI art merely because it looks more cinematic.

A custom evidence artifact should not be replaced by a generic stock document.

A historical factual photograph must not be fabricated and presented as authentic archival evidence.

## CATEGORY DEFAULTS

| Category | Default source | Override when |
|---|---|---|
| `01_SUBJECTS` | `USER_GENERATED_MANUAL` | a generic real subject is better represented by stock |
| `02_ARCHIVE` | `REAL_STOCK` | no authentic/suitable real image exists and a reconstruction is explicitly appropriate |
| `03_EVIDENCE` | `USER_GENERATED_MANUAL` | authentic source document is available and legally usable |
| `04_GRAPHICS` | `USER_GENERATED_MANUAL` | never use stock for a custom data graphic |
| `05_BACKGROUNDS` | `REAL_STOCK` | custom texture/plate/compositing requirement makes generation better |
| `06_BROLL` | `AUTO_STOCK` | never user-generate video in this system |
| `07_LOGOS` | `EXTERNAL_BRAND_ASSET` | never fabricate a trademark logo with AI |
| `08_UI_MOCKUPS` | `USER_GENERATED_MANUAL` | use a real screenshot when the actual UI is required and available |
| `09_MAPS` | `USER_GENERATED_MANUAL` | use an authentic licensed map when accuracy requires it |
| `10_MISC` | `USER_GENERATED_MANUAL` | generic photographic utility may use stock |

`EXTERNAL_BRAND_ASSET` means official/licensed brand artwork, not a user-generation task.

## PROMPT PACK OUTPUT RULE

The prompt pack contains executable prompts **only for `USER_GENERATED_MANUAL` assets**. `REAL_STOCK` and `AUTO_STOCK` entries contain routing metadata, not generation prompts.

Stock entry:

```text
Filename: gym_exterior_stock.jpg
Source: REAL_STOCK
Provider: PEXELS_OR_PIXABAY
Stock query: 1990s American gym exterior storefront
Generation prompt: NONE
Reason: real-world establishing photograph; stock is more authentic than generation
```

Manual entry:

```text
Filename: membership_card.png
Source: USER_GENERATED_MANUAL
Provider: EXTERNAL_IMAGE_GENERATOR
Generation priority: P1

Prompt:
<complete standalone production prompt>

Negative prompt:
<specific failure modes>
```

## QUALITY RULE

The goal is not more generated assets. The goal is the minimum set of believable real photographs plus the exact custom layers stock cannot provide.

When a believable real photograph and a generated approximation both satisfy the visual need, choose `REAL_STOCK`.
