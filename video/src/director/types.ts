// The ShortPlan schema: everything the director decides about a Short, as
// data. Remotion never improvises — it renders this.
//
// This is the crime-doc DirectorPlan re-cut for the 9:16 feed. A long essay
// is judged on whether it holds a viewer who already chose to watch. A Short
// is judged on whether it survives a thumb that has not chosen anything yet,
// so the schema carries three things the essay plan has no use for:
//
//   frameZero   what is legible on the very first frame, and for how long
//   swipeRisk   a per-beat estimate of who leaves during that beat
//   loop        whether the last frame rhymes with the first
//
// Backwards compatibility is a hard rule: every field is optional and the
// renderer falls back to plain script.json behaviour when the plan (or a
// field in it) is absent. A script that predates the director renders exactly
// as it always did.
//
// Erasable-syntax-only file: no enums, no namespaces — Node's type stripping
// runs this directly (tools/direct.mjs) and Remotion bundles it.

// ---------------------------------------------------------------- script
/** The beat rows the director reads. A superset of what parse-script.mjs
 *  wrote before the director existed; every new row is optional and a
 *  hand-written row always beats a heuristic guess. */
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
  // Hand-written editorial rows. These are the difference between a
  // slideshow and an edit.
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

// ---------------------------------------------------------------- vocab
/** The arc of a Short. Shorter than an essay's, and every stage is load
 *  bearing — there is no room for a beat that only orients. */
export type NarrativePurpose =
  | "hook" //  the claim, on frame zero
  | "turn" //  the contradiction that makes the claim worth staying for
  | "explain" // the mechanism
  | "proof" //  the number that makes it checkable
  | "escalate" // it is worse / bigger than you thought
  | "reveal" // the thing the viewer came for
  | "payoff" // the arithmetic lands
  | "cta"; //  the ask, after the value, never before

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
  | "recognition" // "that's me" — the strongest share trigger in finance
  | "indignation"
  | "clarity"
  | "relief"
  | "satisfaction";

/** How a Short earns the next second of attention. */
export type AttentionStrategy =
  | "frame_zero" //  everything legible immediately, no build
  | "open_loop" //   a question is posed and deliberately not answered
  | "progressive" // the frame assembles as the line is spoken
  | "impact" //     one thing lands hard
  | "resolve"; //   the loop closes

/** Shorts rhythm tiers. An essay may hold a frame for thirty seconds. A
 *  Short may not: past ~6s with nothing new, the thumb moves. */
export type RhythmTier =
  | "FLASH" //      < 2s   a stamp, a cut, a number
  | "MICRO" //      2–4s   one idea, one frame
  | "IDEA" //       4–7s   an idea that assembles
  | "OVERLONG"; //  > 7s   allowed only with staged reveals inside it

export type CaptionMode = "NONE" | "EMPHASIS" | "SUBTITLE" | "FULL";

export type RevealMode =
  | "IMMEDIATE" //          the whole frame is present at t=0 of the beat
  | "SEQUENTIAL"
  | "PROGRESSIVE"
  | "MASK"
  | "DRAW_ON"
  | "COUNTER_REVEAL"
  | "HIDDEN_THEN_REVEAL";

export type CameraIntent =
  | "hold" //     no move — the frame is doing the work
  | "push"
  | "pull"
  | "punch" //    a hard scale hit on an impact frame
  | "settle";

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

export type TransitionReason =
  | "NEW_IDEA"
  | "CONTRADICTION"
  | "SAME_SUBJECT"
  | "IMPACT"
  | "LOOP_CLOSE";

export type SilenceKind = "MUSIC_DROP" | "PRE_REVEAL_SILENCE" | "POST_REVEAL_SILENCE";

/** How the hook works. Named so the QC can tell an author which lever they
 *  actually pulled, and so two Shorts in a row don't pull the same one. */
export type HookType =
  | "contradiction" //   "your paycheck isn't the problem"
  | "specificity" //     "$1,440 a year"
  | "negative_urgency" // "you are losing money right now"
  | "curiosity_gap" //   "there are two rates. your bank shows one."
  | "recognition" //     "you have four of these open right now"
  | "unknown";

// ---------------------------------------------------------------- plan
/** The first frame of the video, as data. This is the single highest-leverage
 *  object in the whole plan: a Short with a blank frame zero is dead before
 *  the narration says a word, no matter how good the rest of it is. */
export type FrameZero = {
  /** The complete hook, fully legible on frame 1. Never a fragment. */
  text: string;
  /** Where the text came from. `narration` means nobody wrote a frame-one
   *  line and the director fell back to the opening sentence — which keeps
   *  the render from being blank, but is not a hook and QC treats it as the
   *  failure it is. */
  source: "hook" | "text" | "narration";
  words: number;
  chars: number;
  /** Frames the complete hook is held before any animation runs under it. */
  holdFrames: number;
  /** Type size tier the renderer should use: the hook is the largest type in
   *  the video, always. */
  size: "max" | "large";
  /** True when the hook is short enough to be read in a glance (~0.4s). */
  glanceable: boolean;
  /** True when frame zero's text matches the opening spoken words. */
  audioSynced: boolean;
  hookType: HookType;
  /** Seconds until the complete claim has been made in the narration. */
  timeToClaim: number;
};

/** Per-beat swipe estimate. `risk` is the share of the beat's inherited
 *  audience that leaves during it; `retained` is what survives to its end. */
export type SwipeEstimate = {
  beat: number;
  at: number;
  risk: number; // 0..1
  retained: number; // 0..1, cumulative
  drivers: string[]; // why this beat leaks
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
  at: number; // seconds into the beat
  kind: "hold" | "accent" | "question" | "reveal";
  label?: string;
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
    /** 0..1 chance a viewer leaves during this beat. */
    swipeRisk: number;
    /** 0..1 share of the original audience still watching at its end. */
    retained: number;
  };
  visual: {
    purpose: VisualPurpose;
    module: string;
    reveal: RevealMode;
    captionMode: CaptionMode;
    /** Frames from the beat's start before anything animates. 0 = immediate. */
    holdFrames: number;
  };
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
  strength: number; // 0..1
  label?: string;
};

export type AudioEvent = {
  at: number;
  kind: "music_level" | "silence_start" | "silence_end" | "sfx";
  value?: number;
  label?: string;
};

/** The loop: what the hook opened, and whether the ending closes it. A Short
 *  that loops gets rewatched, and rewatch is the cheapest retention there is. */
export type LoopPlan = {
  /** The phrase or number the hook planted. */
  motif: string;
  openedAtBeat: number;
  closedAtBeat: number | null;
  /** True when the final beat restates the hook's motif. */
  closes: boolean;
  /** True when the last frame could cut to the first without a jolt. */
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
  /** Projected share of the audience reaching the end, 0..1. Internal
   *  heuristic — it ranks two cuts of the same script against each other, it
   *  does not predict YouTube. */
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

/** Hand-written notes that steer the heuristic director. A human note always
 *  wins over a guess. */
export type DirectorOverlay = {
  version?: string;
  project?: { title?: string };
  beats?: Record<number, Partial<ScriptBeat>>;
};

// ---------------------------------------------------------------- qc
export type QcSeverity = "FATAL" | "HIGH" | "MED" | "LOW";

export type QcFinding = {
  at: number; // seconds, or -1 for whole-video findings
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
  scores: {
    hook: number;
    pacing: number;
    curiosity: number;
    visualVariety: number;
    audio: number;
    loop: number;
  };
  /** Projected share reaching the end, as a percentage. */
  projectedRetention: number;
  /** 0..10 overall. Below 6 means do not render yet. */
  score: number;
};
