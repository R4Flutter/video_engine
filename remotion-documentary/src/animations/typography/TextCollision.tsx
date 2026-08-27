import { useCurrentFrame, interpolate, useVideoConfig } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";
import { easeOutBounce, easeInOutQuart } from "../timing/easings";

/**
 * TextCollision — two halves of the text (split on the first space) fly in
 * from opposite sides and "collide" in the middle. Right after collision,
 * a tiny shake plays.
 *
 * `config`:
 *   - split: which character to split on (default " " — first space)
 *   - shake: post-collision shake amplitude in px (default 4)
 *   - intensity: overall speed multiplier (default 1)
 */
export const TextCollision: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const cfg = (props as TextEffectProps & {
    config?: { split?: string; shake?: number; intensity?: number };
  }).config;
  const start = delay ?? 0;
  const split = cfg?.split ?? " ";
  const shake = cfg?.shake ?? 4;
  const mult = cfg?.intensity ?? 1;
  const dur = Math.max(24, Math.round(36 / mult));

  // Find split point.
  const idx = text.indexOf(split);
  const left = idx > 0 ? text.slice(0, idx) : text;
  const right = idx > 0 ? text.slice(idx + 1) : "";

  // Collision point is when the two halves meet in the middle of the text width.
  // We approximate by completing the slide at t=0.7, then a 30% settle window
  // where a small bounce happens.
  const slideT = interpolate(frame, [start, start + dur * 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const slideEased = easeInOutQuart(slideT);

  const offsetLeft = -width * 0.3 * (1 - slideEased);
  const offsetRight = width * 0.3 * (1 - slideEased);

  // After collision, a brief bounce + shake.
  const collideAt = start + dur * 0.7;
  const postT = interpolate(frame, [collideAt, collideAt + dur * 0.3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bounce = easeOutBounce(postT);
  const squashY = 1 - 0.05 * Math.sin(postT * Math.PI); // tiny vertical squash

  // Tiny shake (a few frames after collision).
  const shakePhase = (frame - collideAt) / 6;
  const shakeX =
    frame > collideAt && frame < collideAt + 12
      ? Math.sin(shakePhase * Math.PI * 4) * shake * (1 - postT)
      : 0;

  return (
    <div style={buildContainerStyle(x, y, textAlign ?? "center")}>
      <span
        style={{
          ...baseTextStyle(props),
          display: "inline-flex",
          alignItems: "baseline",
          transform: `translate(${shakeX}px, 0) scaleY(${squashY})`,
          transformOrigin: "center center",
        }}
      >
        <span
          style={{
            display: "inline-block",
            transform: `translateX(${offsetLeft}px)`,
          }}
        >
          {left}
        </span>
        {idx > 0 ? <span>&nbsp;</span> : null}
        <span
          style={{
            display: "inline-block",
            transform: `translateX(${offsetRight}px) translateY(${(1 - bounce) * -6}px)`,
          }}
        >
          {right}
        </span>
      </span>
    </div>
  );
};
