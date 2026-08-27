import { useCurrentFrame, interpolate } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";
import { easeOutQuart } from "../timing/easings";

/**
 * LineByLine — splits on newline and reveals each line with a stagger.
 * Default stagger: 10 frames between lines. Each line slides up 24px and fades in.
 * Use for multi-line titles, verses, structured copy.
 */
export const LineByLine: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign, intensity } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();

  const cfg = (props as TextEffectProps & { config?: { stagger?: number } }).config;
  const stagger = cfg?.stagger ?? 10;
  const lineDur = Math.max(10, Math.round(18 / (intensity ?? 1)));
  const start = delay ?? 0;

  const lines = text.split("\n");

  return (
    <div style={buildContainerStyle(x, y, textAlign ?? "center")}>
      {lines.map((line, i) => {
        const lFrom = start + i * stagger;
        const lTo = lFrom + lineDur;
        const t = interpolate(frame, [lFrom, lTo], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const eased = easeOutQuart(t);
        return (
          <p
            key={i}
            style={{
              ...baseTextStyle(props),
              opacity: eased,
              transform: `translateY(${(1 - eased) * 24}px)`,
              margin: 0,
            }}
          >
            {line || "\u00A0"}
          </p>
        );
      })}
    </div>
  );
};
