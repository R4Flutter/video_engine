import { Img } from "remotion";
import type { BaseEffectProps } from "../../types";

export const ArchiveLook: React.FC<BaseEffectProps> = ({ image, children, intensity = 1, style, className }) => {
  if (!image) return <>{children}</>;
  const grayscaleAmount = 1;
  const sepiaAmount = 0.3 * intensity;
  return (
    <Img
      src={image}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: `grayscale(${grayscaleAmount}) sepia(${sepiaAmount})`,
        ...style,
      }}
      className={className}
    >
      {children}
    </Img>
  );
};