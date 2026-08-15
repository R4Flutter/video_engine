import React from "react";
import { AbsoluteFill, Easing, Img, OffthreadVideo, staticFile, interpolate, useCurrentFrame } from "remotion";
import type { ScriptBeat } from "../director/types";
import footage from "../footage.json";
import { theme } from "../theme";

export type EditorialSceneProps = { dur: number; beat?: ScriptBeat };
const sans = theme.font;
const serif = 'Georgia, "Times New Roman", serif';

const ease = (frame:number,a:number,b:number,out:[number,number]=[0,1]) => interpolate(frame,[a,b],out,{extrapolateLeft:"clamp",extrapolateRight:"clamp",easing:Easing.bezier(0.22,1,0.36,1)});
const words = (value:string) => value.trim().split(/\s+/).filter(Boolean);
const manifest = footage as Record<string,string>;

const sourceFor = (n:number) => manifest[String(n)] ? String(manifest[String(n)]) : "";
const hasAsset = (n:number) => Boolean(sourceFor(n));

const Header:React.FC<{ kicker:string }> = ({ kicker }) => (
  <div style={{position:"absolute",left:90,top:210,fontFamily:sans,fontSize:24,fontWeight:850,letterSpacing:4,textTransform:"uppercase",color:theme.color.green}}>{kicker}</div>
);

const Rule = () => <div style={{position:"absolute",left:90,top:350,width:860,height:1,background:theme.color.dim,opacity:.28}} />;

const Headline:React.FC<{ text:string; top?:number; maxWidth?:number; align?:"left"|"center" }> = ({text,top=430,maxWidth=850,align="left"}) => (
  <div style={{position:"absolute",left:align==="center"?90:90,right:align==="center"?90:undefined,top,maxWidth,fontFamily:serif,fontSize:78,lineHeight:1.02,fontWeight:700,color:theme.color.text,textAlign:align,letterSpacing:-2}}>{text}</div>
);

