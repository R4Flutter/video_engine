import { useCurrentFrame, interpolate, useVideoConfig } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  entranceFrames,
  useTextPosition,
} from "./utils";
import { easeOutQuart } from "../timing/easings";

/**
 * TextSlide — text slides in horizontally.
 * Defaults to sliding from the left (off-screen → center).
 * Set `config={{ from: "right" }}` to slide in from the right.
 */
export const TextSlide: React.FC<TextEffectProps> = (props) => {
  const { text, intensity, delay, durationInFrames, textAlign } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const { from, to } = entranceFrames(durationInFrames ?? 36, intensity, delay);

  const cfg = (props as TextEffectProps & { config?: { from?: "left" | "right" } }).config;
  const fromRight = cfg?.from === "right";
  const dir = fromRight ? 1 : -1;

  const t = interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = easeOutQuart(t);
  const offsetX = (1 - eased) * dir * width;

  return (
    <div
      style={buildContainerStyle(x + offsetX, y, textAlign ?? "center", {
        opacity: t,
      })}
    >
      <p style={baseTextStyle(props)}>{text}</p>
    </div>
  );
};
