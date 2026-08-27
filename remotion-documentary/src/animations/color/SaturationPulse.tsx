import { Img, useCurrentFrame, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

export const SaturationPulse: React.FC<BaseEffectProps> = ({ image, children, intensity = 1, style, className }) => {
  if (!image) return <>{children}</>;
  const frame = useCurrentFrame();
  const local = frame % 2000;
  const t = Math.max(0, Math.min(1, local / 1000));
  const eased = cinema(t);
  const saturation = interpolate(eased, [0, 1], [1 * intensity, 0 * intensity]);

  return (
    <Img
      src={image}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: `saturate(${saturation})`,
        ...style,
      }}
      className={className}
    >
      {children}
    </Img>
  );
};