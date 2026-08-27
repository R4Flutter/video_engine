import { useCurrentFrame, interpolate } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";
import { easeOutQuart } from "../timing/easings";

/**
 * HighlightSweep — a highlight bar (yellow default) sweeps across the text
 * from left to right, like a marker pen highlighting a passage. Text is masked
 * to the bar's path via clip-path.
 *
 * `config`:
 *   - color: highlight color (default "#FFD400")
 *   - height: highlight bar height in em (default 1.1 — slightly larger than line)
 *   - loop: if true, sweeps repeat (default false)
 */
const DEFAULT_HIGHLIGHT = "#FFD400";

export const HighlightSweep: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign, color, fontSize } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();

  const cfg = (props as TextEffectProps & {
    config?: { color?: string; height?: number; loop?: boolean };
  }).config;
  const start = delay ?? 0;
  const dur = 36;
  const highlight = cfg?.color ?? DEFAULT_HIGHLIGHT;
  const heightEm = cfg?.height ?? 1.1;
  const loop = cfg?.loop ?? false;
  const cycle = loop ? 60 : dur;
  const inCycle = loop ? (frame - start) % cycle : frame - start;
  const t = interpolate(inCycle, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = easeOutQuart(t);
  // Highlight is a yellow rect, sitting behind the text. We translate it from
  // `-100%` (off-left) to `0%` (covering the text). Then add a 20% over-run to
  // "sweep off" the right edge.
  const xPct = -100 + eased * 120;

  return (
    <div style={buildContainerStyle(x, y, textAlign ?? "center")}>
      <span
        style={{
          position: "relative",
          display: "inline-block",
          fontSize: fontSize ?? 48,
        }}
      >
        {/* Highlight bar — sits behind the text */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: `translate(${xPct}%, -50%)`,
            width: "100%",
            height: `${heightEm}em`,
            background: highlight,
            zIndex: 0,
          }}
        />
        <span
          style={{
            ...baseTextStyle(props),
            position: "relative",
            zIndex: 1,
            color: color ?? "#0a0a0a",
          }}
        >
          {text}
        </span>
      </span>
    </div>
  );
};
