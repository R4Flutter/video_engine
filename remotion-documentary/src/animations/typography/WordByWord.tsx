import { useCurrentFrame, interpolate } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";
import { easeOutExpo } from "../timing/easings";

/**
 * WordByWord — words appear one at a time with a soft pop.
 * Each word fades in and rises 8px. Default stagger: 5 frames between words.
 * Use for narrations, full-screen statements, captions.
 */
export const WordByWord: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign, intensity } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();

  const cfg = (props as TextEffectProps & { config?: { stagger?: number } }).config;
  const stagger = cfg?.stagger ?? 5;
  const wordDur = Math.max(8, Math.round(14 / (intensity ?? 1)));
  const start = delay ?? 0;

  const words = text.split(" ");

  return (
    <div style={buildContainerStyle(x, y, textAlign ?? "center")}>
      <span style={baseTextStyle(props)}>
        {words.map((w, i) => {
          const wFrom = start + i * stagger;
          const wTo = wFrom + wordDur;
          const t = interpolate(frame, [wFrom, wTo], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const eased = easeOutExpo(t);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: "0.28em",
                opacity: eased,
                transform: `translateY(${(1 - eased) * 14}px)`,
              }}
            >
              {w}
            </span>
          );
        })}
      </span>
    </div>
  );
};
