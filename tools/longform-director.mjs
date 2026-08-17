// Production long-form editorial director.
// Deterministic: script + optional yt_engine reference patterns -> one plan.
// This is intentionally separate from the ShortPlan director.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; };
const scriptPath = resolve(root, arg("--script", "video/src/script.json"));
const outPath = resolve(root, arg("--out", "video/src/longform-director-plan.json"));
const refsPath = arg("--references", "yt_engine/reference-patterns.json");
const script = JSON.parse(readFileSync(scriptPath, "utf8"));
const references = existsSync(resolve(root, refsPath)) ? JSON.parse(readFileSync(resolve(root, refsPath), "utf8")) : [];
const beats = [...(script.beats ?? [])].sort((a,b)=>a.start-b.start);
if (!beats.length) throw new Error("No script beats found");

const text = b => `${b.name ?? ""} ${b.vo ?? ""} ${b.visual ?? ""} ${b.text ?? ""}`.toLowerCase();
const has = (b, words) => words.some(w => text(b).includes(w));
const visualKind = b => {
  if (b.source || b.footage || has(b,["document","court","statement","filing","settlement"])) return "EVIDENCE";
  if (has(b,["ui","screen","click","cancel","button","website","app"])) return "UI_RECONSTRUCTION";
  if (b.data?.length || has(b,["revenue","members","billion","million","percent","chart","growth"])) return "DATA_GRAPHIC";
  if (has(b,["logo","companies","services","brands"])) return "LOGO_SYSTEM";
  if (has(b,["map","network","chain","mechanism","how it works"])) return "DIAGRAM";
  if (has(b,["archive","old photo","footage","history"])) return "ARCHIVAL";
  if (has(b,["gym","office","person","cursor","scroll","finger","box","shelf","bank statement"])) return "SPECIFIC_BROLL";
  if (b.visual || b.module) return "ESTABLISHING";
  return "TYPOGRAPHY";
};
const rewardFor = b => has(b,["reveal","surprise","instead","but","actually","turns out","however"]) ? "reversal" : has(b,["why","how","because","mechanism"]) ? "model" : has(b,["means","result","consequence","therefore"]) ? "consequence" : has(b,["proof","document","court","number","data"]) ? "information" : "answer";
const jobFor = b => b.purpose || (has(b,["reveal","actually","but","however"]) ? "reveal" : has(b,["why","how","because"]) ? "explain" : has(b,["court","document","data","number","proof"]) ? "proof" : "turn");
const questionFor = b => b.question || (has(b,["why","how"]) ? b.vo : `What does ${b.name || "this"} reveal?`);
const nextQuestionFor = (b, next) => next?.question || next?.vo || `What happens next?`;
const brollQueryFor = b => {
  const seed = (b.visual || b.name || b.vo || "specific business documentary footage").replace(/\s+/g," ").trim();
  return `${seed}, realistic documentary B-roll, specific physical action, finance business documentary, no text overlay`;
};
const cameraFor = (kind, job) => job === "reveal" ? "settle" : kind === "EVIDENCE" || kind === "DOCUMENT" ? "locked" : kind === "DATA_GRAPHIC" ? "push" : kind === "SPECIFIC_BROLL" ? "drift" : "hold";
const shotFor = kind => kind === "DATA_GRAPHIC" ? "screen" : kind === "EVIDENCE" || kind === "DOCUMENT" ? "document" : kind === "SPECIFIC_BROLL" ? "medium" : kind === "UI_RECONSTRUCTION" ? "screen" : "wide";
const transitionFor = (prev, kind) => !prev ? "cut" : prev === kind ? "cut" : (prev === "SPECIFIC_BROLL" && kind === "EVIDENCE") || (prev === "EVIDENCE" && kind === "SPECIFIC_BROLL") ? "contrast" : "cut";

