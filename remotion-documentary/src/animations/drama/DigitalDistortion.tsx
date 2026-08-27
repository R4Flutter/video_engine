import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";

export const DigitalDistortion: React.FC<BaseEffectProps> = ({ image, children, durationInFrames = 50, delay = 0, intensity = 1, style, className }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const scale = interpolate(t, [0, 1], [1, 1.5 * intensity]);

  return (
    <AbsoluteFill style={style} className={className}>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: `url(#displacement-${Math.round(t * 100)})`,
        }}
      />
      <svg width="0" height="0">
        <defs>
          <filter id="displacement-${Math.round(t * 100)}">
            <feDisplacementMap in2="SourceGraphic" scale="${10 * intensity}" xChannelSelector="R" />
          </filter>
        </defs>
      </svg>
      {children}
    </AbsoluteFill>
  );
};