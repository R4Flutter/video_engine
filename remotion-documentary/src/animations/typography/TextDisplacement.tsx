import { useCurrentFrame, useVideoConfig } from "remotion";
import type { TextEffectProps } from "../../types";
import {
  baseTextStyle,
  buildContainerStyle,
  useTextPosition,
} from "./utils";

/**
 * TextDisplacement — renders the text three times, each as a separate layer,
 * with a chromatic-aberration-style offset that "shakes" pseudo-randomly.
 * Great for a glitchy, broken-transmission feel.
 *
 * `config`:
 *   - amount: max px offset per channel (default 6)
 *   - fps: how fast the noise re-rolls (default 12; lower = chunkier glitch)
 *   - layers: which color channels to use. default ["#FF2D55", "#00E5FF", null]
 *     — the null entry is the "real" text, drawn on top.
 */
type Layer = string | null;

export const TextDisplacement: React.FC<TextEffectProps> = (props) => {
  const { text, delay, textAlign, color } = props;
  const { x, y } = useTextPosition(props);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cfg = (props as TextEffectProps & {
    config?: { amount?: number; rate?: number; layers?: Layer[] };
  }).config;
  const amount = cfg?.amount ?? 6;
  const rate = cfg?.rate ?? 12; // re-rolls per second
  const layers: Layer[] = cfg?.layers ?? ["#FF2D55", "#00E5FF", null];

  // Pseudo-random per frame, deterministic given (frame, layer index).
  const start = delay ?? 0;
  if (frame < start) {
    return <div style={buildContainerStyle(x, y, textAlign ?? "center")} />;
  }
  const t = (frame - start) / fps;
  // Decay over time — glitch is loudest at the start, settles to 0.
  const decay = Math.exp(-t * 0.6);
  const seed = Math.floor(t * rate);

  const noise = (i: number) => {
    const v = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    return (v - Math.floor(v)) * 2 - 1; // -1..1
  };

  return (
    <div style={buildContainerStyle(x, y, textAlign ?? "center")}>
      {layers.map((c, i) => {
        if (c === null) {
          return (
            <span key={i} style={baseTextStyle(props)}>
              {text}
            </span>
          );
        }
        const dx = noise(i * 2) * amount * decay;
        const dy = noise(i * 2 + 1) * amount * decay;
        return (
          <span
            key={i}
            style={{
              ...baseTextStyle(props),
              color: c,
              position: i === 0 ? "absolute" : undefined,
              left: i === 0 ? dx : undefined,
              top: i === 0 ? dy : undefined,
              mixBlendMode: "screen",
              transform:
                i === 0 ? `translate(${dx}px, ${dy}px)` : undefined,
              pointerEvents: "none",
            }}
          >
            {text}
          </span>
        );
      })}
    </div>
  );
};
