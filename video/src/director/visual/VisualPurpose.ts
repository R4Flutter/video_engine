// VisualPurpose: every visual must have a job. A beat whose visual has no
// job should be deleted, not decorated — so the director classifies the job
// first and only then picks a module.
import type { VisualPurpose } from "../types.ts";

const PURPOSE_OF: [RegExp, VisualPurpose][] = [
  [/\b(isn'?t|not the|turns out|actually|except|instead|but)\b/i, "CONTRADICT"],
  [/\b(versus|vs\.?|against|compared|difference|gap|two rates|side by side)\b/i, "COMPARE"],
  [/\b(a year|total|adds up|multiplied|over ten years|compound)\b/i, "INTENSIFY"],
  [/\b(proof|receipt|statement|screenshot|source|document|check your)\b/i, "PROVE"],
  [/\b(reveal|hidden|nobody shows|the second|underneath|what they don'?t)\b/i, "REVEAL"],
  [/\b(how|mechanism|works|because|the reason|every time|each month)\b/i, "EXPLAIN"],
  [/\b(follow|comment|share|save this|open your|do this)\b/i, "CLOSE"],
];

export const visualPurposeFor = (b: { vo: string; visual: string; text?: string }): VisualPurpose => {
  const text = `${b.vo} ${b.visual} ${b.text ?? ""}`;
  return PURPOSE_OF.find(([re]) => re.test(text))?.[1] ?? "EXPLAIN";
};

/** Modules a purpose prefers, in order, before continuity interferes. Two
 *  vocabularies live here — the vox page and the finance stage — because the
 *  script chooses the engine and the director should not care which. */
export const MODULE_BY_PURPOSE: Record<VisualPurpose, { vox: string[]; finance: string[] }> = {
  CLAIM: { vox: ["kinetic", "stat"], finance: ["coinDrop", "jarFill"] },
  CONTRADICT: { vox: ["compare", "kinetic", "doodle"], finance: ["investChart", "coinStack"] },
  EXPLAIN: { vox: ["icon", "chart", "timeline"], finance: ["coinStack", "investChart"] },
  PROVE: { vox: ["stat", "quote", "callout"], finance: ["jarFill", "investChart"] },
  COMPARE: { vox: ["compare", "chart"], finance: ["investChart", "coinStack"] },
  INTENSIFY: { vox: ["stat", "chart", "compare"], finance: ["mountain", "payoff"] },
  REVEAL: { vox: ["stat", "doodle", "callout"], finance: ["payoff", "jarFill"] },
  CLOSE: { vox: ["kinetic", "quote"], finance: ["outro"] },
};
