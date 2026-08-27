import { useCurrentFrame, interpolate } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";
import { easeOutBack } from "../timing/easings";

/**
 * WordEmphasis — splits text on spaces; the "emphasis" word pops in larger and in a
 * contrasting accent color. Other words fade in normally.
 *
 * Pick the emphasis word via `config.emphasis` (string, case-insensitive) or default to
 * the LAST word in the text.
 */
const ACCENT = "#FFD400"; // document-yellow; matches the documentary palette.

export const WordEmphasis: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign, color } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();

  const cfg = (props as TextEffectProps & { config?: { emphasis?: string } }).config;
  const start = delay ?? 0;
  const baseDur = 16;
  const words = text.split(" ");
  const target = (cfg?.emphasis ?? words[words.length - 1] ?? "").toLowerCase();

  return (
    <div style={buildContainerStyle(x, y, textAlign ?? "center")}>
      <span style={baseTextStyle(props)}>
        {words.map((w, i) => {
          const wFrom = start + i * 3;
          const wTo = wFrom + baseDur;
          const t = interpolate(frame, [wFrom, wTo], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const isEmphasis = w.toLowerCase() === target;
          const eased = easeOutBack(t);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: "0.3em",
                opacity: t,
                color: isEmphasis ? ACCENT : color ?? "white",
                fontSize: isEmphasis ? (props.fontSize ?? 48) * 1.4 : props.fontSize ?? 48,
                transform: isEmphasis ? `scale(${Math.max(0.001, eased)})` : "scale(1)",
                transformOrigin: "center bottom",
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
