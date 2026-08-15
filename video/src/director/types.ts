// The ShortPlan schema: everything the director decides about a Short, as data.
// Remotion never improvises — it renders this.
//
// This schema now carries a documentary-grade shot decision in addition to
// retention, visual, camera and audio intent. Every field remains optional at
// the script boundary; the director materializes a complete plan.

export type ScriptBeat = {
  n: number;
  name: string;
  start: number;
  end: number;
  vo: string;
  visual: string;
  motion?: string;
  module?: string;
  text?: string;
  shape?: string;
  source?: string;
  footage?: string;
  icons?: { icon: string; label: string }[];
  data?: { label: string; value: number; raw?: string }[];
  purpose?: string;
  question?: string;
  reveal?: string;
  emotion?: string;
  hook?: string;
  loop?: string;
  captionMode?: string;
  revealMode?: string;
  camera?: string;
  music?: string;
  silence?: string;
  sfx?: string;
  jcut?: number;
  lcut?: number;
  rest?: boolean | string;
};

export type Script = {
  source?: string;
  title: string;
  engine: string;
  fps: number;
  width: number;
  height: number;
  durationInSeconds: number;
  caption?: string;
  beats: ScriptBeat[];
  texts?: { at: number; text: string; anim: string }[];
  sfx?: { at: number; files: string[] }[];
};

export type NarrativePurpose =
  | "hook"
  | "turn"
  | "explain"
  | "proof"
  | "escalate"
  | "reveal"
  | "payoff"
  | "cta";

export type VisualPurpose =
  | "CLAIM"
  | "CONTRADICT"
  | "EXPLAIN"
  | "PROVE"
  | "COMPARE"
  | "INTENSIFY"
  | "REVEAL"
  | "CLOSE";

export type Emotion =
  | "curiosity"
  | "surprise"
  | "tension"
  | "recognition"
  | "indignation"
  | "clarity"
  | "relief"
  | "satisfaction";

export type AttentionStrategy =
  | "frame_zero"
  | "open_loop"
  | "progressive"
  | "impact"
  | "resolve";

export type RhythmTier = "FLASH" | "MICRO" | "IDEA" | "OVERLONG";
export type CaptionMode = "NONE" | "EMPHASIS" | "SUBTITLE" | "FULL";

export type RevealMode =
  | "IMMEDIATE"
  | "SEQUENTIAL"
  | "PROGRESSIVE"
  | "MASK"
  | "DRAW_ON"
  | "COUNTER_REVEAL"
  | "HIDDEN_THEN_REVEAL";

export type CameraIntent = "hold" | "push" | "pull" | "punch" | "settle";

export type AttentionEventType =
  | "TEXT_CHANGE"
  | "NUMBER_REVEAL"
  | "OBJECT_ENTRY"
  | "CAMERA_PUNCH"
  | "ANNOTATION_DRAW"
  | "QUESTION"
  | "REVEAL"
  | "CONTRADICTION"
  | "PAYOFF"
  | "PATTERN_INTERRUPT"
  | "SFX_ACCENT"
  | "SILENCE";

export type TransitionType = "cut" | "punch" | "page" | "hold";
export type TransitionReason = "NEW_IDEA" | "CONTRADICTION" | "SAME_SUBJECT" | "IMPACT" | "LOOP_CLOSE";
export type SilenceKind = "MUSIC_DROP" | "PRE_REVEAL_SILENCE" | "POST_REVEAL_SILENCE";

export type HookType =
  | "contradiction"
  | "specificity"
  | "negative_urgency"
  | "curiosity_gap"
  | "recognition"
  | "unknown";

export type FrameZero = {
  text: string;
  source: "hook" | "text" | "narration";
  words: number;
  chars: number;
  holdFrames: number;
  size: "max" | "large";
  glanceable: boolean;
  audioSynced: boolean;
  hookType: HookType;
  timeToClaim: number;
};

export type SwipeEstimate = {
  beat: number;
  at: number;
  risk: number;
  retained: number;
  drivers: string[];
};

