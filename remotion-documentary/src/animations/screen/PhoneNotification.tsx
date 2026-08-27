import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface PhoneNotificationProps extends BaseEffectProps {
  region?: {x?: number; y?: number; width?: number; height?: number};
  title?: string;
  subtitle?: string;
  intensity?: number;
}

export const PhoneNotification: React.FC<PhoneNotificationProps> = ({image, children, region = {x:0,y:0,width:100,height:100}, title = "New Message", subtitle = "Message received from Alex", intensity = 1, style, className}) => {
  const {x=0,y=0,width=100,height=100} = region;
  const frame = useCurrentFrame();
  const translateY = (frame % 60) / 60;
  return <AbsoluteFill style={style} className={className}>
    {image ? <img src={image} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} /> : null}
    <div style={{position:"absolute",left:`${x}%`,top:`${y - 20 * translateY}%`,width:`${width}%`,height:`${height + 20}%`,overflow:"hidden",background:"rgba(0,0,0,.9)",borderRadius:12,border:`1px solid rgba(255,59,48,${Math.min(1,0.8*intensity)})`,color:"#FF3B30",fontFamily:"SF Pro Rounded, system-ui, sans-serif"}}>
      <div style={{padding:8,fontSize:12*intensity}}><div style={{fontWeight:600,marginBottom:4}}>{title}</div><div style={{fontSize:11*intensity,opacity:.9}}>{subtitle}</div></div>
    </div>
    {children}
  </AbsoluteFill>;
};