// Chapters are inferred from explicit purpose/sequence changes, with hard visual resets
// at roughly 90-150s if the script has not declared a new world.
const chapters = [];
let current = null;
for (let i=0;i<beats.length;i++) {
  const b=beats[i], next=beats[i+1];
  const newWorld = !current || b.purpose === "hook" || b.purpose === "turn" || has(b,["new section","chapter","now","next"]);
  if (newWorld) {
    if (current) { current.end = b.start; current.beats = beats.slice(current.firstIndex,i).map(x=>x.n); current.resetAt = current.start; chapters.push(current); }
    current = { id:`ch-${chapters.length+1}`, title:b.name || `Chapter ${chapters.length+1}`, start:b.start, end:next?.end ?? b.end, thesis:b.vo || b.visual || b.name || "", openingQuestion:questionFor(b), closingPayoff:"", resetAt:b.start, firstIndex:i, beats:[] };
  }
  if (current) current.end = next?.end ?? b.end;
}
if (current) { current.beats=beats.slice(current.firstIndex).map(x=>x.n); chapters.push(current); }
chapters.forEach(c=>delete c.firstIndex);

const outBeats=[];
let prevKind=null, sameRun=0, visualChanges=0, evidenceEvents=0;
for (let i=0;i<beats.length;i++) {
  const b=beats[i], next=beats[i+1], kind=visualKind(b), dur=Math.max(0,b.end-b.start), job=jobFor(b);
  sameRun = kind===prevKind ? sameRun+1 : 1;
  if (kind!==prevKind) visualChanges++;
  if (kind==="EVIDENCE" || kind==="DOCUMENT" || kind==="UI_RECONSTRUCTION") evidenceEvents++;
  const maxHold = kind === "EVIDENCE" ? 10 : kind === "DATA_GRAPHIC" ? 8 : kind === "SPECIFIC_BROLL" ? 6 : 9;
  const fatigue = Math.min(1, Math.max(0, (dur-7)/8) + (sameRun-1)*0.16);
  const reset = fatigue >= 0.55 || sameRun >= 3;
  const risk = Math.min(0.92, 0.08 + fatigue*0.45 + (kind === "TYPOGRAPHY" ? 0.08 : 0) + (job === "explain" ? 0.05 : 0));
  const changes=[];
  if (dur > maxHold) changes.push(Math.min(dur-0.2,maxHold));
  else if (dur > 4 && (kind === "SPECIFIC_BROLL" || kind === "DATA_GRAPHIC")) changes.push(Math.min(dur-0.2, dur*0.58));
  const revealAt = job === "reveal" ? Math.min(dur*0.55, 3.2) : kind === "DATA_GRAPHIC" ? Math.min(dur*0.42, 3.5) : Math.min(dur*0.65, 4.5);
  outBeats.push({
    beat:b.n,start:b.start,end:b.end,duration:dur,chapterId:chapters.find(c=>b.start>=c.start && b.start<=c.end)?.id ?? "ch-1",
    narrativeJob:job,viewerQuestion:questionFor(b),nextQuestion:nextQuestionFor(b,next),payoff:b.reveal || next?.question || "",
    visual:{kind,subject:b.name || b.visual || "",action:b.visual || b.vo || "specific action",shotSize:shotFor(kind),camera:cameraFor(kind,job),changeAt:changes,maxHold,brollQuery:brollQueryFor(b),evidenceRequired:["EVIDENCE","DATA_GRAPHIC","DOCUMENT","UI_RECONSTRUCTION"].includes(kind)},
    typography:b.text ? {text:b.text,role:b.purpose === "reveal" ? "hero" : "support"} : undefined,
    audio:{music:job === "reveal" ? "drop" : fatigue > 0.65 ? "quiet" : "hold",silenceBeforeReveal:job === "reveal" ? 0.45 : 0,accents:job === "reveal" ? ["single restrained accent"] : []},
    transition:transitionFor(prevKind,kind),
    retention:{risk,reward:rewardFor(b),fatigueRisk:fatigue,visualResetRequired:reset}
  });
  prevKind=kind;
}

