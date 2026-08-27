import { useCurrentFrame, interpolate } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";
import { easeOutQuart } from "../timing/easings";

/**
 * SplitTypography — splits the text on a chosen delimiter (default: every 3rd word)
 * and renders each "chunk" as a separate block with a stagger.
 *
 * `config.split` options:
 *   - "word"   — each word is its own block (default)
 *   - "char"   — each character is its own block
 *   - "line"   — each line (on \n) is its own block
 *   - number   — every Nth word
 */
export const SplitTypography: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();

  const cfg = (props as TextEffectProps & {
    config?: { split?: "word" | "char" | "line" | number };
  }).config;
  const start = delay ?? 0;
  const stagger = 6;
  const dur = 18;

  let chunks: string[];
  const split = cfg?.split ?? "word";
  if (split === "char") chunks = text.split("");
  else if (split === "line") chunks = text.split("\n");
  else if (typeof split === "number" && split > 0) {
    const ws = text.split(" ");
    const out: string[] = [];
    for (let i = 0; i < ws.length; i += split)
      out.push(ws.slice(i, i + split).join(" "));
    chunks = out;
  } else chunks = text.split(" ");

  return (
    <div style={buildContainerStyle(x, y, textAlign ?? "center")}>
      <span style={baseTextStyle(props)}>
        {chunks.map((c, i) => {
          const cFrom = start + i * stagger;
          const cTo = cFrom + dur;
          const t = interpolate(frame, [cFrom, cTo], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const eased = easeOutQuart(t);
          const display =
            split === "char" || split === "line" ? "block" : "inline-block";
          return (
            <span
              key={i}
              style={{
                display,
                marginRight: split === "word" || split === "line" ? "0.3em" : 0,
                marginBottom: split === "line" ? "0.4em" : 0,
                opacity: eased,
                transform: `translateY(${(1 - eased) * 24}px)`,
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