export type Sequence = {
  id: string;
  purpose: NarrativePurpose;
  beatRange: [number, number];
  start: number;
  end: number;
  openQuestion?: string;
  answer?: string;
  emotion: Emotion;
};

export type RevealTrigger = {
  at: number;
  kind: "hold" | "accent" | "question" | "reveal";
  label?: string;
};

/**
 * Shot decision is deliberately primitive. It is a contract between the
 * editorial director and renderer, not an invitation to add a heavy engine.
 */
export type ShotDecision = {
  asset: "footage" | "archival_photo" | "document" | "chart" | "compare" | "editorial_graphic" | "typography";
  shot: "wide" | "medium" | "close" | "detail";
  composition: "center" | "left_focus" | "right_focus" | "split" | "full_bleed";
  entry: "cut" | "push_in" | "wipe" | "rise" | "fade";
  exit: "cut" | "hold" | "push_out" | "settle";
  cameraBias: "still" | "breathing" | "active" | "impact";
  visualJob: string;
  reason: string;
  cpuCost: "low" | "medium";
  maxCaptionWords: number;
};

export type DirectedBeat = {
  n: number;
  name: string;
  start: number;
  end: number;
  audioStart: number;
  jCut?: number;
  lCut?: number;
  narrative: {
    purpose: NarrativePurpose;
    question?: string;
    reveal?: string;
  };
  attention: {
    strategy: AttentionStrategy;
    novelty: number;
    curiosity: number;
    tension: number;
    informationDensity: number;
    emotionalIntensity: number;
    tier: RhythmTier;
    swipeRisk: number;
    retained: number;
  };
  visual: {
    purpose: VisualPurpose;
    module: string;
    reveal: RevealMode;
    captionMode: CaptionMode;
    holdFrames: number;
  };
  shot?: ShotDecision;
  motion: {
    camera: { intent: CameraIntent };
    reveal: { mode: RevealMode; holdUntil: number; triggers: RevealTrigger[] };
    transitionIn: { type: TransitionType; reason: TransitionReason; frames: number };
  };
  typography: { text: string; emphasisWords: string[] };
  audio: {
    musicLevel: number;
    musicMood: "hold" | "swell" | "drop" | "quiet";
    sfx: { at: number; files: string[] }[];
    silence: { at: number; dur: number; kind: SilenceKind }[];
  };
  sequenceId: string;
};

export type AttentionEvent = {
  at: number;
  type: AttentionEventType;
  beat: number;
  strength: number;
  label?: string;
};

export type AudioEvent = {
  at: number;
  kind: "music_level" | "silence_start" | "silence_end" | "sfx";
  value?: number;
  label?: string;
};

export type LoopPlan = {
  motif: string;
  openedAtBeat: number;
  closedAtBeat: number | null;
  closes: boolean;
  seamless: boolean;
};

export type ShortPlan = {
  version: "short-1.0";
  project: {
    title: string;
    durationInSeconds: number;
    fps: number;
    width: number;
    height: number;
    engine: string;
    mode: "SHORT";
  };
  frameZero: FrameZero;
  loop: LoopPlan;
  sequences: Sequence[];
  beats: DirectedBeat[];
  swipeCurve: SwipeEstimate[];
  projectedRetention: number;
  attentionEvents: AttentionEvent[];
  audioEvents: AudioEvent[];
  transitions: {
    fromBeat: number;
    toBeat: number;
    at: number;
    type: TransitionType;
    reason: TransitionReason;
    frames: number;
  }[];
};

export type DirectorOverlay = {
  version?: string;
  project?: { title?: string };
  beats?: Record<number, Partial<ScriptBeat>>;
};

export type QcSeverity = "FATAL" | "HIGH" | "MED" | "LOW";
export type QcFinding = {
  at: number;
  level: "warn" | "info" | "good";
  rule: string;
  message: string;
  beat?: number;
  severity?: QcSeverity;
  reason?: string;
  fix?: string;
};

export type QcReport = {
  video: { title: string; duration: number; beats: number };
  findings: QcFinding[];
  scores: { hook: number; pacing: number; curiosity: number; visualVariety: number; audio: number; loop: number };
  projectedRetention: number;
  score: number;
};
