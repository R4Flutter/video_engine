import { useCurrentFrame, interpolate } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";
import { easeOutQuart } from "../timing/easings";

/**
 * TextStacking — renders the same text in N stacked layers (3 by default),
 * each with progressively smaller Y offset and lower opacity, creating a
 * 3D shadow-stack effect. Layers animate in from the back.
 *
 * `config`:
 *   - layers: number of stacked layers (default 3)
 *   - spacing: vertical offset between layers in px (default 8)
 *   - skew: skew angle in degrees applied to each layer (default 0)
 *   - perspective: applied to the parent (px, default 800)
 */
export const TextStacking: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign, color } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();

  const cfg = (props as TextEffectProps & {
    config?: {
      layers?: number;
      spacing?: number;
      skew?: number;
      perspective?: number;
    };
  }).config;
  const start = delay ?? 0;
  const layers = Math.max(1, cfg?.layers ?? 3);
  const spacing = cfg?.spacing ?? 8;
  const skew = cfg?.skew ?? 0;
  const dur = 36;

  const t = interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = easeOutQuart(t);

  return (
    <div
      style={{
        ...buildContainerStyle(x, y, textAlign ?? "center"),
        perspective: `${cfg?.perspective ?? 800}px`,
      }}
    >
      {Array.from({ length: layers }).map((_, i) => {
        // Layer 0 is the top/furthest-forward layer (largest opacity, smallest offset).
        const depth = layers - 1 - i;
        const layerY = depth * spacing * (1 - eased);
        const layerOpacity =
          0.2 + (0.6 / Math.max(1, layers - 1 || 1)) * (i / Math.max(1, layers - 1));
        return (
          <span
            key={i}
            style={{
              ...baseTextStyle(props),
              position: i === 0 ? "relative" : "absolute",
              left: i === 0 ? undefined : 0,
              top: i === 0 ? undefined : 0,
              color:
                i === 0 ? color ?? "white" : i % 2 === 0 ? "#FFD400" : "#FF6B00",
              opacity: i === 0 ? 1 : layerOpacity,
              transform: `translateY(${layerY}px) skewX(${skew}deg)`,
              transformOrigin: "center top",
            }}
          >
            {text}
          </span>
        );
      })}
    </div>
  );
};
