import { useCurrentFrame, interpolate } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";
import { easeInOutQuart } from "../timing/easings";

/**
 * TrackingAnimation — animates `letter-spacing` from wide (e.g. 0.5em) to tight (e.g. 0),
 * with opacity fade-in. Use for cinematic intros: "W E L C O M E" → "WELCOME".
 *
 * `config`:
 *   - from: starting tracking in em (default 0.5)
 *   - to: ending tracking in em (default 0.04)
 *   - fade: fade-in while tracking (default true)
 */
export const TrackingAnimation: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();

  const cfg = (props as TextEffectProps & {
    config?: { from?: number; to?: number; fade?: boolean };
  }).config;
  const start = delay ?? 0;
  const dur = 50;
  const fromEms = cfg?.from ?? 0.5;
  const toEms = cfg?.to ?? 0.04;
  const fade = cfg?.fade ?? true;

  const t = interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = easeInOutQuart(t);
  const tracking = fromEms + (toEms - fromEms) * eased;

  return (
    <div style={buildContainerStyle(x, y, textAlign ?? "center")}>
      <p
        style={{
          ...baseTextStyle(props),
          letterSpacing: `${tracking}em`,
          opacity: fade ? Math.min(1, t * 1.5) : 1,
          textTransform: "uppercase",
        }}
      >
        {text}
      </p>
    </div>
  );
};
