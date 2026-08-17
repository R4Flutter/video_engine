// plan.ts: deterministic director front door.
//
// The same script must always produce the same plan. LONGFORM_19M uses the
// same data contract as legacy Shorts so Remotion remains backwards compatible,
// but it changes the assumptions used by attention, camera and retention.
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
    beats: script.beats.map((b) => {
      const note = overlay.beats?.[b.n];
      return note ? { ...b, ...note } : b;
    }),
  };
};

const isLongFormEpisode = (script: Script): boolean =>
  script.width >= script.height &&
  script.durationInSeconds >= 600 &&
  script.beats.length >= 15;

export const buildShortPlan = (
  rawScript: Script,
  overlay?: DirectorOverlay,
): DirectResult => {
  const script = mergeOverlay(rawScript, overlay);
  const longForm = isLongFormEpisode(script);
  const beats = script.beats;
  const fps = script.fps || 30;
  const warnings: string[] = [];

  // Frame zero is still required for long-form, but only as an immediate
  // title/promise check. The old Shorts rule that nothing may move for the
  // opening half-second is intentionally not propagated to the whole film.
  const frameZero = planFrameZero(script);
  const holdSeconds = frameZero.holdFrames / fps;
  if (!frameZero.text) warnings.push("beat 1 has no opening promise");
  if (longForm && frameZero.timeToClaim > 8) {
    warnings.push(`long-form opening claim arrives late at ${frameZero.timeToClaim.toFixed(1)}s`);
  } else if (!longForm && !frameZero.audioSynced) {
    warnings.push("beat 1's on-screen hook does not match its narration");
  }

  const facts = analyzeStory(script);
  const emotions = buildEmotionalCurve(script);
  const sequences = planSequences(script, facts, emotions);

  const curiosity = runCuriosity(script, facts);
  if (curiosity.longestFlatRun && curiosity.longestFlatRun.seconds >= (longForm ? 14 : 5)) {
    warnings.push(
      `${curiosity.longestFlatRun.seconds}s with nothing unresolved (beats ${curiosity.longestFlatRun.from}–${curiosity.longestFlatRun.to})`,
    );
  }

  const rhythms = beats.map((b) => rhythmFor(b));
  const profiles = beats.map((b, i) =>
    profileFor(b, facts[i], emotions[i], rhythms[i], i === 0),
  );
  const attentionEvents = scheduleAllEvents(script, facts, emotions, rhythms, holdSeconds);

  const {
    decisions: visuals,
    novelty,
    warnings: visualWarnings,
  } = directVisuals(script, facts, frameZero.holdFrames);
  warnings.push(...visualWarnings);

  const rawCameras = beats.map((b, i) => {
    const previous = i > 0 ? cameraFor(
      beats[i - 1],
      facts[i - 1],
      visuals[i - 1],
      emotions[i - 1],
      i - 1 === 0,
      longForm,
    ) : undefined;
    return cameraFor(b, facts[i], visuals[i], emotions[i], i === 0, longForm, previous);
  });

  const budgeted = beats.map((b, i) => {
    const { camera, captionMode, trimmed } = budgetFor(
      b,
      visuals[i].module,
      rawCameras[i],
      visuals[i].captionMode,
    );
    if (trimmed) {
      const changes: string[] = [];
      if (camera !== rawCameras[i]) changes.push(`camera ${rawCameras[i]}→${camera}`);
      if (captionMode !== visuals[i].captionMode) {
        changes.push(`captions ${visuals[i].captionMode}→${captionMode}`);
      }
      if (changes.length) warnings.push(`beat ${b.n}: over motion budget — ${changes.join(", ")}`);
    }
    return { camera: camera as CameraIntent, captionMode };
  });
  const cameras = budgeted.map((x) => x.camera);
  const trimmedVisuals = visuals.map((v, i) => ({ ...v, captionMode: budgeted[i].captionMode }));

  const reveals = beats.map((b, i) =>
    revealFor(b, facts[i], trimmedVisuals[i].reveal, profiles[i].strategy, i === 0, holdSeconds),
  );
  const transitions = beats.map((b, i) =>
    transitionInto(
      b,
      beats[i - 1],
      facts[i],
      emotions[i],
      i > 0 && trimmedVisuals[i].module === trimmedVisuals[i - 1].module,
      i === beats.length - 1,
    ),
  );

  const audios = beats.map((b, i) => audioFor(b, facts[i], emotions[i], attentionEvents));
  const audioEvents = [
    ...planMusic(beats, facts, emotions),
    ...planSilence(beats, facts),
    ...planSfx(beats, attentionEvents),
  ].sort((a, z) => a.at - z.at);

  // Keep the legacy swipe curve for comparison, but long-form QC treats it as
  // a diagnostic only. It must never force rapid cuts or CTA behavior.
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