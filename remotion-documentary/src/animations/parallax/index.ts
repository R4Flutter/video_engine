// Parallax — 12 depth-driven multi-layer effects.
// Shared helper `useLayerTransform(depth, t, intensity)` is duplicated at the
// top of each file by design: keeps every component self-contained, no
// cross-imports, no barrel-cycle risk. Default easing is `cinema` (easeOutQuart)
// for translate/scale moves, `easeInOutSine` for the focus-pull move.
//
// Depth convention: depth 1.0 = background (anchored), depth 1.05+ = foreground
// (moves faster, scales slightly larger). intensity scales the overall strength.

export { TwoLayerParallax } from "./TwoLayerParallax";
export { ThreeLayerParallax } from "./ThreeLayerParallax";
export { MultiLayerParallax } from "./MultiLayerParallax";
export { DepthBasedZoom } from "./DepthBasedZoom";
export { ForegroundDrift } from "./ForegroundDrift";
export { BackgroundDrift } from "./BackgroundDrift";
export { Dolly } from "./Dolly";
export { PerspectiveShift } from "./PerspectiveShift";
export { DepthOfField } from "./DepthOfField";
export { ForegroundBlur } from "./ForegroundBlur";
export { BackgroundBlur } from "./BackgroundBlur";
export { RackFocus } from "./RackFocus";
