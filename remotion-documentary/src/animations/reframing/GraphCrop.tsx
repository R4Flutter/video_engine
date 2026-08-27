import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

const GRAPH_REGION = { x: 0.1, y: 0.3, w: 0.8, h: 0.4 };

/**
 * GraphCrop — wide horizontal center crop, slightly low. Default region is
 * tuned for chart bodies (bars, lines, axes).
 */
export const GraphCrop: React.FC<BaseEffectProps & { config?: any }> = ({
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
  const { width, height } = useVideoConfig();
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = cinema(t);
  const region = { ...GRAPH_REGION, ...(config?.region || {}) };
  const finalScale = Math.max(1 / region.w, 1 / region.h) * intensity;
  const tcx = region.x + region.w / 2;
  const tcy = region.y + region.h / 2;
  const scale = interpolate(eased, [0, 1], [1, finalScale]);
  const tx = interpolate(eased, [0, 1], [0, (0.5 - tcx) * width]);
  const ty = interpolate(eased, [0, 1], [0, (0.5 - tcy) * height]);

  return (
    <AbsoluteFill style={style} className={className}>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translate(${tx}px, ${ty}px)`,
          transformOrigin: "center center",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
