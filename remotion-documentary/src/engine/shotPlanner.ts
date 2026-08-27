import type {DocumentaryShotSpec} from "./types";

export type ShotIntent = "establish"|"approach"|"evidence"|"portrait"|"detail"|"location"|"escalate"|"resolve";

export type ShotPlanningInput = {
  id: string;
  image: string;
  durationInFrames?: number;
  intent?: ShotIntent;
  focalPoint?: {x:number;y:number};
  title?: string;
  accent?: string;
};

export const planShot = (input: ShotPlanningInput): DocumentaryShotSpec => {
  const duration = input.durationInFrames ?? 150;
  const focal = input.focalPoint ?? {x:.5,y:.5};
  const accent = input.accent ?? "#ff3b30";
  const intent = input.intent ?? "establish";
  const base = {id:input.id,image:input.image,durationInFrames:duration,focalPoint:focal,backgroundColor:"#080808",atmosphere:{grain:.06,vignette:.12}} satisfies DocumentaryShotSpec;
  if (intent === "evidence") return {...base,camera:{effect:"detailReveal",target:focal,scale:1.22,intensity:1},overlays:[{effect:"documentReveal",durationInFrames:Math.min(84,duration),config:{highlightY:focal.y}},{effect:"docTextUnderline",from:Math.min(48,duration*.28),durationInFrames:Math.min(60,duration*.4),config:{underlineY:focal.y,accent}}]};
  if (intent === "portrait") return {...base,camera:{effect:"faceReframe",target:focal,scale:1.26,intensity:1},overlays:[{effect:"spotlight",from:Math.min(24,duration*.15),durationInFrames:Math.min(90,duration*.55),config:{target:focal,size:.34,accent}}]};
  if (intent === "detail") return {...base,camera:{effect:"objectReframe",target:focal,scale:1.34,intensity:1},overlays:[{effect:"magnifyingGlass",from:Math.min(34,duration*.2),durationInFrames:Math.min(86,duration*.5),config:{target:focal,accent}}]};
  if (intent === "location") return {...base,camera:{effect:"pushIn",target:focal,scale:1.15,intensity:1},overlays:[{effect:"routeDrawing",from:10,durationInFrames:Math.min(120,duration*.7),config:{target:focal,endX:.78,endY:.32,accent}}]};
  if (intent === "escalate") return {...base,camera:{effect:"pushIn",target:focal,scale:1.3,intensity:1.5},overlays:[{effect:"textScale",text:input.title ?? "THIS CHANGED EVERYTHING",from:duration*.42,durationInFrames:Math.min(70,duration*.4),config:{fontSize:72,y:.8,fontWeight:900,accent}}]};
  if (intent === "resolve") return {...base,camera:{effect:"pullOut",target:focal,scale:1.06,intensity:.5},overlays:[{effect:"textFade",text:input.title ?? "THE ANSWER",from:duration*.48,durationInFrames:Math.min(60,duration*.4),config:{fontSize:62,y:.82,fontWeight:700}}]};
  if (intent === "approach") return {...base,camera:{effect:"pushPanRight",target:focal,scale:1.2,intensity:1},overlays: input.title ? [{effect:"textRise",text:input.title,from:duration*.36,durationInFrames:Math.min(70,duration*.4),config:{fontSize:76,y:.82,fontWeight:800}}] : []};
  return {...base,camera:{effect:"slowDrift",target:focal,scale:1.1,intensity:.8},overlays: input.title ? [{effect:"textFade",text:input.title,from:duration*.36,durationInFrames:Math.min(64,duration*.4),config:{fontSize:64,y:.82,fontWeight:700}}] : []};
};

export const planEpisode = (inputs: ShotPlanningInput[]) => inputs.map(planShot);
