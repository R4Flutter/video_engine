import { useCurrentFrame, interpolate } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";
import { easeOutBack } from "../timing/easings";

/**
 * TextStagger — characters animate in with a configurable stagger. Like CharByChar
 * but with a bouncier scale entrance and tunable stagger window. Use for impactful
 * lines, hook phrases, anything where the per-character entrance is the show.
 *
 * `config`:
 *   - stagger: frames between characters (default 4)
 *   - overshoot: scale peak above 1 (default 1.15)
 *   - rise: vertical rise in px (default 24)
 */
export const TextStagger: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();

  const cfg = (props as TextEffectProps & {
    config?: { stagger?: number; overshoot?: number; rise?: number };
  }).config;
  const start = delay ?? 0;
  const stagger = cfg?.stagger ?? 4;
  const overshoot = cfg?.overshoot ?? 1.15;
  const rise = cfg?.rise ?? 24;
  const dur = 20;

  const chars = text.split("");

  return (
    <div style={buildContainerStyle(x, y, textAlign ?? "left")}>
      <span style={baseTextStyle(props)}>
        {chars.map((c, i) => {
          const cFrom = start + i * stagger;
          const cTo = cFrom + dur;
          const t = interpolate(frame, [cFrom, cTo], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const eased = easeOutBack(t);
          // Back-overshoot peaks above 1 then settles to 1.
          const scale = 0.5 + (overshoot - 0.5) * eased - (overshoot - 1) * Math.max(0, t - 1 / (overshoot * 2));
          const clampedScale = Math.max(0.001, scale);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: Math.min(1, t * 1.2),
                transform: `translateY(${(1 - eased) * rise}px) scale(${clampedScale})`,
                transformOrigin: "center bottom",
                whiteSpace: c === " " ? "pre" : "normal",
              }}
            >
              {c === " " ? "\u00A0" : c}
            </span>
          );
        })}
      </span>
    </div>
  );
};
