# Script-driven documentary rendering

The production workflow is intentionally declarative:

`script -> resolve shot name -> Director registry -> effect component -> supplied image -> Remotion render`

The AI agent should not write a new animation implementation for every shot. It should choose an existing registered `shot`/`effect` and provide the asset plus optional parameters.

## Canonical script shape

```json
{
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "scenes": [
    {
      "id": "opening",
      "narration": "The story begins here.",
      "visuals": [
        {
          "image": "/assets/opening.jpg",
          "shot": "pushIn",
          "duration": 150,
          "focalPoint": {"x": 0.55, "y": 0.46}
        },
        {
          "image": "/assets/document.jpg",
          "shot": "detailReveal",
          "duration": 90,
          "focalPoint": {"x": 0.63, "y": 0.37}
        },
        {
          "image": "/assets/end.jpg",
          "shot": "fadeOut",
          "duration": 24
        }
      ]
    }
  ]
}
```

`shot` and `effect` are both accepted. Human-friendly aliases such as `push-in`, `zoom-in`, `slow-drift`, and `2.5d` are normalized to registered effect names.

## Agent behavior

1. Read the script scene by scene.
2. For every visual, resolve `shot`/`effect` against the real `Director` registry.
3. Never silently invent an unknown effect. Unknown names are a hard error.
4. Pass the supplied image directly to `Director`.
5. Pass `focalPoint`, timing, text, and effect-specific `config` through unchanged.
6. Keep visual order as the editorial timeline unless the script explicitly supplies different ordering.
7. Produce a render contract before a final render so every scene and visual is deterministic.

This keeps creative decisions in the script and animation implementation in the reusable engine.

## Rendering concept

The `ScriptEpisode` renderer consumes a `DocumentaryScript` and renders each visual as a bounded Remotion `Sequence`. The production composition reads the script from Remotion `inputProps`, which makes the same engine usable by coding agents, local scripts, or an editor application.

Remotion itself is designed for programmatic/parameterized video rendering, so this architecture keeps the script as data and the animation system as reusable source code. citeturn260818search0turn260818search1
