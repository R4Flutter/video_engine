# ASSET MANIFEST CONTRACT

The manifest is the handoff between the AI asset planner and the renderer/editor.

Use one entry per real production asset. Do not group unrelated files into a single entry.

## IMAGE ASSET FIELDS

Every image entry must declare its source before any prompt is written.

```json
{
  "filename": "membership_card.png",
  "slot": "03_EVIDENCE",
  "beat": "0:20",
  "purpose": "story-specific proof artifact",
  "type": "image",
  "format": "png",
  "width": 2048,
  "height": 1536,
  "aspectRatio": "4:3",
  "transparency": "alpha",
  "priority": "P1",
  "source": "USER_GENERATED_MANUAL",
  "provider": "EXTERNAL_IMAGE_GENERATOR",
  "stockQuery": null,
  "promptSource": "prompt/evidence.md",
  "prompt": "...",
  "negativePrompt": "...",
  "placement": "foreground, lower-right",
  "consistencyGroup": "evidence-paper"
}
```

Valid image source values:

- `REAL_STOCK` — real still acquired from Pexels/Pixabay. `prompt` and `negativePrompt` must be null; `stockQuery` is required.
- `USER_GENERATED_MANUAL` — user-generated/provided still. `prompt` is required; `stockQuery` is null.
- `EXTERNAL_BRAND_ASSET` — official/licensed brand artwork. No AI generation prompt.

## REAL_STOCK IMAGE ENTRY

Use for real-world photographs that do not require exact custom composition.

```json
{
  "filename": "gym_exterior_stock.jpg",
  "slot": "02_ARCHIVE",
  "beat": "0:02",
  "purpose": "real-world establishing photograph",
  "type": "image",
  "format": "jpg",
  "source": "REAL_STOCK",
  "provider": "PEXELS_OR_PIXABAY",
  "stockQuery": "1990s American gym exterior storefront",
  "prompt": null,
  "negativePrompt": null
}
```

The user does not generate or prompt this asset.

## USER_GENERATED_MANUAL IMAGE ENTRY

Use for exact story-specific or compositing assets.

```json
{
  "filename": "membership_card.png",
  "slot": "03_EVIDENCE",
  "beat": "0:20",
  "purpose": "story-specific proof artifact",
  "type": "image",
  "format": "png",
  "source": "USER_GENERATED_MANUAL",
  "provider": "EXTERNAL_IMAGE_GENERATOR",
  "stockQuery": null,
  "promptSource": "prompt/evidence.md",
  "prompt": "...",
  "negativePrompt": "..."
}
```

Only this source receives an executable user-generation prompt.

## VIDEO / B-ROLL FIELDS

B-roll is **not a user-generation prompt asset**. It is an engine-owned stock asset sourced automatically from Pexels/Pixabay.

```json
{
  "filename": "beat-04.mp4",
  "slot": "06_BROLL",
  "beat": "0:08",
  "purpose": "real-motion supporting cut",
  "type": "video",
  "format": "mp4",
  "source": "AUTO_STOCK",
  "footageQuery": "vintage camera laboratory",
  "generationPrompt": null
}
```

The runtime fetcher chooses the actual clip, filename, resolution and provenance. The user does not generate a video.

## VALIDATION RULES

- filename must be unique for generated/provided assets
- filename extension must match `type`
- dimensions must be explicit for generated/provided image assets
- transparency must be `alpha`, `opaque`, or `not_applicable` for image assets
- every image asset must declare `source`
- `REAL_STOCK` images must have a concrete `stockQuery` and no generation prompt
- `USER_GENERATED_MANUAL` images must have an executable generation prompt and no stock query
- `EXTERNAL_BRAND_ASSET` images must not contain an AI generation prompt
- every asset must have a beat or an explicit `global` scope
- every asset must have a purpose
- every B-roll entry must use `source: AUTO_STOCK`
- B-roll entries must not contain a video-generation prompt
- B-roll may contain a concise `footageQuery` for stock search
- B-roll duration/motion requirements belong to the runtime sourcing/director layer
- P0 assets must cover the core story claims
- unrelated assets must never share one manifest entry

## PRIORITIES

`P0` essential proof / hook / reveal

`P1` strong supporting visual

`P2` optional alternate / polish

## RENDERER HANDOFF

The renderer should use the manifest for deterministic lookup. The editor should not need to infer which file belongs to a beat from filenames alone.

For B-roll, the renderer consumes the locally downloaded asset registered by `video/src/footage.json`; the prompt pack only declares the need for motion and, optionally, the search intent.
