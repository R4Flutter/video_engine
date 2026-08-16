// VisualContinuity: long-form fatigue without Shorts-style overcutting.
import type { Script, ScriptBeat, VisualPurpose } from "../types.ts";
import { MODULE_BY_PURPOSE } from "./VisualPurpose.ts";
import { isLongForm, LONGFORM_ALLOWED_MODULES } from "./LongFormModulePolicy.ts";

export const VOX_MODULES = new Set(["kinetic","doodle","icon","chart","compare","stat","footage","callout","timeline","quote"]);
export const FINANCE_MODULES = new Set(["coinDrop","coinStack","investChart","jarFill","mountain","payoff","outro"]);
export const knownModule = (m: string) => VOX_MODULES.has(m) || FINANCE_MODULES.has(m) || LONGFORM_ALLOWED_MODULES.has(m);

export const moduleRuns = (beats: { n:number; module?:string }[]) => {
  const runs:{module:string;beats:number[]}[]=[];
  for (const b of beats) { const m=b.module??""; const last=runs[runs.length-1]; if(last&&last.module===m) last.beats.push(b.n); else runs.push({module:m,beats:[b.n]}); }
  return runs;
};
const counts=(beats:ScriptBeat[])=>{const out:Record<string,number>={};for(const b of beats)out[b.module??""]=(out[b.module??""]??0)+1;return out;};

const swapFor=(module:string,purpose:VisualPurpose,engine:"vox"|"finance",used:Record<string,number>)=>{
  const pool=(MODULE_BY_PURPOSE[purpose][engine]??[]).filter((m)=>m!==module);
  if(!pool.length)return module;
  return pool.sort((a,b)=>(used[a]??0)-(used[b]??0))[0];
};

export const enforceVariety=(script:Script,purposeOf:(b:ScriptBeat)=>VisualPurpose):{beats:ScriptBeat[];novelty:number[];warnings:string[]}=>{
  const engine:"vox"|"finance"=script.engine==="vox"?"vox":"finance";
  const longForm=engine==="finance"&&isLongForm(script.durationInSeconds);
  const beats=script.beats.map((b)=>({...b})); const warnings:string[]=[]; const used=counts(beats);
  // Shorts: no adjacent repeats. Long-form: allow two consecutive states; only
  // restage the third when it does not break narrative continuity.
  for(let i=1;i<beats.length;i++){
    const cur=beats[i].module??""; const p1=beats[i-1].module??""; const p2=i>1?(beats[i-2].module??""):"";
    if(i===beats.length-1||cur!==p1)continue;
    const run=cur===p2?3:2;
    if(longForm ? run<3 : run<2) continue;
    const next=swapFor(cur,purposeOf(beats[i]),engine,used);
    if(next!==cur){beats[i]={...beats[i],module:next};used[cur]-=1;used[next]=(used[next]??0)+1;warnings.push(`beat ${beats[i].n}: "${cur}" run too long — restaged as "${next}"`);}
  }
  const seen:Record<string,number>={};
  const novelty=beats.map((b)=>{const m=b.module??"";seen[m]=(seen[m]??0)+1;return Number(Math.max(0.25,1-(seen[m]-1)*0.3).toFixed(2));});
  const total=Math.max(1,beats.length);
  for(const [m,n] of Object.entries(counts(beats))) if(n/total>0.4) warnings.push(`"${m}" carries ${Math.round(n/total*100)}% of the cut`);
  return {beats,novelty,warnings};
};
