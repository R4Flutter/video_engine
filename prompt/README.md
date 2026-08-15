# ASSET PROMPTS — GRACE GRONER ($7M COUPON QUEEN)

One prompt file per asset type. All prompts feed `script_story.md` beats.

## STYLE BASELINE (all image assets)

Paper-cut collage illustration, flat layering, cream paper background `#F5EFE0`,
charcoal ink outlines, muted mid-century palette (1930s–1950s America: sepia,
olive, brick red, navy), soft paper-cast shadows, slight paper texture, no text
in image (text added in edit). Isolated subject, centered, generous padding for
9:16 safe zone (center 60% of frame). Must match the existing Kodak paper-cut
assets in `video/public/img/` (same world, different story).

## NAMING CONVENTION

`grace-<slot>-<beat>_<n>-<purpose>.png` — e.g. `grace-p3-15_dividend.png`.
Slots: p1..p8 (illustration), g1..g6 (graphic), b1..b4 (b-roll), s1..s8 (sound).

## HOW TO USE

- Illustrations: generate, remove background (or generate on `#F5EFE0`), place
  as beds under the text layer (same as Kodak beds: transparent PNG, 9:16).
- Graphics: build in the vox engine (modules exist: counter/compare/timeline/
  stat/callout) — prompts below are motion specs, not images.
- Text: engine overlays, safe-zone centered (avoid right rail + bottom UI).
- B-roll: stock sites (Pexels/Pixabay/Storyblocks), used ONLY as quick 1-2s
  cutaways if the paper-cut look needs a realism beat — optional layer.