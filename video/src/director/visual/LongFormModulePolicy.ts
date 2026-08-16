// Long-form finance visual policy.
// Based on the editorial patterns observed in successful business/finance
// documentary channels: real evidence, cinematic footage, restrained data,
// explicit comparisons, timelines, and occasional authored payoff frames.
// Never substitute decorative money animations for missing source material.

export const LONGFORM_ALLOWED_MODULES = new Set([
  "footage", "evidence", "archive", "stat", "compare", "chart",
  "investChart", "timeline", "icon", "quote", "callout", "payoff", "outro",
]);

export const LONGFORM_FALLBACK_BY_PURPOSE: Record<string, string> = {
  CLAIM: "evidence",
  CONTRADICT: "compare",
  EXPLAIN: "footage",
  PROVE: "evidence",
  COMPARE: "compare",
  INTENSIFY: "footage",
  REVEAL: "evidence",
  CLOSE: "payoff",
};

export const isLongForm = (durationSeconds: number) => durationSeconds >= 120;

export const normalizeLongFormModule = (module: string | undefined, purpose: string, hasMedia: boolean) => {
  if (module && LONGFORM_ALLOWED_MODULES.has(module)) return module;
  if (hasMedia && (purpose === "EXPLAIN" || purpose === "INTENSIFY")) return "footage";
  return LONGFORM_FALLBACK_BY_PURPOSE[purpose] ?? "evidence";
};
