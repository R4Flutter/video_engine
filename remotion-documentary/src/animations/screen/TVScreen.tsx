import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface TVScreenProps extends BaseEffectProps { region?: {x?: number; y?: number; width?: number; height?: number}; intensity?: number; }

export const TVScreen: React.FC<TVScreenProps> = ({image, children, region={x:0,y:0,width:100,height:100}, intensity=1, style, className}) => {
  const {x=0,y=0,width=100,height=100}=region;
  const frame=useCurrentFrame();
  const noiseSeed=(frame*17)%255;
  return <AbsoluteFill style={style} className={className}>
    {image ? <img src={image} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",filter:`brightness(${Math.max(.2,.8*intensity)})`}} /> : null}
    <div style={{position:"absolute",left:`${x}%`,top:`${y}%`,width:`${width}%`,height:`${height}%`,overflow:"hidden",border:"1px solid #555",borderRadius:4,boxShadow:"inset 0 0 12px rgba(0,0,0,.5)",background:`repeating-linear-gradient(0deg,rgba(0,0,0,.28),rgba(0,0,0,.28) 2px,rgba(0,0,0,.08) 2px,rgba(0,0,0,.08) 4px),linear-gradient(90deg,rgba(${noiseSeed},${noiseSeed},${noiseSeed},.08),transparent)`}} />
    {children}
  </AbsoluteFill>;
};