// Shared staging: audio plus a lightweight editorial camera language.
// Motion is transform-only so Remotion can render it efficiently on CPU.
import React from "react";
import { Audio, Easing, getInputProps, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import script from "./script.json";
import voice from "./voice.json";
import { bedLevel, beatPlan, cameraMove, SFX_CUES } from "./plan";

const BED = 0.4;
const SWELL = 0.58;
const DUCK = 0.34;
const ramp = (x:number, from:[number,number], to:[number,number]) => interpolate(x, from, to, { extrapolateLeft:"clamp", extrapolateRight:"clamp" });

export const NARRATION = voice.beats.filter((b) => b.file && b.words.length > 0);
const SPEECH = NARRATION.map((b) => [b.start, b.start + b.words[b.words.length - 1].end] as const);
const PLANNED_BED = SFX_CUES.length > 0 || bedLevel(0) !== 0.4 || bedLevel(1) !== bedLevel(0);

export const impactAt = (module:string, word:RegExp, frac=0.6) => {
  const beat = script.beats.find((b) => b.module === module);
  if (!beat) { const last = script.beats[script.beats.length - 1]; return last ? last.start : 0; }
  const take = voice.beats.find((b) => b.n === beat.n);
  const hit = take?.words.find((w) => word.test(w.w));
  if (!take) return beat.start + (beat.end - beat.start) * frac;
  return take.start + (hit ? hit.start : (beat.end - beat.start) * frac);
};

/**
 * Camera grammar is selected by the director plan, while the exact pixel
 * movement stays here in the renderer. That separation keeps editorial intent
 * stable while rendering taste can evolve independently.
 */
export const usePlanCamera = (impact:number, strength=1.1) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beat = script.beats.find((b) => frame >= b.start*fps && frame < b.end*fps) ?? script.beats[script.beats.length-1];
  const planBeat = beatPlan(beat.n);
  const intent = planBeat?.motion?.camera?.intent ?? beat.camera ?? "settle";
  const [legacyFrom, legacyTo] = cameraMove(beat.n);
  const start = beat.start*fps;
  const end = Math.max(start+1, beat.end*fps);
  const t = Math.max(0, Math.min(1, (frame-start)/(end-start)));
  const direction = beat.n % 2 === 0 ? 1 : -1;
  let scale = legacyFrom;
  let tx = 0;
  let ty = 0;
  let rotate = 0;

  switch (intent) {
    case "hold":
      scale = 1; break;
    case "push":
      scale = interpolate(t,[0,1],[1.0,1.045]);
      tx = direction * interpolate(t,[0,1],[8,-10]);
      ty = interpolate(t,[0,1],[5,-3]);
      break;
    case "pull":
      scale = interpolate(t,[0,1],[1.045,1.0]);
      tx = direction * interpolate(t,[0,1],[-10,8]);
      ty = interpolate(t,[0,1],[-3,5]);
      break;
    case "punch": {
      const hit = Math.min(1, Math.max(0, t / 0.24));
      const settle = Math.max(0, Math.min(1, (t-0.24) / 0.76));
      const hitScale = interpolate(hit,[0,1],[1,1.06],{easing:Easing.out(Easing.quad)});
      const settled = interpolate(settle,[0,1],[1.06,1.035],{easing:Easing.inOut(Easing.quad)});
      scale = t < 0.24 ? hitScale : settled;
      tx = direction * interpolate(t,[0,0.24,1],[0,-12,-2]);
      rotate = direction * interpolate(t,[0,0.24,1],[0,0.22,0]);
      break;
    }
    default:
      scale = interpolate(t,[0,1],[Math.max(1,legacyFrom),Math.max(1,legacyTo)]);
      tx = direction * interpolate(t,[0,1],[6,-6]);
      ty = interpolate(t,[0,1],[2,-2]);
      break;
  }

  const hit = frame - Math.round(impact*fps);
  const shake = strength > 0 && hit > 0 && hit < 10 ? Math.sin(hit*2.4) * (10-hit) * strength : 0;
  const transform = `translate3d(${tx+shake}px, ${ty+shake*0.5}px, 0) scale(${scale}) rotate(${rotate}deg)`;
  return { scale, shake, tx, ty, rotate, transform };
};

export const useCamera = (table:Record<string,[number,number]>, impact:number, strength=1.1) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beat = script.beats.find((b) => frame >= b.start*fps && frame < b.end*fps) ?? script.beats[script.beats.length-1];
  const [from,to] = table[beat.module] ?? [1,1];
  const scale = interpolate(frame,[beat.start*fps,beat.end*fps],[from,to],{ extrapolateLeft:"clamp", extrapolateRight:"clamp", easing:Easing.bezier(0.4,0,0.2,1) });
  const hit = frame - Math.round(impact*fps);
  const shake = strength>0 && hit>0 && hit<14 ? Math.sin(hit*2.4)*(14-hit)*strength : 0;
  return { scale, shake };
};

export const Soundtrack:React.FC<{ impact:number }> = ({ impact }) => {
  const { fps } = useVideoConfig();
  const total = script.durationInSeconds;
  const master = (() => { const db = Number(getInputProps().MASTER_GAIN_DB); return Number.isFinite(db) && db!==0 ? Math.pow(10,db/20) : 1; })();
  return <>
    {NARRATION.map((beat) => <Sequence key={`vo${beat.n}`} from={Math.round(beat.start*fps)}><Audio src={staticFile(`audio/${beat.file}`)} volume={master}/></Sequence>)}
    <Audio src={staticFile("audio/music.mp3")} loop volume={(f) => {
      const t = f/fps;
      const bed = PLANNED_BED ? bedLevel(t) : ramp(t,[impact-1,impact],[BED,SWELL]);
      const edges = ramp(t,[0,0.15],[0,1]) * ramp(t,[total-1.2,total],[1,0]);
      const duck = Math.min(1,...SPEECH.map(([a,b]) => t<a ? ramp(t,[a-0.3,a],[1,DUCK]) : t>b ? ramp(t,[b,b+0.45],[DUCK,1]) : DUCK));
      return bed*edges*duck*master;
    }}/>
    {(SFX_CUES.length ? SFX_CUES : script.sfx).flatMap((cue) => cue.files.map((file) => <Sequence key={`${cue.at}-${file}`} from={Math.round(cue.at*fps)}><Audio src={staticFile(`audio/${file}`)} volume={()=>0.5*master}/></Sequence>))}
  </>;
};