const AssetFrame:React.FC<{n:number}> = ({n}) => {
  const src = sourceFor(n);
  const frame = useCurrentFrame();
  if (!src) {
    return <div style={{position:"absolute",left:90,top:540,width:900,height:720,border:`1px solid ${theme.color.dim}`,background:"rgba(255,255,255,.035)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{fontFamily:sans,fontSize:28,letterSpacing:3,color:theme.color.dim,textTransform:"uppercase"}}>archive / evidence</div>
    </div>;
  }
  const path = src.replace(/^footage\//, "");
  const full = staticFile(path);
  const scale = 1.01 + ease(frame,0,Math.max(20,frame+1),[0,.018]);
  if (/\.mp4$/i.test(src)) {
    return <div style={{position:"absolute",left:40,top:420,width:1000,height:860,overflow:"hidden",border:`1px solid ${theme.color.dim}`}}><OffthreadVideo src={full} muted style={{width:"100%",height:"100%",objectFit:"cover",transform:`scale(${scale})`}} /></div>;
  }
  return <div style={{position:"absolute",left:40,top:420,width:1000,height:860,overflow:"hidden",border:`1px solid ${theme.color.dim}`}}><Img src={full} style={{width:"100%",height:"100%",objectFit:"cover",transform:`scale(${scale})`}} /></div>;
};

export const Archive:React.FC<EditorialSceneProps> = ({dur,beat}) => {
  const frame = useCurrentFrame();
  const label = beat?.text || beat?.name || "THE REAL STORY";
  return <AbsoluteFill>
    <Header kicker="ARCHIVE"/><Rule/>
    <AssetFrame n={beat?.n ?? 0}/>
    <div style={{position:"absolute",left:90,top:1320,width:900,display:"flex",justifyContent:"space-between",alignItems:"flex-end",transform:`translateY(${ease(frame,0,18,[18,0])}px)`,opacity:ease(frame,0,12)}}>
      <div style={{fontFamily:sans,fontWeight:900,fontSize:28,letterSpacing:2,color:theme.color.gold}}>{label.toUpperCase()}</div>
      <div style={{fontFamily:sans,fontSize:20,letterSpacing:2,color:theme.color.dim,textTransform:"uppercase"}}>{hasAsset(beat?.n ?? 0) ? "source-led" : "asset pending"}</div>
    </div>
    <div style={{position:"absolute",left:90,top:1410,maxWidth:840,fontFamily:serif,fontSize:42,color:theme.color.text,lineHeight:1.12}}>{beat?.reveal ?? beat?.visual ?? "Show the evidence, not a generic illustration."}</div>
  </AbsoluteFill>;
};

export const DocumentFinance:React.FC<EditorialSceneProps> = ({dur,beat}) => {
  const frame = useCurrentFrame();
  const data = beat?.data ?? [];
  const main = data[0];
  return <AbsoluteFill>
    <Header kicker="PRIMARY SOURCE"/><Rule/>
    <div style={{position:"absolute",left:110,top:470,width:760,height:820,background:"#F4F1EA",transform:`rotate(${interpolate(frame,[0,18],[-1.8,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp"})}deg)`,boxShadow:"0 20px 50px rgba(0,0,0,.25)",padding:42,boxSizing:"border-box"}}>
      <div style={{fontFamily:sans,fontSize:22,fontWeight:850,letterSpacing:4,color:"#8A857C"}}>DOCUMENT / EXHIBIT</div>
      <div style={{marginTop:38,width:"75%",height:26,background:"#1A1A1A",opacity:.82}}/>
      <div style={{marginTop:28,width:"92%",height:12,background:"#C9C2B4"}}/>
      <div style={{marginTop:18,width:"84%",height:12,background:"#C9C2B4"}}/>
      <div style={{marginTop:55,fontFamily:serif,fontSize:54,lineHeight:1.02,color:"#1A1A1A"}}>{main?.label ?? "The figure that matters"}</div>
      <div style={{marginTop:22,fontFamily:sans,fontSize:104,fontWeight:950,color:theme.color.green}}>{main?.raw ?? "PROOF"}</div>
      <div style={{marginTop:30,width:"100%",height:1,background:"#C9C2B4"}}/>
      <div style={{marginTop:24,fontFamily:sans,fontSize:20,letterSpacing:2,color:"#8A857C"}}>VERIFIED VISUAL / SOURCE-FIRST EDIT</div>
    </div>
    <div style={{position:"absolute",left:780,top:620,width:220,height:220,border:`8px solid ${theme.color.gold}`,transform:`rotate(${ease(frame,0,20,[-4,2])}deg)`,opacity:.9}}/>
    <div style={{position:"absolute",left:92,top:1380,maxWidth:880,fontFamily:serif,fontSize:42,color:theme.color.text,lineHeight:1.08}}>{beat?.reveal ?? "Give the viewer an artifact they can visually believe."}</div>
  </AbsoluteFill>;
};

export const CompareFinance:React.FC<EditorialSceneProps> = ({beat}) => {
  const rows = beat?.data ?? [];
  const a = rows[0] ?? {label:"A",value:1,raw:"1"};
  const b = rows[1] ?? {label:"B",value:.5,raw:"0.5"};
  const max = Math.max(Math.abs(a.value),Math.abs(b.value),1);
  return <AbsoluteFill>
    <Header kicker="THE CONTRAST"/><Rule/>
    <Headline text={beat?.text ?? beat?.reveal ?? "The gap is the story."} top={430}/>
    <div style={{position:"absolute",left:92,right:92,top:780}}>
      {[a,b].map((row,i)=><div key={i} style={{marginBottom:70}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",fontFamily:sans,fontWeight:850,color:theme.color.text,fontSize:30}}>
          <span>{row.label}</span><span style={{color:i===1?theme.color.green:theme.color.gold,fontSize:56}}>{row.raw}</span>
        </div>
        <div style={{height:48,marginTop:18,background:"rgba(255,255,255,.08)"}}><div style={{height:"100%",width:`${Math.max(8,Math.min(100,Math.abs(row.value)/max*100))}%`,background:i===1?theme.color.green:theme.color.gold}}/></div>
      </div>)}
    </div>
    <div style={{position:"absolute",left:92,top:1375,maxWidth:850,fontFamily:serif,fontSize:42,color:theme.color.text,lineHeight:1.08}}>{beat?.question ?? "The viewer should feel the difference before hearing the explanation."}</div>
  </AbsoluteFill>;
};

export const StatFinance:React.FC<EditorialSceneProps> = ({beat}) => {
  const frame = useCurrentFrame();
  const value = beat?.data?.[0]?.raw ?? "BIG NUMBER";
  const label = beat?.data?.[0]?.label ?? beat?.text ?? "THE NUMBER";
  return <AbsoluteFill>
    <Header kicker="ONE NUMBER"/><Rule/>
    <div style={{position:"absolute",left:90,top:470,width:900,fontFamily:sans,fontWeight:950,fontSize:220,lineHeight:.9,letterSpacing:-10,color:theme.color.gold,transform:`scale(${1+ease(frame,0,12,[.03,0])})`}}>{value}</div>
    <div style={{position:"absolute",left:96,top:760,maxWidth:820,fontFamily:serif,fontWeight:700,fontSize:72,lineHeight:1.02,color:theme.color.text}}>{label}</div>
    <div style={{position:"absolute",left:96,top:1080,width:760,height:12,background:theme.color.green,transformOrigin:"left",transform:`scaleX(${ease(frame,0,24)})`}}/>
    <div style={{position:"absolute",left:96,top:1150,maxWidth:780,fontFamily:sans,fontSize:30,lineHeight:1.25,color:theme.color.dim,letterSpacing:.5}}>{beat?.reveal ?? beat?.visual ?? "Let the number arrive cleanly. Then explain why it matters."}</div>
  </AbsoluteFill>;
};

export const EditorialGraphic:React.FC<EditorialSceneProps> = ({beat}) => {
  const frame = useCurrentFrame();
  const label = beat?.text ?? beat?.name ?? "THE MECHANISM";
  return <AbsoluteFill>
    <Header kicker="MECHANISM"/><Rule/>
    <div style={{position:"absolute",left:92,top:470,width:896,height:650}}>
      {[0,1,2].map((i)=><div key={i} style={{position:"absolute",left:80+i*260,top:180+(i%2)*120,width:180,height:180,borderRadius:"50%",border:`4px solid ${i===1?theme.color.green:theme.color.gold}`,transform:`scale(${ease(frame,4+i*6,18+i*6,[.7,1])})`,opacity:ease(frame,3+i*5,14+i*5)}}/>)}
      {[0,1].map((i)=><div key={i} style={{position:"absolute",left:250,top:270+i*130,width:360,height:8,background:theme.color.dim,opacity:.45,transformOrigin:"left",transform:`scaleX(${ease(frame,8+i*7,22+i*7)})`}}/>)}
    </div>
    <div style={{position:"absolute",left:92,top:1120,fontFamily:serif,fontSize:78,fontWeight:700,lineHeight:1.02,color:theme.color.text,maxWidth:840}}>{label}</div>
    <div style={{position:"absolute",left:96,top:1360,maxWidth:760,fontFamily:sans,fontSize:30,lineHeight:1.25,color:theme.color.dim}}>{beat?.reveal ?? beat?.visual}</div>
  </AbsoluteFill>;
};
