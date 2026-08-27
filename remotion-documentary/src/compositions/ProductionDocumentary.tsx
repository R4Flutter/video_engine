import {AbsoluteFill, staticFile} from "remotion";
import {DocumentaryEpisode} from "../engine/CinematicShot";
import type {DocumentaryEpisodeSpec} from "../engine/types";

const SAMPLE = {
  building: staticFile("sample-building.svg"),
  document: staticFile("sample-document.svg"),
  portrait: staticFile("sample-portrait.svg"),
  map: staticFile("sample-map.svg"),
};

export const PRODUCTION_DOCUMENTARY_SPEC: DocumentaryEpisodeSpec = {
  fps: 30,
  width: 1920,
  height: 1080,
  shots: [
    {id:"establish", durationInFrames:150, image:SAMPLE.building, focalPoint:{x:.52,y:.48}, camera:{effect:"pushIn",target:{x:.52,y:.48},scale:1.18,intensity:1}, atmosphere:{grain:.08,vignette:.14}, overlays:[{effect:"textRise",text:"THE BUILDING",from:18,durationInFrames:60,config:{fontSize:92,y:.82,fontWeight:800}}]},
    {id:"evidence", durationInFrames:180, image:SAMPLE.document, focalPoint:{x:.56,y:.55}, camera:{effect:"detailReveal",target:{x:.56,y:.55},scale:1.22,intensity:1}, atmosphere:{grain:.06,vignette:.12}, overlays:[{effect:"documentReveal",from:22,durationInFrames:80,config:{highlightY:.54}},{effect:"docTextUnderline",from:78,durationInFrames:58,config:{underlineY:.54,accent:"#ff3b30"}},{effect:"textFade",text:"THE DETAIL THAT CHANGED EVERYTHING",from:110,durationInFrames:60,config:{fontSize:48,y:.84,fontWeight:700}}]},
    {id:"portrait", durationInFrames:180, image:SAMPLE.portrait, focalPoint:{x:.49,y:.38}, camera:{effect:"faceReframe",target:{x:.49,y:.38},scale:1.28,intensity:1}, atmosphere:{grain:.07,vignette:.16}, overlays:[{effect:"spotlight",from:28,durationInFrames:92,config:{target:{x:.49,y:.38},size:.34}},{effect:"fullScreenStatement",text:"EVERYONE MISSED IT.",from:90,durationInFrames:66,config:{fontSize:100,y:.78,fontWeight:900}}]},
    {id:"location", durationInFrames:180, image:SAMPLE.map, focalPoint:{x:.34,y:.58}, camera:{effect:"pushIn",target:{x:.34,y:.58},scale:1.16,intensity:1}, atmosphere:{grain:.04,vignette:.1}, overlays:[{effect:"routeDrawing",from:15,durationInFrames:120,config:{target:{x:.34,y:.58},endX:.78,endY:.32,accent:"#ff3b30"}},{effect:"textSlide",text:"FOLLOW THE MONEY",from:82,durationInFrames:55,config:{fontSize:72,y:.82,fontWeight:800}}]},
  ],
};

export const ProductionDocumentary: React.FC = () => <AbsoluteFill><DocumentaryEpisode spec={PRODUCTION_DOCUMENTARY_SPEC}/></AbsoluteFill>;
