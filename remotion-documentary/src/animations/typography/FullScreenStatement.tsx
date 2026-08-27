import { useCurrentFrame, interpolate, useVideoConfig } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";
import { easeOutQuart, easeInOutSine } from "../timing/easings";

/**
 * FullScreenStatement — huge, all-caps statement text that fills the screen.
 * Multi-line: each line is a `<p>`. Lines rise + fade in with a stagger.
 * Default size: viewport-relative (min(8vw, 14vh)).
 *
 * After entrance, applies a slow parallax-style drift (very subtle) to keep the
 * statement alive in the frame.
 */
export const FullScreenStatement: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign, color, fontWeight } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const cfg = (props as TextEffectProps & {
    config?: { drift?: boolean };
  }).config;
  const start = delay ?? 0;
  const stagger = 12;
  const lineDur = 22;
  const lines = text.toUpperCase().split("\n");

  // Subtle drift after entrance.
  const drift =
    cfg?.drift === false
      ? 0
      : easeInOutSine(Math.min(1, Math.max(0, (frame - start) / 60))) * 6 - 3;

  const baseSize = Math.min(width * 0.08, height * 0.14);

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
              fontSize: baseSize,
              fontWeight: fontWeight ?? 900,
              color: color ?? "white",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              margin: 0,
              opacity: eased,
              transform: `translateY(${(1 - eased) * 40 + drift}px)`,
            }}
          >
            {line || "\u00A0"}
          </p>
        );
      })}
    </div>
  );
};
