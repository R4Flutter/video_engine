import { useCurrentFrame, interpolate, useVideoConfig } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";
import { easeOutQuart } from "../timing/easings";

/**
 * CharByChar — characters fade-in one at a time, no cursor.
 * Default stagger: 2 frames between characters. Each character is opacity 0 → 1 over 8 frames.
 * Use for short labels, titles, hook reveals.
 */
export const CharByChar: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign, intensity } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cfg = (props as TextEffectProps & { config?: { stagger?: number } }).config;
  const stagger = cfg?.stagger ?? 2; // frames between chars
  const charDur = Math.max(4, Math.round(8 / (intensity ?? 1)));
  const start = delay ?? 0;

  const chars = text.split("");

  return (
    <div style={buildContainerStyle(x, y, textAlign ?? "left")}>
      <span style={baseTextStyle(props)}>
        {chars.map((c, i) => {
          const cFrom = start + i * stagger;
          const cTo = cFrom + charDur;
          const t = interpolate(frame, [cFrom, cTo], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const eased = easeOutQuart(t);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: eased,
                transform: `translateY(${(1 - eased) * 12}px)`,
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
