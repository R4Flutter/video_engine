import { useCurrentFrame, interpolate } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";
import { easeInOutQuart } from "../timing/easings";

/**
 * StrikeThrough — draws a horizontal strike line through the middle of the text.
 * Useful for "this is wrong" moments, corrections, or visual rhythm when paired
 * with a value being nullified.
 *
 * `config`:
 *   - color: strike line color (default red "#FF3B30")
 *   - thickness: in px (default 3)
 *   - duration: strike draw duration (default 22)
 *   - invertColors: if true, strike animates in by inverting text color first (default false)
 */
const DEFAULT_COLOR = "#FF3B30";

export const StrikeThrough: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign, color } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();

  const cfg = (props as TextEffectProps & {
    config?: {
      color?: string;
      thickness?: number;
      duration?: number;
      invertColors?: boolean;
    };
  }).config;
  const start = delay ?? 0;
  const lineDur = cfg?.duration ?? 22;
  const thickness = cfg?.thickness ?? 3;
  const lineColor = cfg?.color ?? DEFAULT_COLOR;
  const invert = cfg?.invertColors ?? false;

  const lineT = interpolate(frame, [start, start + lineDur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineEased = easeInOutQuart(lineT);
  const scaleX = Math.max(0.001, lineEased);

  // Optional color inversion at the moment of strike.
  const invT = invert ? Math.min(1, lineT * 1.4) : 0;
  const invR = invT * 255;
  const invG = invT * 255;
  const invB = invT * 255;
  const baseColor = color ?? "white";
  const currentColor = invert
    ? `rgb(${255 - invR}, ${255 - invG}, ${255 - invB})`
    : baseColor;

  return (
    <div style={buildContainerStyle(x, y, textAlign ?? "center")}>
      <span
        style={{
          position: "relative",
          display: "inline-block",
        }}
      >
        <span
          style={{
            ...baseTextStyle(props),
            color: currentColor,
          }}
        >
          {text}
        </span>
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            width: "100%",
            height: `${thickness}px`,
            background: lineColor,
            transform: `translateY(-50%) scaleX(${scaleX})`,
            transformOrigin: "left center",
          }}
        />
      </span>
    </div>
  );
};
