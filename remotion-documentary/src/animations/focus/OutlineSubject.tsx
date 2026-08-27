import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Img } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

const DEFAULT_SUBJECT = { x: 0.3, y: 0.3, w: 0.4, h: 0.4 };

/**
 * OutlineSubject — animated outline (yellow default) drawn around a subject
 * region. Subject position and size are configurable via `config.subject`.
 *
 * Default subject is a centered 40%×40% box. The outline fades in and grows
 * slightly during the entrance.
 */
export const OutlineSubject: React.FC<BaseEffectProps & { config?: any }> = ({
  image,
  children,
  durationInFrames = 60,
  delay = 0,
  intensity = 1,
  style,
  className,
  config,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;
  const local = frame - delay;
  const t = Math.max(0, Math.min(1, local / durationInFrames));
  const eased = cinema(t);
  const subject = { ...DEFAULT_SUBJECT, ...(config?.subject || {}) };
  const opacity = interpolate(eased, [0, 1], [0, 1 * intensity]);
  // The outline grows slightly during entrance (0.95 → 1.0).
  const scale = interpolate(eased, [0, 1], [0.95, 1]);

  return (
    <AbsoluteFill style={style} className={className}>
      <Img
        src={typeof image === "string" ? image : (image as any)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: `${subject.x * 100}%`,
          top: `${subject.y * 100}%`,
          width: `${subject.w * 100}%`,
          height: `${subject.h * 100}%`,
          border: `${3 * intensity}px solid #FFD400`,
          borderRadius: "4px",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.5), 0 0 24px rgba(255,212,0,0.4)",
          opacity,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          pointerEvents: "none",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
