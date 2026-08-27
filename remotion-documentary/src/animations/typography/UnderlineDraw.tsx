import { useCurrentFrame, interpolate } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";
import { easeOutExpo } from "../timing/easings";

/**
 * UnderlineDraw — text fades in, then an underline (yellow default) draws across
 * the bottom of the text from left to right.
 *
 * `config`:
 *   - color: underline color (default "#FFD400")
 *   - thickness: in px (default 4)
 *   - delayUnderline: extra delay after text fades in before underline starts (default 8)
 *   - duration: underline draw duration in frames (default 24)
 */
const DEFAULT_COLOR = "#FFD400";

export const UnderlineDraw: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();

  const cfg = (props as TextEffectProps & {
    config?: {
      color?: string;
      thickness?: number;
      delayUnderline?: number;
      duration?: number;
    };
  }).config;
  const start = delay ?? 0;
  const fadeDur = 18;
  const delayUnderline = cfg?.delayUnderline ?? 8;
  const lineDur = cfg?.duration ?? 24;
  const thickness = cfg?.thickness ?? 4;
  const lineColor = cfg?.color ?? DEFAULT_COLOR;

  const textT = interpolate(frame, [start, start + fadeDur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineStart = start + fadeDur + delayUnderline;
  const lineT = interpolate(frame, [lineStart, lineStart + lineDur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineEased = easeOutExpo(lineT);
  const scaleX = Math.max(0.001, lineEased);

  return (
    <div style={buildContainerStyle(x, y, textAlign ?? "center")}>
      <span
        style={{
          position: "relative",
          display: "inline-block",
          paddingBottom: `${thickness + 4}px`,
        }}
      >
        <span
          style={{
            ...baseTextStyle(props),
            opacity: textT,
          }}
        >
          {text}
        </span>
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: "100%",
            height: `${thickness}px`,
            background: lineColor,
            transform: `scaleX(${scaleX})`,
            transformOrigin: "left center",
          }}
        />
      </span>
    </div>
  );
};
