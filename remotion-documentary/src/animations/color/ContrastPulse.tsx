import { Img, useCurrentFrame, interpolate } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema } from "../timing/easings";

export const ContrastPulse: React.FC<BaseEffectProps> = ({ image, children, intensity = 1, style, className }) => {
  if (!image) return <>{children}</>;
  const frame = useCurrentFrame();
  const local = frame % 2000;
  const t = Math.max(0, Math.min(1, local / 1000));
  const eased = cinema(t);
  const contrast = interpolate(eased, [0, 1], [1 * intensity, 1.5 * intensity]);

  return (
    <Img
      src={image}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: `contrast(${contrast})`,
        ...style,
      }}
      className={className}
    >
      {children}
    </Img>
  );
};