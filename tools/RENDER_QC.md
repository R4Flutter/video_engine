# Rendered-frame QC

`tools/rendered-frame-qc.mjs` is the pixel-level gate after Remotion rendering.

It samples the actual MP4 with `ffmpeg` at 1 frame/second, downsamples to 64×36 RGB, and checks blank / near-uniform frames, dead dark or bright frames, long visual-monotony runs, long beats with too few meaningful rendered state changes, and footage beats that statistically look like text cards.

Reports:

- `out/render-qc/render-qc.json`
- `out/render-qc/render-qc.md`
- `out/render-qc/frames/*.jpg` for the most serious flagged moments

Direct command:

```bash
node tools/rendered-frame-qc.mjs out/final.mp4 --plan video/src/director-plan.json --strict
```

Production render:

```bash
cd video
npm run render:finance
```

The production command now renders the video and then blocks on pixel QC. Preview and sequence renders also run pixel QC, which is the intended fast feedback loop before the full 10+ minute render.
