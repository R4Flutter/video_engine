import { useCurrentFrame, interpolate } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  entranceFrames,
  useTextPosition,
} from "./utils";
import { easeOutQuart } from "../timing/easings";

/**
 * TextBlurSharp — text comes into focus from a soft blur.
 * 20px blur → 0, with opacity 0 → 1. Cinematic, dreamlike entrance.
 */
export const TextBlurSharp: React.FC<TextEffectProps> = (props) => {
  const { text, intensity, delay, durationInFrames, textAlign } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();
  const { from, to } = entranceFrames(durationInFrames ?? 36, intensity, delay);

  const t = interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = easeOutQuart(t);
  const blur = (1 - eased) * 20;
  const opacity = eased;

  return (
    <div
      style={buildContainerStyle(x, y, textAlign ?? "center", {
        opacity,
        filter: `blur(${blur}px)`,
        // Keep transforms independent so blur + centering don't fight.
        transform: "translate(-50%, -50%)",
      })}
    >
      <p style={baseTextStyle(props)}>{text}</p>
    </div>
  );
};
