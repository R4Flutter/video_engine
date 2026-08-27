import type { BaseEffectProps } from "../../types";

/**
 * CombinationProps — what every pre-composed documentary shot accepts.
 *
 * A combination is a stack of effects that produces a single complete
 * cinematic moment. It builds on BaseEffectProps with a few extra fields
 * that make sense at the shot level (a background image, an optional
 * secondary image, a region to drop a chart into, etc.).
 */
export type CombinationProps = BaseEffectProps & {
  /** Primary background image for the shot (portrait, building, archive photo, …) */
  image?: string;
  /** Optional secondary image used as a parallax / pattern / texture overlay */
  overlay?: string;
  /**
   * Optional region (in px) where an embedded chart / monitor overlay should
   * sit. Useful for the trading-room / dashboard / collapse compositions.
   */
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Optional finance data — a combination can pre-fill counters / charts */
  data?: {
    from?: number;
    to?: number;
    prefix?: string;
    suffix?: string;
    /** Y-axis series for chart-style combinations */
    series?: number[];
  };
  /** Optional headline / name / date label rendered as oversized typography */
  label?: string;
  /** Optional sub-line under the headline (subtitle, position, year) */
  sublabel?: string;
  /** Optional accent color used by overlays (warning lines, chart strokes, etc.) */
  accent?: string;
};
