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
 * TextRise — text rises from below its final position.
 * 60px below → 0, with opacity fade. Use for captions, lower-thirds, supporting lines.
 */
export const TextRise: React.FC<TextEffectProps> = (props) => {
  const { text, intensity, delay, durationInFrames, textAlign } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();
  const { from, to } = entranceFrames(durationInFrames ?? 30, intensity, delay);

  const t = interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = easeOutQuart(t);
  const translateY = (1 - eased) * 60;

  return (
    <div
      style={buildContainerStyle(x, y, textAlign ?? "center", {
        opacity: t,
        transform: `translate(-50%, calc(-50% + ${translateY}px))`,
      })}
    >
      <p style={baseTextStyle(props)}>{text}</p>
    </div>
  );
};
