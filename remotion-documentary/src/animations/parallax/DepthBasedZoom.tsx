import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

type DepthLayer = { src: string; depth: number };
type DepthConfig = { depthMap?: DepthLayer[] };

const DEFAULT_LAYERS: DepthLayer[] = [
  { src: "", depth: 1.0 },
  { src: "", depth: 1.06 },
];

/**
 * DepthBasedZoom — pure scale animation driven by depth. No translate.
 * Higher depth = scales up more. Use for "everyone zooms in together but
 * foreground zooms faster" — feels like a dolly without the pan drift.
 */
export const DepthBasedZoom: React.FC<BaseEffectProps & { config?: any }> = ({
  image,
  children,
  durationInFrames = 90,
  delay = 0,
  intensity = 1,
  style,
  className,
  config,
}) => {
  const frame = useCurrentFrame();
  useVideoConfig();
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = cinema(t);

  const cfg = (config as DepthConfig | undefined) ?? {};
  const input = cfg.depthMap && cfg.depthMap.length >= 1 ? cfg.depthMap : DEFAULT_LAYERS;
  const layers: DepthLayer[] = input.slice(0, 6).map((l, i) => ({
    src: l.src || (i === 0 ? (typeof image === "string" ? image : "") : ""),
    depth: typeof l.depth === "number" ? l.depth : 1 + 0.05 * i,
  }));

  return (
    <AbsoluteFill style={style} className={className}>
      {layers.map((layer, i) => {
        // max scale = 1 + (depth-1) * intensity. t-multiplied via eased.
        const scale = 1 + Math.max(0, layer.depth - 1) * intensity * eased;
        return (
          <Img
            key={`depth-zoom-${i}-${layer.src}`}
            src={layer.src}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${interpolate(scale, [1, 1.2], [1, 1.2])})`,
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
