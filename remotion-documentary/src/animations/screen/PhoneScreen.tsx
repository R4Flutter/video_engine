import { AbsoluteFill } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface PhoneScreenProps extends BaseEffectProps {
  region?: {x?:number;y?:number;width?:number;height?:number};
  children?: React.ReactNode;
  intensity?: number;
}

export const PhoneScreen: React.FC<PhoneScreenProps> = ({image, children, region={x:0,y:0,width:100,height:100}, intensity=1, style, className}) => {
  const {x=0,y=0,width=100,height=100}=region;
  const aspectRatio=Math.max(.1,width/Math.max(.1,height));
  const frameHeight=aspectRatio>1.9?height:height*(1.9/aspectRatio);
  const frameWidth=frameHeight*aspectRatio;
  const notchWidth=frameWidth*.08;
  const notchHeight=frameHeight*.04;
  return <AbsoluteFill style={style} className={className}>
    {image ? <img src={image} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/> : null}
    <div style={{position:"absolute",left:`${x}%`,top:`${y}%`,width:`${width}%`,height:`${height}%`,overflow:"hidden",borderRadius:16,background:"linear-gradient(135deg,#000 0%,#1a1a1a 100%)",boxShadow:"inset 0 0 20px rgba(0,0,0,.5)",border:`${Math.max(1,2*intensity)}px solid #007AFF`}}>
      <div style={{position:"relative",width:"100%",height:`calc(100% - ${notchHeight*2}%)`,background:"linear-gradient(135deg,#141414 0%,#000 100%)",borderRadius:"14px 14px 0 0",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,width:`calc(100% - ${notchWidth}px)`,height:`${notchHeight}%`,background:"linear-gradient(135deg,#007AFF 0%,#0055FF 100%)",borderRadius:"12px 12px 0 0"}}/>
        <div style={{position:"absolute",bottom:0,right:0,width:`${notchWidth}px`,height:`${notchHeight}%`,background:"linear-gradient(135deg,#007AFF 0%,#0055FF 100%)",borderRadius:"0 0 12px 0"}}/>
        <div style={{position:"absolute",right:0,width:`${notchWidth*.4}px`,height:`${notchHeight*.4}px`,background:"#FF3B30",borderRadius:"50%",top:"4px"}}/>
        {children}
      </div>
    </div>
  </AbsoluteFill>;
};