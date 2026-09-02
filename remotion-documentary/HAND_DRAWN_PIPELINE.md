# Hand-drawn long-form pipeline

This branch adds a deterministic production path for the numbered hand-drawn stills.

## Contract

The canonical media directory is `public/handdrawn/`.

Assets must use a numeric editorial prefix:

`01_...`, `02_...`, `03_...`, etc.

The numeric prefix defines order. The renderer does not use filesystem order, semantic guessing, random selection, or a fallback image.

## Prepare

From `remotion-documentary`:

```bash
npm install
npm run assets:prepare
npm run typecheck
```

`assets:prepare` scans `public/handdrawn`, verifies that numbering starts at 01 and contains no gaps or duplicate numbers, and writes `src/handdrawn/handdrawn-manifest.json`.

## Render

```bash
npm run build:handdrawn
```

This renders `HandDrawnLongForm` at 1080x1920, 30 fps. Each still is held for five seconds and receives deterministic documentary camera treatment through the existing Director/shot-planner system: push/pull/reframe/drift treatments, focal-point targeting, grain, vignette, and intent-specific overlays.

The same composition is available in Remotion Studio as `HandDrawnLongForm`.

## Important

Do not put pink generated test clips in `public/handdrawn`. Test clips belong outside the canonical editorial still pipeline.

The engine intentionally fails preparation when the numbered sequence is incomplete. That is preferable to silently selecting an unrelated image and producing a visually incorrect documentary.
