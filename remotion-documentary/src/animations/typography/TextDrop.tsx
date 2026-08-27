import { useCurrentFrame, interpolate } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  entranceFrames,
  useTextPosition,
} from "./utils";
import { easeOutBounce } from "../timing/easings";

/**
 * TextDrop — text drops in from above with a slight bounce on landing.
 * Use for chapter heads, impactful titles, "announcement" feel.
 */
export const TextDrop: React.FC<TextEffectProps> = (props) => {
  const { text, intensity, delay, durationInFrames, textAlign } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();
  const { from, to } = entranceFrames(durationInFrames ?? 45, intensity, delay);

  const t = interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = easeOutBounce(t);
  const translateY = (1 - eased) * -120;

  return (
    <div
      style={buildContainerStyle(x, y, textAlign ?? "center", {
        opacity: Math.min(1, t * 1.5),
        transform: `translate(-50%, calc(-50% + ${translateY}px))`,
      })}
    >
      <p style={baseTextStyle(props)}>{text}</p>
    </div>
  );
};
