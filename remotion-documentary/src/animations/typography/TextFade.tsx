import { useCurrentFrame, interpolate } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  entranceFrames,
  useTextPosition,
} from "./utils";

/**
 * TextFade — text fades in from opacity 0 to 1.
 * No motion, just opacity. Use for crossfades, soft entrances, or when a slide would be distracting.
 */
export const TextFade: React.FC<TextEffectProps> = (props) => {
  const { text, intensity, delay, durationInFrames, textAlign } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();
  const { from, to } = entranceFrames(durationInFrames ?? 30, intensity, delay);

  const opacity = interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={buildContainerStyle(x, y, textAlign ?? "center", { opacity })}>
      <p style={baseTextStyle(props)}>{text}</p>
    </div>
  );
};
