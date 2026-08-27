import { useCurrentFrame, interpolate } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";
import { easeOutElastic, easeInOutQuart } from "../timing/easings";

/**
 * Kinetic — multi-property kinetic typography entrance.
 * Characters enter with a per-character elastic bounce + slight rotation,
 * then settle with a follow-through micro-rotation. Loop-able.
 *
 * Phases:
 *   0–0.5  — character entrances staggered (rotate ±10°, scale 0.6→1.0, opacity 0→1)
 *   0.5–1  — full text settles with a 0→0 → 0 micro-rotation
 */
export const Kinetic: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign, intensity } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();

  const cfg = (props as TextEffectProps & {
    config?: { stagger?: number; settle?: boolean };
  }).config;
  const stagger = cfg?.stagger ?? 3;
  const settle = cfg?.settle ?? true;
  const start = delay ?? 0;
  const dur = Math.max(60, Math.round(60 / (intensity ?? 1)) + text.length * stagger);
  const charDur = 18;

  const chars = text.split("");
  const tNorm = interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Settle micro-rotation, only after entrance is mostly done.
  const settleT = interpolate(tNorm, [0.6, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const settleRot = settle ? (easeInOutQuart(settleT) * 2 - 1) * 0.6 : 0;

  return (
    <div
      style={buildContainerStyle(x, y, textAlign ?? "center", {
        transform: `translate(-50%, -50%) rotate(${settleRot}deg)`,
        transformOrigin: "center center",
      })}
    >
      <span style={baseTextStyle(props)}>
        {chars.map((c, i) => {
          const cFrom = start + i * stagger;
          const cTo = cFrom + charDur;
          const t = interpolate(frame, [cFrom, cTo], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const eased = easeOutElastic(t);
          const rot = (1 - eased) * (i % 2 === 0 ? 12 : -12);
          const scale = 0.6 + 0.4 * eased;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: eased,
                transform: `scale(${scale}) rotate(${rot}deg)`,
                transformOrigin: "center center",
                whiteSpace: c === " " ? "pre" : "normal",
              }}
            >
              {c === " " ? "\u00A0" : c}
            </span>
          );
        })}
      </span>
    </div>
  );
};
