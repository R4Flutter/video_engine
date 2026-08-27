import { useCurrentFrame, interpolate, useVideoConfig } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  entranceFrames,
  useTextPosition,
} from "./utils";
import { easeOutBack } from "../timing/easings";

/**
 * TextScale — text scales from 0 → 1 with a slight back-overshoot.
 * Punchy entrance. Use for "boom" moments: numbers, headlines, reveals.
 */
export const TextScale: React.FC<TextEffectProps> = (props) => {
  const { text, intensity, delay, durationInFrames, textAlign } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();
  const { from, to } = entranceFrames(durationInFrames ?? 28, intensity, delay);
  const { width, height } = useVideoConfig();

  const t = interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = easeOutBack(t);
  const scale = Math.max(0.001, eased);

  return (
    <div
      style={buildContainerStyle(x, y, textAlign ?? "center", {
        opacity: t,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: "center center",
      })}
    >
      <p
        style={{
          ...baseTextStyle(props),
          // Scale around the visual center of the text box; hint via line-height.
          lineHeight: 1.1,
        }}
      >
        {text}
      </p>
    </div>
  );
};
