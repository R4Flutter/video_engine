import { useCurrentFrame, interpolate } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  entranceFrames,
  useTextPosition,
} from "./utils";
import { easeInOutQuart } from "../timing/easings";

/**
 * TextMaskReveal — text is revealed by a horizontal mask wiping left → right.
 * Implemented via `clip-path: inset(0 X% 0 0)`, going from X=100 to X=0.
 * Use for classy, editorial reveals. Pairs well with serif fonts.
 */
export const TextMaskReveal: React.FC<TextEffectProps> = (props) => {
  const { text, intensity, delay, durationInFrames, textAlign } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();
  const { from, to } = entranceFrames(durationInFrames ?? 36, intensity, delay);

  const t = interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = easeInOutQuart(t);
  const right = (1 - eased) * 100; // 100% → 0%

  return (
    <div style={buildContainerStyle(x, y, textAlign ?? "center")}>
      <p
        style={{
          ...baseTextStyle(props),
          clipPath: `inset(0 ${right}% 0 0)`,
          WebkitClipPath: `inset(0 ${right}% 0 0)`,
        }}
      >
        {text}
      </p>
    </div>
  );
};
