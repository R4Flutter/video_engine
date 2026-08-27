import { useCurrentFrame, interpolate } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";

/**
 * TextSnapping — text "snaps" into place from a fuzzy, micro-jittered state.
 * The opacity ramps up while position locks progressively tighter to its
 * final value. Feels like a camera focusing rapidly or a UI element settling.
 *
 * `config`:
 *   - jitter: starting jitter amplitude in px (default 8)
 *   - steps: number of "snap" resolution steps (default 6) — each step halves jitter
 *   - duration: total snap duration in frames (default 22)
 */
export const TextSnapping: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();

  const cfg = (props as TextEffectProps & {
    config?: { jitter?: number; steps?: number; duration?: number };
  }).config;
  const start = delay ?? 0;
  const jitter = cfg?.jitter ?? 8;
  const steps = Math.max(1, cfg?.steps ?? 6);
  const dur = cfg?.duration ?? 22;

  const t = interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Jitter amplitude halves every step.
  const stepT = Math.floor(t * steps) / steps;
  const amp = jitter * (1 - stepT);

  // Deterministic per-step pseudo-random (no Math.sin to avoid smooth oscillation).
  const seed = Math.floor(t * steps);
  const dx = ((seed * 9301 + 49297) % 233280) / 233280 - 0.5;
  const dy = ((seed * 12345 + 6789) % 233280) / 233280 - 0.5;

  return (
    <div
      style={buildContainerStyle(x, y, textAlign ?? "center", {
        opacity: Math.min(1, t * 1.3),
        transform: `translate(calc(-50% + ${dx * amp * 2}px), calc(-50% + ${dy * amp * 2}px))`,
      })}
    >
      <p style={baseTextStyle(props)}>{text}</p>
    </div>
  );
};
