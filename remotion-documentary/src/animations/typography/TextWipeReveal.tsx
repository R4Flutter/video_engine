import { useCurrentFrame, interpolate } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  entranceFrames,
  useTextPosition,
} from "./utils";
import { easeOutExpo } from "../timing/easings";

/**
 * TextWipeReveal — a high-contrast overlay wipes diagonally across the text,
 * revealing it from upper-left to lower-right. Different feel from TextMaskReveal
 * (which is purely a horizontal clip). Use when you want a "scrubbed" cinematic reveal.
 */
export const TextWipeReveal: React.FC<TextEffectProps> = (props) => {
  const { text, intensity, delay, durationInFrames, textAlign } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();
  const { from, to } = entranceFrames(durationInFrames ?? 40, intensity, delay);

  const t = interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = easeOutExpo(t);
  // Background overlay (sits on top, same color as canvas) slides from covering 0% → -100%
  const wipeX = (1 - eased) * 100; // 0% (covers nothing) → 100% (covers all, then leaves)
  const revealX = -100 + eased * 100; // -100% → 0% — overlay exits stage-left

  return (
    <div style={buildContainerStyle(x, y, textAlign ?? "center")}>
      <div style={{ position: "relative", display: "inline-block" }}>
        <p style={baseTextStyle(props)}>{text}</p>
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "#0a0a0a",
            transform: `translateX(${wipeX}%)`,
            transformOrigin: "left center",
          }}
        />
      </div>
    </div>
  );
};
