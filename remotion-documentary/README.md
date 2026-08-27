# remotion-documentary

A production-oriented documentary animation engine for Remotion 4.x. The library keeps the original 270-effect API but upgrades the old placeholder slots into deterministic renderers and adds a reusable shot/episode layer.

## What changed in v2

- **No dead placeholder rendering:** legacy registry entries now dispatch to `AdvancedEffect`, so transitions, typography, reframing, focus, document and map effects render real deterministic visuals.
- **Cinematic shot contract:** `DocumentaryShotSpec` separates media, focal point, camera, depth, overlays and atmosphere.
- **Episode engine:** `DocumentaryEpisode` stitches shots into one deterministic timeline without editorial logic inside individual effects.
- **Render contract:** `buildRenderContract()` records exact scene order, timing, media and camera intent.
- **QC:** `validateShot`, `validateEpisode` and `validateRenderContract` catch timeline overlaps, invalid dimensions, empty assets and malformed timing before render.
- **Shot planner:** `planShot()` creates sensible documentary shot recipes from intent (`establish`, `approach`, `evidence`, `portrait`, `detail`, `location`, `escalate`, `resolve`).

## Core API

```tsx
import {Director} from "remotion-documentary";

<Director
  effect="pushIn"
  image="/archive/portrait.jpg"
  durationInFrames={180}
  intensity={1}
  config={{target: {x: 0.58, y: 0.36}, scale: 1.2}}
/>
```

For production shots:

```tsx
import {DocumentaryEpisode} from "remotion-documentary";

<DocumentaryEpisode spec={{
  fps: 30,
  width: 1920,
  height: 1080,
  shots: [
    {
      id: "portrait",
      durationInFrames: 180,
      image: "/archive/portrait.jpg",
      focalPoint: {x: 0.52, y: 0.38},
      camera: {effect: "faceReframe", scale: 1.26, target: {x: 0.52, y: 0.38}, intensity: 1},
      atmosphere: {grain: 0.06, vignette: 0.14},
      overlays: [
        {effect: "spotlight", from: 24, durationInFrames: 90, config: {target: {x: 0.52, y: 0.38}}},
        {effect: "textRise", text: "EVERYONE MISSED IT.", from: 92, durationInFrames: 60, config: {fontSize: 86, y: 0.82}}
      ]
    }
  ]
}} />
```

## Still-image cinematography

The intended grammar is not “apply a zoom.” Every shot can be composed from:

`focal point → camera move → depth layers → evidence/focus overlay → typography → atmosphere → payoff`

For genuine 2.5D, supply two or more depth layers. Example:

```ts
const depth = [
  {src: "/scene/background.jpg", depth: 1.00, blur: 0.5},
  {src: "/scene/midground.png", depth: 1.06},
  {src: "/scene/subject.png", depth: 1.12},
  {src: "/scene/foreground.png", depth: 1.18, blur: 0.8, opacity: 0.95},
];
```

The engine deterministically moves the planes at different rates; it never invents random camera paths.

## Production commands

```bash
npm install
npm run typecheck
npm run build:production
npm run build:shot
npm run build
```

The production demo is registered as `ProductionDocumentary` at 1920×1080 / 30fps.

## Quality gate

Use the QC helpers before rendering a long episode:

```ts
import {buildRenderContract} from "./src/engine/CinematicShot";
import {validateEpisode, validateRenderContract} from "./src/qc/validateShot";

const issues = [
  ...validateEpisode(spec),
  ...validateRenderContract(buildRenderContract(spec)),
];

const fatal = issues.filter((issue) => issue.severity === "fatal");
if (fatal.length) throw new Error(fatal.map((x) => x.message).join("\n"));
```

## Architecture

```text
narration / editorial plan
        ↓
   shot planner
        ↓
DocumentaryShotSpec
        ↓
 Render Contract
        ↓
 DocumentaryEpisode
        ↓
   Remotion effects
        ↓
     QC gates
        ↓
 final 1920×1080 MP4
```

This package is the **render/shot layer**. It intentionally does not pretend that an LLM can infer pixel-perfect subject masks, depth maps or factual evidence by itself. Those inputs belong upstream in the editorial/perception pipeline.
