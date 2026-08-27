import { useCurrentFrame, interpolate } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";
import { easeOutExpo } from "../timing/easings";

/**
 * NumberEmphasis — finds every numeric token in the text and renders it larger and accented.
 * Other words fade in normally. Tuned for finance / statistic copy.
 *
 * Numeric tokens are detected by a regex that matches digits plus common number
 * suffixes (K, M, B, T, %, currency, decimals). Whitespace is preserved.
 */
const ACCENT = "#FFD400";

const NUMBER_RE: RegExp = new RegExp("\\d[\\d,.$KMBT%+\\-]*", "g");

type Token =
  | { kind: "text"; value: string }
  | { kind: "num"; value: string };

function splitWithNumbers(text: string): Token[] {
  const out: Token[] = [];
  let last = 0;
  for (const m of text.matchAll(NUMBER_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ kind: "text", value: text.slice(last, idx) });
    out.push({ kind: "num", value: m[0] });
    last = idx + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", value: text.slice(last) });
  return out;
}

type Span = { kind: "text" | "num"; value: string };

function tokensToSpans(tokens: Token[]): Span[] {
  const out: Span[] = [];
  for (const tok of tokens) {
    if (tok.kind === "num") {
      out.push({ kind: "num", value: tok.value });
      continue;
    }
    // Split text on whitespace runs, but preserve them as their own spans.
    const parts = tok.value.split(/(\s+)/);
    for (const p of parts) {
      if (p.length > 0) out.push({ kind: "text", value: p });
    }
  }
  return out;
}

const WHITESPACE_RE: RegExp = /^\s+$/;

export const NumberEmphasis: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign, color } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();

  const start = delay ?? 0;
  const spans = tokensToSpans(splitWithNumbers(text));
  const baseDur = 18;

  return (
    <div style={buildContainerStyle(x, y, textAlign ?? "center")}>
      <span style={baseTextStyle(props)}>
        {spans.map((s, i) => {
          const sFrom = start + i * 3;
          const sTo = sFrom + baseDur;
          const t = interpolate(frame, [sFrom, sTo], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const eased = easeOutExpo(t);
          const isNum = s.kind === "num";
          const scale = isNum ? 0.85 + 0.15 * eased : 1;
          const fontSizeVal = props.fontSize ?? 48;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: eased,
                color: isNum ? ACCENT : color ?? "white",
                fontSize: isNum ? fontSizeVal * 1.5 : fontSizeVal,
                fontWeight: isNum ? 900 : props.fontWeight ?? 700,
                transform: isNum ? "scale(" + scale + ")" : "scale(1)",
                transformOrigin: "center bottom",
                whiteSpace: WHITESPACE_RE.test(s.value) ? "pre" : "normal",
              }}
            >
              {s.value === " " ? "\u00A0" : s.value}
            </span>
          );
        })}
      </span>
    </div>
  );
};
