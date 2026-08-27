import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

const BACKGROUND_REGION = { x: 0, y: 0, w: 1, h: 1 };

/**
 * BackgroundCrop — full-frame region by default (no actual crop). Use to emphasize
 * background context, or as a neutral "show the whole picture" reframe.
 * Pass `config.region` to push into a specific subregion.
 */
export const BackgroundCrop: React.FC<BaseEffectProps & { config?: any }> = ({
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
  const region = { ...BACKGROUND_REGION, ...(config?.region || {}) };
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
