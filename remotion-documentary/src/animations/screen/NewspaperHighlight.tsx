import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface NewspaperHighlightProps extends BaseEffectProps {
  region?: {x?: number; y?: number; width?: number; height?: number};
  intensity?: number;
}

export const NewspaperHighlight: React.FC<NewspaperHighlightProps> = ({image, children, region = {x:0,y:0,width:100,height:100}, intensity = 1, style, className}) => {
  const {x=0,y=0,width=100,height=100} = region;
  const frame = useCurrentFrame();
  const pulse = (Math.sin((frame % 60) / 60 * Math.PI * 2) + 1) / 2;
  return <AbsoluteFill style={style} className={className}>
    {image ? <img src={image} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} /> : null}
    <div style={{position:"absolute",left:`${x}%`,top:`${y}%`,width:`${width}%`,height:`${height}%`,overflow:"hidden",background:`rgba(255,255,0,${0.16 + pulse * 0.14 * intensity})`,border:`1px solid rgba(255,255,0,${Math.min(1,0.35*intensity)})`,borderRadius:2}}>{children}</div>
  </AbsoluteFill>;
};