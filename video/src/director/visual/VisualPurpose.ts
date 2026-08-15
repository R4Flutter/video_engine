// Every visual has a job. Finance now prefers supplied documentary assets,
// evidence and editorial graphics over generic animated props.
import type { VisualPurpose } from "../types.ts";

const PURPOSE_OF: [RegExp, VisualPurpose][] = [
  [/\b(isn'?t|not the|turns out|actually|except|instead|but)\b/i, "CONTRADICT"],
  [/\b(versus|vs\.?|against|compared|difference|gap|two rates|side by side)\b/i, "COMPARE"],
  [/\b(a year|total|adds up|multiplied|over ten years|compound|scale)\b/i, "INTENSIFY"],
  [/\b(proof|receipt|statement|screenshot|source|document|check your|filing|report)\b/i, "PROVE"],
  [/\b(reveal|hidden|nobody shows|the second|underneath|what they don'?t)\b/i, "REVEAL"],
  [/\b(how|mechanism|works|because|the reason|every time|each month|process)\b/i, "EXPLAIN"],
  [/\b(follow|comment|share|save this|open your|do this)\b/i, "CLOSE"],
];

export const visualPurposeFor = (b: { vo: string; visual: string; text?: string }): VisualPurpose => {
  const text = `${b.vo} ${b.visual} ${b.text ?? ""}`;
  return PURPOSE_OF.find(([re]) => re.test(text))?.[1] ?? "EXPLAIN";
};

export const MODULE_BY_PURPOSE: Record<VisualPurpose, { vox: string[]; finance: string[] }> = {
  CLAIM: { vox: ["kinetic", "stat"], finance: ["statFinance", "archive", "subject_cutout"] },
  CONTRADICT: { vox: ["compare", "doodle", "kinetic"], finance: ["compareFinance", "archive", "statFinance"] },
  EXPLAIN: { vox: ["icon", "chart", "timeline"], finance: ["editorialGraphic", "archive", "investChart"] },
  PROVE: { vox: ["stat", "quote", "callout"], finance: ["documentFinance", "archive", "statFinance"] },
  COMPARE: { vox: ["compare", "chart"], finance: ["compareFinance", "investChart", "documentFinance"] },
  INTENSIFY: { vox: ["stat", "chart", "compare"], finance: ["statFinance", "investChart", "mountain"] },
  REVEAL: { vox: ["stat", "doodle", "callout"], finance: ["archive", "documentFinance", "payoff"] },
  CLOSE: { vox: ["kinetic", "quote"], finance: ["outro", "payoff"] },
};
