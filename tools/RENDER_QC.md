# Rendered-frame QC

`tools/rendered-frame-qc.mjs` is the final pixel-level gate after Remotion rendering.

It samples the actual MP4 with `ffmpeg`, downsamples frames to 64×36 RGB, and checks blank / near-uniform frames, dead dark/bright frames, visual monotony, long beats with too few meaningful rendered state changes, and footage beats that statistically look like text cards.

It writes `out/render-qc/render-qc.json`, `out/render-qc/render-qc.md`, and a small set of JPEG snapshots under `out/render-qc/frames/` for the worst failures.

Run directly:

```bash
node tools/rendered-frame-qc.mjs out/final.mp4 --plan video/src/director-plan.json --strict
```

The production command runs this gate automatically after the full FinanceLong render:

```bash
cd video
npm run render:finance
```

Preview and sequence renders also run pixel QC so the engine can catch a bad visual language before spending time on the full 10+ minute render.
