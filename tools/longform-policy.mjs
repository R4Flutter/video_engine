export const LONGFORM_MODE = "LONGFORM_DOCUMENTARY";

export const LONGFORM_POLICY = Object.freeze({
  mode: LONGFORM_MODE,
  minDurationSeconds: 120,
  maxDurationSeconds: 3600,
  width: 1920,
  height: 1080,
  fps: 30,
  engine: new Set(["finance", "documentary"]),
  forbiddenDirectorImports: [
    "buildShortPlan",
    "estimateSwipe",
    "planFrameZero",
    "runRetentionQC",
    "FinanceShort",
    "ShortsSwipeRisk",
    "ShortLoopPlanner",
    "ShortFrameZero",
    "ShortsDerivedPlan",
    "ShortRender",
    "ShortsQC",
  ],
});

export function assertLongformScript(script) {
  if (!script || typeof script !== "object") throw new Error("LongFormPolicy: missing script object");
  if (script.engine !== "finance" && script.engine !== "documentary") {
    throw new Error(`LongFormPolicy: unsupported engine \"${script.engine ?? "missing"}\"`);
  }
  const duration = Number(script.durationInSeconds ?? 0);
  if (duration < LONGFORM_POLICY.minDurationSeconds) {
    throw new Error(`LongFormPolicy: finance/documentary episode must be >= ${LONGFORM_POLICY.minDurationSeconds}s, got ${duration}s`);
  }
  if (duration > LONGFORM_POLICY.maxDurationSeconds) {
    throw new Error(`LongFormPolicy: duration exceeds ${LONGFORM_POLICY.maxDurationSeconds}s ceiling`);
  }
  if (Number(script.width) !== LONGFORM_POLICY.width || Number(script.height) !== LONGFORM_POLICY.height) {
    throw new Error(`LongFormPolicy: expected 1920x1080, got ${script.width}x${script.height}`);
  }
  if (Number(script.fps) !== LONGFORM_POLICY.fps) {
    throw new Error(`LongFormPolicy: expected ${LONGFORM_POLICY.fps}fps, got ${script.fps}`);
  }
}
