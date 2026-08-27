import { useCurrentFrame, interpolate } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";
import { easeInOutQuart } from "../timing/easings";

/**
 * WeightChange — animates `font-weight` over the entrance, alongside a slight scale.
 * Note: actual font-weight values are 100..900 in steps. Interpolation works on
 * numeric weights (100/200/...). Renders a smooth tween between the two.
 *
 * `config`:
 *   - from: starting weight (default 100)
 *   - to:   ending weight (default 900)
 */
export const WeightChange: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign, fontWeight } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();

  const cfg = (props as TextEffectProps & {
    config?: { from?: number; to?: number };
  }).config;
  const start = delay ?? 0;
  const dur = 40;
  const fromW = cfg?.from ?? 100;
  const toW = cfg?.to ?? fontWeight ?? 900;

  const t = interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = easeInOutQuart(t);
  // Round to nearest 100 to keep weight values clean.
  const weight = Math.round(fromW + (toW - fromW) * eased);

  return (
    <div style={buildContainerStyle(x, y, textAlign ?? "center")}>
      <p
        style={{
          ...baseTextStyle(props),
          fontWeight: weight,
          // weight changes look weird without a tiny scale change — the glyphs "thicken"
          scale: `${0.95 + 0.05 * eased}`,
          opacity: t,
        }}
      >
        {text}
      </p>
    </div>
  );
};
