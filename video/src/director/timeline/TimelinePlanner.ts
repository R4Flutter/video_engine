// TimelinePlanner: deterministic assembly shared by Short + LongForm.
// LongForm is explicitly neutral on Shorts swipe retention.
import type { AttentionEvent, AudioEvent, CameraIntent, DirectedBeat, Emotion, FrameZero, LoopPlan, Script, Sequence, ShortPlan, SwipeEstimate } from "../types.ts";
import type { BeatFacts } from "../story/StoryAnalyzer.ts";
import type { RhythmDecision } from "../attention/RhythmEngine.ts";
import type { AttentionProfile } from "../attention/AttentionDirector.ts";
import type { VisualDecision } from "../visual/VisualDirector.ts";
import type { RevealDecision } from "../motion/RevealPlanner.ts";
import type { TransitionDecision } from "../motion/TransitionDirector.ts";
import type { BeatAudio } from "../audio/AudioDirector.ts";
import { round2 } from "../util.ts";

export type TimelineInputs = {
  script: Script; facts: BeatFacts[]; emotions: Emotion[]; rhythms: RhythmDecision[]; profiles: AttentionProfile[];
  novelty: number[]; visuals: VisualDecision[]; cameras: CameraIntent[]; reveals: RevealDecision[];
  transitions: TransitionDecision[]; audios: BeatAudio[]; swipe: SwipeEstimate[]; attentionEvents: AttentionEvent[];
  audioEvents: AudioEvent[]; sequences: Sequence[]; frameZero: FrameZero; loop: LoopPlan;
};

const emphasisWords = (text: string, vo: string): string[] => {
  const out = new Set<string>();
  for (const m of `${text} ${vo}`.matchAll(/[$₹€£]\s?\d[\d,]*(?:\.\d+)?%?|\b\d[\d,]*(?:\.\d+)?%/g)) out.add(m[0].trim());
  const neg = /\b(isn'?t|not|never|nothing|no one|nobody)\b/i.exec(text); if (neg) out.add(neg[0]);
  return [...out].slice(0, 3);
};

export const assembleTimeline = (i: TimelineInputs): ShortPlan => {
  const { script } = i; const beats = script.beats; const fps = script.fps || 30; const isLongForm = script.durationInSeconds >= 120;
  const directed: DirectedBeat[] = beats.map((b, idx) => {
    const audio = i.audios[idx]; const prev = beats[idx - 1];
    const maxLead = prev ? Math.max(0, b.start - prev.start - 0.5) : 0; const lead = Math.min(audio.jCut ?? 0, maxLead);
    const seq = i.sequences.find((s) => b.n >= s.beatRange[0] && b.n <= s.beatRange[1]);
    const swipe = i.swipe[idx] ?? { beat: b.n, at: b.start, risk: 0, retained: 1, drivers: [] };
    return {
      n:b.n,name:b.name,start:round2(b.start),end:round2(b.end),audioStart:round2(b.start-lead),jCut:lead>0?round2(lead):undefined,lCut:audio.lCut,
      narrative:{purpose:i.facts[idx].purpose,question:i.facts[idx].question,reveal:i.facts[idx].reveal},
      attention:{strategy:i.profiles[idx].strategy,novelty:i.novelty[idx],curiosity:i.profiles[idx].curiosity,tension:i.profiles[idx].tension,informationDensity:i.profiles[idx].informationDensity,emotionalIntensity:i.profiles[idx].emotionalIntensity,tier:i.rhythms[idx].tier,swipeRisk:isLongForm?0:swipe.risk,retained:isLongForm?1:swipe.retained},
      visual:{purpose:i.visuals[idx].purpose,module:i.visuals[idx].module,reveal:i.visuals[idx].reveal,captionMode:i.visuals[idx].captionMode,holdFrames:idx===0?i.frameZero.holdFrames:0},
      motion:{camera:{intent:i.cameras[idx]},reveal:i.reveals[idx],transitionIn:i.transitions[idx]},
      typography:{text:b.text??"",emphasisWords:emphasisWords(b.text??"",b.vo)},audio:{musicLevel:audio.musicLevel,musicMood:audio.musicMood,sfx:audio.sfx,silence:audio.silence},sequenceId:seq?.id??"seq_01"
    };
  });
  const swipeCurve = isLongForm ? [] : i.swipe;
  return {
    version:"short-1.0", project:{title:script.title,durationInSeconds:script.durationInSeconds,fps,width:script.width,height:script.height,engine:script.engine,mode:isLongForm?"LONGFORM_DOCUMENTARY":"SHORT"},
    frameZero:i.frameZero,loop:i.loop,sequences:i.sequences,beats:directed,swipeCurve,projectedRetention:isLongForm?0:(swipeCurve.length?swipeCurve[swipeCurve.length-1].retained:0),
    attentionEvents:i.attentionEvents,audioEvents:i.audioEvents,
    transitions:i.transitions.map((t,idx)=>({t,idx})).filter(({idx})=>idx>0).map(({t,idx})=>({fromBeat:beats[idx-1].n,toBeat:beats[idx].n,at:round2(beats[idx].start),type:t.type,reason:t.reason,frames:t.frames}))
  };
};