const duration=script.durationInSeconds || Math.max(...beats.map(b=>b.end));
const visualChangeRatePerMinute=duration ? visualChanges/(duration/60) : 0;
const evidenceRatePerMinute=duration ? evidenceEvents/(duration/60) : 0;
const fatigueWindows=[];
for (let i=0;i<outBeats.length;i++) if(outBeats[i].retention.fatigueRisk>=0.55) fatigueWindows.push({start:outBeats[i].start,end:outBeats[i].end,reason:"long hold or repeated visual grammar",fix:"insert evidence, change medium/scale, or stage a semantic reveal"});
const findings=[];
if (outBeats[0]?.start > 0.05) findings.push({severity:"FATAL",at:0,rule:"no_blank_open",message:"The timeline starts after time zero.",fix:"Make the opening claim/visual present on frame one."});
if ((outBeats[0]?.duration ?? 0) > 4 && outBeats[0]?.visual.kind === "TYPOGRAPHY") findings.push({severity:"HIGH",at:0,rule:"weak_visual_hook",message:"Opening relies on typography without concrete visual evidence or action.",fix:"Open on the contradiction, physical world, evidence, or specific action."});
if (visualChangeRatePerMinute < 5) findings.push({severity:"HIGH",at:0,rule:"low_visual_change_rate",message:`Only ${visualChangeRatePerMinute.toFixed(1)} semantic visual changes/minute.`,fix:"Add meaningful visual state changes; do not add decorative transitions."});
if (evidenceRatePerMinute < 1.5) findings.push({severity:"MED",at:0,rule:"low_evidence_rate",message:`Only ${evidenceRatePerMinute.toFixed(1)} evidence events/minute.`,fix:"Replace generic B-roll with documents, UI, numbers, archival material, or concrete proof where the narration makes claims."});
for(const w of fatigueWindows.slice(0,12)) findings.push({severity:"HIGH",at:w.start,rule:"fatigue_window",message:`Viewer fatigue risk ${((outBeats.find(b=>b.start===w.start)?.retention.fatigueRisk||0)*100).toFixed(0)}%.`,fix:w.fix});
if (sameRun > 3) findings.push({severity:"MED",at:0,rule:"visual_grammar_repetition",message:"Repeated visual grammar detected.",fix:"Rotate evidence/B-roll/data/document/UI rather than changing effects only."});
const avgRisk=outBeats.length ? outBeats.reduce((s,b)=>s+b.retention.risk,0)/outBeats.length : 0;
const projectedRetention=Math.max(0.08,Math.min(0.94,Math.exp(-avgRisk*outBeats.length*0.22)));
const plan={version:"longform-1.0",project:{title:script.title,durationInSeconds:duration,fps:script.fps,width:script.width,height:script.height,engine:script.engine,mode:"LONGFORM_DOCUMENTARY"},editorialThesis:"Every visual must advance understanding, evidence, emotion, or curiosity. The director protects attention through semantic change, not constant motion.",chapters,beats:outBeats,referencePatterns:references,globalBudgets:{maxConsecutiveSameVisualKind:2,maxGenericBrollSeconds:8,maxDecorativeOnlyBeats:1,minimumEvidenceEvents:Math.max(12,Math.ceil(duration/60*1.5)),minimumMajorVisualResets:Math.max(8,Math.ceil(duration/90))},qc:{projectedRetention,visualChangeRatePerMinute,evidenceRatePerMinute,unresolvedQuestionCount:outBeats.filter(b=>b.nextQuestion).length,fatigueWindows,findings}};
mkdirSync(dirname(outPath),{recursive:true}); writeFileSync(outPath,JSON.stringify(plan,null,2));
console.log(`LONGFORM DIRECTOR  ${plan.project.title}`);
console.log(`duration ${duration.toFixed(1)}s · ${outBeats.length} beats · ${chapters.length} chapters`);
console.log(`semantic visual changes ${visualChangeRatePerMinute.toFixed(1)}/min · evidence ${evidenceRatePerMinute.toFixed(1)}/min`);
console.log(`projected comparator retention ${(projectedRetention*100).toFixed(1)}%`);
console.log(`findings ${findings.length} · fatigue windows ${fatigueWindows.length}`);
for(const f of findings.slice(0,10)) console.log(`${f.severity} @${f.at.toFixed(1)}s ${f.rule}: ${f.message}`);
console.log(`WROTE ${outPath}`);
