# ASSET MANIFEST CONTRACT

The manifest is the handoff between the AI asset planner and the renderer/editor.

Use one entry per real production asset. Do not group unrelated files into a single entry.

## REQUIRED FIELDS

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

## VIDEO FIELDS

For B-roll also include:

```json
{
  "type": "video",
  "format": "mp4",
  "durationSeconds": 5,
  "fps": 24,
  "width": 1920,
  "height": 1080,
  "motion": "slow lateral tracking"
}
```

## VALIDATION RULES

- filename must be unique
- filename extension must match `type`
- dimensions must be explicit
- transparency must be `alpha`, `opaque`, or `not_applicable`
- every asset must have a beat or an explicit `global` scope
- every asset must have a purpose
- every asset must have an executable prompt
- B-roll must have a duration and motion description
- P0 assets must cover the core story claims
- unrelated assets must never share one manifest entry

## PRIORITIES

`P0` essential proof / hook / reveal

`P1` strong supporting visual

`P2` optional alternate / polish

## RENDERER HANDOFF

The renderer should use the manifest for deterministic lookup. The editor should not need to infer which file belongs to a beat from filenames alone.
