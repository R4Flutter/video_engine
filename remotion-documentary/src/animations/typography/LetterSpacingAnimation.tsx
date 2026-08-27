import { useCurrentFrame, interpolate } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";
import { easeInOutQuart } from "../timing/easings";

/**
 * LetterSpacingAnimation — animates CSS `letter-spacing` (in px, not em) over a
 * sin-shaped curve, settling at a final value. Different from TrackingAnimation
 * (which uses em units and a power easing). Use when you want exact px precision.
 *
 * `config`:
 *   - from: starting letter-spacing in px (default 24)
 *   - to:   ending letter-spacing in px (default 0)
 */
export const LetterSpacingAnimation: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();

  const cfg = (props as TextEffectProps & {
    config?: { from?: number; to?: number };
  }).config;
  const start = delay ?? 0;
  const dur = 45;
  const fromPx = cfg?.from ?? 24;
  const toPx = cfg?.to ?? 0;

  const t = interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = easeInOutQuart(t);
  const tracking = fromPx + (toPx - fromPx) * eased;

  return (
    <div style={buildContainerStyle(x, y, textAlign ?? "center")}>
      <p
        style={{
          ...baseTextStyle(props),
          letterSpacing: `${tracking}px`,
          opacity: Math.min(1, t * 1.5),
        }}
      >
        {text}
      </p>
    </div>
  );
};
