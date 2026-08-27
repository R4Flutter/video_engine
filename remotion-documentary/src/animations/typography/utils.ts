import { useVideoConfig } from "remotion";
import type { TextEffectProps } from "../../types";

/**
 * Resolves a position value (0..1 fraction of total, or px string/number) into a px value.
 * 0..1 of the dimension is treated as a fraction. Strings are assumed to be px values.
 */
export function resolvePos(
  value: number | string | undefined,
  total: number,
  defaultFraction: number,
): number {
  if (value === undefined) return total * defaultFraction;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : total * defaultFraction;
  }
  if (!Number.isFinite(value)) return total * defaultFraction;
  return value <= 1 ? total * value : value;
}

/**
 * Resolves both x and y for a TextEffect given a viewport (width/height).
 * Returns px values for use with absolute positioning.
 */
export function useTextPosition(
  props: Pick<TextEffectProps, "x" | "y">,
): { x: number; y: number } {
  const { width, height } = useVideoConfig();
  return {
    x: resolvePos(props.x, width, 0.5),
    y: resolvePos(props.y, height, 0.5),
  };
}

/**
 * Builds the standard container style: absolute centered on (x, y), with a translate(-50%, -50%)
 * for true center positioning, plus the user's style/className passthrough.
 */
export function buildContainerStyle(
  x: number,
  y: number,
  textAlign: TextEffectProps["textAlign"],
  extra?: React.CSSProperties,
): React.CSSProperties {
  return {
    position: "absolute",
    left: x,
    top: y,
    transform: "translate(-50%, -50%)",
    textAlign,
    whiteSpace: "pre-wrap",
    margin: 0,
    ...extra,
  };
}

/**
 * Pulls the shared text styles (fontSize/color/fontFamily/fontWeight/textAlign) into a CSS object.
 * Falls back to the package-wide defaults.
 */
export function baseTextStyle(
  props: TextEffectProps,
): React.CSSProperties {
  return {
    fontSize: props.fontSize ?? 48,
    color: props.color ?? "white",
    fontFamily: props.fontFamily ?? "Inter, sans-serif",
    fontWeight: props.fontWeight ?? 700,
    lineHeight: 1.1,
    margin: 0,
    padding: 0,
  };
}

/**
 * Maps intensity (0.5/1/1.5/2) onto a numeric multiplier for speed/distance.
 * Useful for making effects tunable without rewiring timelines.
 */
export function intensityScale(
  intensity: TextEffectProps["intensity"],
): number {
  return intensity ?? 1;
}

/**
 * Standard entrance duration in frames. Most typography entrances feel right at ~30 frames
 * (1 second at 30fps) at intensity 1.0. Sub-1.0 intensities use 0.6x, etc.
 */
export function entranceFrames(
  base: number,
  intensity: TextEffectProps["intensity"],
  delay: number = 0,
): { from: number; to: number } {
  const scale = intensityScale(intensity);
  const dur = Math.max(1, Math.round(base / Math.max(0.4, scale * 0.8)));
  const start = Math.max(0, Math.round(delay));
  return { from: start, to: start + dur };
}
