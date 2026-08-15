// The director's public surface. tools/direct.mjs imports buildShortPlan
// through Node's type stripping; Remotion imports the types; tests import the
// modules. One source of truth for the whole editorial layer.
export * from "./types.ts";
export * from "./util.ts";
export { analyzeStory, analyzeBeat } from "./story/StoryAnalyzer.ts";
export { planSequences, sequenceOfBeat } from "./story/SequencePlanner.ts";
export { planFrameZero, hookTypeOf, timeToClaim, DEAD_OPENERS } from "./attention/HookEngine.ts";
export { runCuriosity } from "./attention/CuriosityEngine.ts";
export { estimateSwipe, projectedRetention } from "./attention/SwipeRisk.ts";
export { rhythmFor, scheduleAllEvents, scheduleBeatEvents } from "./attention/RhythmEngine.ts";
export { buildEmotionalCurve, emotionFor } from "./attention/EmotionalCurve.ts";
export { profileFor } from "./attention/AttentionDirector.ts";
export { budgetFor, MODULE_MOTION, CAMERA_MOTION, CAPTION_MOTION } from "./attention/NoveltyBudget.ts";
export { visualPurposeFor, MODULE_BY_PURPOSE } from "./visual/VisualPurpose.ts";
export { visualFor, directVisuals, NATIVE_REVEAL, CAPTION_BY_MODULE } from "./visual/VisualDirector.ts";
export { enforceVariety, moduleRuns, knownModule } from "./visual/VisualContinuity.ts";
export { cameraFor } from "./motion/CameraPlanner.ts";
export { revealFor } from "./motion/RevealPlanner.ts";
export { transitionInto } from "./motion/TransitionDirector.ts";
export { musicMoodFor, planMusic, levelOf } from "./audio/MusicPlanner.ts";
export { silenceFor, planSilence } from "./audio/SilencePlanner.ts";
export { sfxFor, planSfx, SFX_PACK } from "./audio/SFXPlanner.ts";
export { audioFor, cutsFor } from "./audio/AudioDirector.ts";
export { planLoop, motifOf } from "./memory/LoopPlanner.ts";
export { assembleTimeline } from "./timeline/TimelinePlanner.ts";
export { validateTimeline } from "./timeline/TimelineValidator.ts";
export { runHookQC } from "./qc/HookQC.ts";
export { runPacingQC } from "./qc/PacingQC.ts";
export { runCuriosityQC } from "./qc/CuriosityQC.ts";
export { runVisualQC } from "./qc/VisualQC.ts";
export { runAudioQC } from "./qc/AudioQC.ts";
export { runLoopQC } from "./qc/LoopQC.ts";
export { runRetentionQC, blockers } from "./qc/RetentionQC.ts";
export { buildShortPlan, type DirectResult } from "./plan.ts";
