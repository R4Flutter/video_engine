import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

type DollyLayer = { src: string; depth: number };
type DollyConfig = {
  layers?: DollyLayer[];
  /** percent of width every layer translates, default 3 (positive = right) */
  amount?: number;
  /** multiplier on top of `amount` for the grow-in scale, default 0.08 */
  zoom?: number;
};

const DEFAULT_LAYERS: DollyLayer[] = [
  { src: "", depth: 1.0 },
  { src: "", depth: 1.05 },
];

/**
 * Dolly — every layer translates the same direction (e.g. all right by 3% of width)
 * with a synchronized zoom-in. Reads as "camera dollying in along a lateral axis"
 * (the world slides past, the frame tightens). Use for "we're moving through this
 * scene" reveals.
 */
export const Dolly: React.FC<BaseEffectProps & { config?: any }> = ({
  image,
  children,
  durationInFrames = 100,
  delay = 0,
  intensity = 1,
  style,
  className,
  config,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = cinema(t);

  const cfg = (config as DollyConfig | undefined) ?? {};
  const amount = (typeof cfg.amount === "number" ? cfg.amount : 3) * intensity;
  const zoom = (typeof cfg.zoom === "number" ? cfg.zoom : 0.08) * intensity;

  const input = cfg.layers && cfg.layers.length >= 1 ? cfg.layers : DEFAULT_LAYERS;
  const layers: DollyLayer[] = input.slice(0, 6).map((l, i) => ({
    src: l.src || (i === 0 ? (typeof image === "string" ? image : "") : ""),
    depth: typeof l.depth === "number" ? l.depth : 1 + 0.04 * i,
  }));

  const translateX = interpolate(eased, [0, 1], [0, (amount / 100) * width]);
  // All layers get the same base zoom, depth just adds a tiny extra
  const baseScale = interpolate(eased, [0, 1], [1, 1 + zoom]);

  return (
    <AbsoluteFill style={style} className={className}>
      {layers.map((layer, i) => {
        // Depth-multiplied scale keeps parallax feel even though every layer moves
        // the same direction. Each layer's extra = (depth-1) * 0.5 * zoom * eased.
        const depthScale = 1 + Math.max(0, layer.depth - 1) * 0.5 * zoom * eased;
        const scale = baseScale * depthScale;
        return (
          <Img
            key={`dolly-${i}-${layer.src}`}
            src={layer.src}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `translateX(${translateX}px) scale(${scale})`,
              transformOrigin: "center center",
              willChange: "transform",
            }}
          />
        );
      })}
      {children}
    </AbsoluteFill>
  );
};
