// Deterministic director front door for both Short and LongForm.
// LongForm shares the proven story/visual/audio planners but never uses the
// Shorts swipe model as its retention signal or output artifact.
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
    beats: script.beats.map((b) => overlay.beats?.[b.n] ? { ...b, ...overlay.beats?.[b.n] } : b),
  };
};

export const buildLongFormPlan = (rawScript: Script, overlay?: DirectorOverlay): DirectResult => {
  const script = mergeOverlay(rawScript, overlay);
  const beats = script.beats; const fps = script.fps || 30; const warnings: string[] = [];
  const isLongForm = script.durationInSeconds >= 120;

  const frameZero = planFrameZero(script);
  const holdSeconds = frameZero.holdFrames / fps;
  // Long-form cold opens are intentionally not frame-zero-title hooks. The
  // renderer owns the visual-first hold/evidence ladder/late claim contract.
  if (!isLongForm) {
    if (!frameZero.text) warnings.push("beat 1 has no on-screen hook — frame one will be blank");
    if (!frameZero.audioSynced) warnings.push("beat 1's on-screen hook does not match its narration");
  }

  const facts = analyzeStory(script); const emotions = buildEmotionalCurve(script); const sequences = planSequences(script, facts, emotions);
  const curiosity = runCuriosity(script, facts);
  if (!isLongForm && curiosity.longestFlatRun && curiosity.longestFlatRun.seconds >= 5) warnings.push(`${curiosity.longestFlatRun.seconds}s with nothing unresolved (beats ${curiosity.longestFlatRun.from}–${curiosity.longestFlatRun.to})`);

  const rhythms = beats.map((b) => rhythmFor(b));
  const profiles = beats.map((b, i) => profileFor(b, facts[i], emotions[i], rhythms[i], i === 0));
  const attentionEvents = scheduleAllEvents(script, facts, emotions, rhythms, isLongForm ? 3.5 : holdSeconds);

  const { decisions: visuals, novelty, warnings: visualWarnings } = directVisuals(script, facts, isLongForm ? 0 : frameZero.holdFrames);
  warnings.push(...visualWarnings);

  const rawCameras = beats.map((b, i) => cameraFor(b, facts[i], visuals[i], emotions[i], i === 0));
  const budgeted = beats.map((b, i) => {
    const { camera, captionMode, trimmed } = budgetFor(b, visuals[i].module, rawCameras[i], visuals[i].captionMode);
    if (trimmed) {
      const changes: string[] = [];
      if (camera !== rawCameras[i]) changes.push(`camera ${rawCameras[i]}→${camera}`);
      if (captionMode !== visuals[i].captionMode) changes.push(`captions ${visuals[i].captionMode}→${captionMode}`);
      warnings.push(`beat ${b.n}: over the motion budget — ${changes.join(", ")}`);
    }
    return { camera: camera as CameraIntent, captionMode };
  });
  const cameras = budgeted.map((x) => x.camera);
  const trimmedVisuals = visuals.map((v, i) => ({ ...v, captionMode: budgeted[i].captionMode }));

  const reveals = beats.map((b, i) => revealFor(b, facts[i], trimmedVisuals[i].reveal, profiles[i].strategy, i === 0 && !isLongForm, isLongForm ? 3.5 : holdSeconds));
  const transitions = beats.map((b, i) => transitionInto(b, beats[i - 1], facts[i], emotions[i], i > 0 && trimmedVisuals[i].module === trimmedVisuals[i - 1].module, i === beats.length - 1));

  const audios = beats.map((b, i) => audioFor(b, facts[i], emotions[i], attentionEvents));
  const audioEvents = [...planMusic(beats, facts, emotions), ...planSilence(beats, facts), ...planSfx(beats, attentionEvents)].sort((a, z) => a.at - z.at);

  // Preserve the legacy estimator only while constructing the shared object;
  // TimelinePlanner strips it from the long-form artifact.
  const swipe = isLongForm ? [] : estimateSwipe({ beats, facts, profiles, modules: trimmedVisuals.map((v) => v.module), frameZero, events: attentionEvents, openLoop: curiosity.openLoop });

  const plan = assembleTimeline({ script, facts, emotions, rhythms, profiles, novelty, visuals: trimmedVisuals, cameras, reveals, transitions, audios, swipe, attentionEvents, audioEvents, sequences, frameZero, loop: planLoop(beats) });
  const issues = validateTimeline(plan); for (const issue of issues) warnings.push(`timeline: ${issue.message}`);
  const qc = runRetentionQC(plan, curiosity, beats[0]?.vo ?? "");
  return { plan, warnings, issues, qc, curiosity };
};
