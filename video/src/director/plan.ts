// plan.ts: deterministic editorial director. Script in, complete ShortPlan out.
import type { CameraIntent, DirectorOverlay, Script, ShortPlan } from "./types.ts";
import { analyzeStory } from "./story/StoryAnalyzer.ts";
import { planSequences } from "./story/SequencePlanner.ts";
import { planFrameZero } from "./attention/HookEngine.ts";
import { runCuriosity, type CuriosityState } from "./attention/CuriosityEngine.ts";
import { rhythmFor, scheduleAllEvents } from "./attention/RhythmEngine.ts";
import { buildEmotionalCurve } from "./attention/EmotionalCurve.ts";
import { profileFor } from "./attention/AttentionDirector.ts";
import { budgetFor } from "./attention/NoveltyBudget.ts";
import { estimateSwipe } from "./attention/SwipeRisk.ts";
import { directVisuals } from "./visual/VisualDirector.ts";
import { shotForBeat } from "./visual/ShotPlanner.ts";
import { cameraFor } from "./motion/CameraPlanner.ts";
import { revealFor } from "./motion/RevealPlanner.ts";
import { transitionInto } from "./motion/TransitionDirector.ts";
import { audioFor } from "./audio/AudioDirector.ts";
import { planMusic } from "./audio/MusicPlanner.ts";
import { planSilence } from "./audio/SilencePlanner.ts";
import { planSfx } from "./audio/SFXPlanner.ts";
import { planLoop } from "./memory/LoopPlanner.ts";
import { assembleTimeline } from "./timeline/TimelinePlanner.ts";
import { validateTimeline } from "./timeline/TimelineValidator.ts";
import { runRetentionQC } from "./qc/RetentionQC.ts";

export type DirectResult = {
  plan: ShortPlan;
  warnings: string[];
  issues: ReturnType<typeof validateTimeline>;
  qc: ReturnType<typeof runRetentionQC>;
  curiosity: CuriosityState;
};

const mergeOverlay = (script: Script, overlay: DirectorOverlay | undefined): Script => {
  if (!overlay) return script;
  return {
    ...script,
    title: overlay.project?.title ?? script.title,
    beats: script.beats.map((b) => {
      const note = overlay.beats?.[b.n];
      return note ? { ...b, ...note } : b;
    }),
  };
};

export const buildShortPlan = (rawScript: Script, overlay?: DirectorOverlay): DirectResult => {
  const script = mergeOverlay(rawScript, overlay);
  const beats = script.beats;
  const fps = script.fps || 30;
  const warnings: string[] = [];

  const frameZero = planFrameZero(script);
  const holdSeconds = frameZero.holdFrames / fps;
  if (!frameZero.text) warnings.push("beat 1 has no on-screen hook — frame one will be blank");
  if (!frameZero.audioSynced) warnings.push("beat 1's on-screen hook does not match its narration");

  const facts = analyzeStory(script);
  const emotions = buildEmotionalCurve(script);
  const sequences = planSequences(script, facts, emotions);

  const curiosity = runCuriosity(script, facts);
  if (curiosity.longestFlatRun && curiosity.longestFlatRun.seconds >= 5) {
    warnings.push(`${curiosity.longestFlatRun.seconds}s with nothing unresolved (beats ${curiosity.longestFlatRun.from}–${curiosity.longestFlatRun.to})`);
  }

  const rhythms = beats.map((b) => rhythmFor(b));
  const profiles = beats.map((b, i) => profileFor(b, facts[i], emotions[i], rhythms[i], i === 0));
  const attentionEvents = scheduleAllEvents(script, facts, emotions, rhythms, holdSeconds);

  const { decisions: visuals, novelty, warnings: visualWarnings } = directVisuals(script, facts, frameZero.holdFrames);
  warnings.push(...visualWarnings);

  // Choose the visual subject and shot before applying camera motion. This is
  // the key documentary rule: motion serves a shot, never the other way around.
  const shots = beats.map((b, i) => shotForBeat(b, facts[i], visuals[i], i));

  const rawCameras = beats.map((b, i) => {
    const base = cameraFor(b, facts[i], visuals[i], emotions[i], i === 0);
    if (i === 0) return base;
    if (shots[i].cameraBias === "still") return "hold" as CameraIntent;
    if (shots[i].cameraBias === "impact") return "punch" as CameraIntent;
    return base;
  });

  const budgeted = beats.map((b, i) => {
    const { camera, captionMode, trimmed } = budgetFor(b, visuals[i].module, rawCameras[i], visuals[i].captionMode);
    if (trimmed) {
      const changes = [];
      if (camera !== rawCameras[i]) changes.push(`camera ${rawCameras[i]}→${camera}`);
      if (captionMode !== visuals[i].captionMode) changes.push(`captions ${visuals[i].captionMode}→${captionMode}`);
      warnings.push(`beat ${b.n}: over the motion budget — ${changes.join(", ")}`);
    }
    return { camera: camera as CameraIntent, captionMode };
  });
  const cameras = budgeted.map((x) => x.camera);
  const trimmedVisuals = visuals.map((v, i) => ({ ...v, captionMode: budgeted[i].captionMode }));

  const reveals = beats.map((b, i) => revealFor(b, facts[i], trimmedVisuals[i].reveal, profiles[i].strategy, i === 0, holdSeconds));
  const transitions = beats.map((b, i) => transitionInto(
    b,
    beats[i - 1],
    facts[i],
    emotions[i],
    i > 0 && trimmedVisuals[i].module === trimmedVisuals[i - 1].module,
    i === beats.length - 1,
  ));

  const audios = beats.map((b, i) => audioFor(b, facts[i], emotions[i], attentionEvents));
  const audioEvents = [
    ...planMusic(beats, facts, emotions),
    ...planSilence(beats, facts),
    ...planSfx(beats, attentionEvents),
  ].sort((a, z) => a.at - z.at);

  const swipe = estimateSwipe({
    beats,
    facts,
    profiles,
    modules: trimmedVisuals.map((v) => v.module),
    frameZero,
    events: attentionEvents,
    openLoop: curiosity.openLoop,
  });

  const loop = planLoop(beats);
  const plan = assembleTimeline({
    script,
    facts,
    emotions,
    rhythms,
    profiles,
    novelty,
    visuals: trimmedVisuals,
    shots,
    cameras,
    reveals,
    transitions,
    audios,
    swipe,
    attentionEvents,
    audioEvents,
    sequences,
    frameZero,
    loop,
  });

  const issues = validateTimeline(plan);
  for (const issue of issues) warnings.push(`timeline: ${issue.message}`);
  const qc = runRetentionQC(plan, curiosity, beats[0]?.vo ?? "");
  return { plan, warnings, issues, qc, curiosity };
};
