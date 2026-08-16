# ASSET MANIFEST CONTRACT

The manifest is the handoff between the AI asset planner and the renderer/editor.

Use one entry per real production asset. Do not group unrelated files into a single entry.

## IMAGE ASSET FIELDS

Generated/provided image assets use:

```json
{
  "filename": "lambo_side.png",
  "slot": "01_SUBJECTS",
  "beat": "0:04",
  "purpose": "hero foreground subject",
  "type": "image",
  "format": "png",
  "width": 2048,
  "height": 2048,
  "aspectRatio": "1:1",
  "transparency": "alpha",
  "priority": "P0",
  "promptSource": "prompt/subjects.md",
  "prompt": "...",
  "negativePrompt": "...",
  "placement": "foreground, centered-right",
  "consistencyGroup": "automotive-dark"
}
```

## VIDEO / B-ROLL FIELDS

B-roll is **not a user-generation prompt asset**. It is an engine-owned stock asset sourced automatically from Pexels/Pixabay.

When the planner needs motion, record routing metadata rather than a generation prompt:

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

The runtime fetcher chooses the actual clip, filename, resolution and provenance. The user does not need to generate a video.

## VALIDATION RULES

- filename must be unique for generated/provided assets
- filename extension must match `type`
- dimensions must be explicit for generated/provided image assets
- transparency must be `alpha`, `opaque`, or `not_applicable` for image assets
- every asset must have a beat or an explicit `global` scope
- every asset must have a purpose
- every generated image asset must have an executable prompt
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
