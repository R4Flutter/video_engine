import { Img } from "remotion";
import type { BaseEffectProps } from "../../types";

export const ToColor: React.FC<BaseEffectProps> = ({ image, children, intensity = 1, style, className }) => {
  const progress = intensity || 1;
  const grayscale = 1 - progress;
  const filterValue = `grayscale(${grayscale})`;
  if (!image) return <>{children}</>;
  return (
    <Img
      src={image}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: filterValue,
        ...style,
      }}
      className={className}
    >
      {children}
    </Img>
  );
};