// VisualContinuity: fatigue detection and restaging.
//
// Two jobs. (1) No module may run twice in a row in a Short — the essay
// engine allows two and swaps on the third, but thirty seconds does not have
// room for a repeat, and the swipe model charges a real penalty for one.
// (2) A fatigued beat is restaged with a module that serves the same purpose
// in a different visual language, rather than merely being flagged.
import type { Script, ScriptBeat, VisualPurpose } from "../types.ts";
import { MODULE_BY_PURPOSE } from "./VisualPurpose.ts";

export const VOX_MODULES = new Set([
  "kinetic", "doodle", "icon", "chart", "compare", "stat", "footage", "callout", "timeline", "quote",
]);

export const FINANCE_MODULES = new Set([
  "coinDrop", "coinStack", "investChart", "jarFill", "mountain", "payoff", "outro",
]);

export const knownModule = (m: string) => VOX_MODULES.has(m) || FINANCE_MODULES.has(m);

/** Runs of the same module — the raw material fatigue detection reads. */
export const moduleRuns = (beats: { n: number; module?: string }[]) => {
  const runs: { module: string; beats: number[] }[] = [];
  for (const b of beats) {
    const module = b.module ?? "";
    const last = runs[runs.length - 1];
    if (last && last.module === module) last.beats.push(b.n);
    else runs.push({ module, beats: [b.n] });
  }
  return runs;
};

const counts = (beats: ScriptBeat[]) => {
  const out: Record<string, number> = {};
  for (const b of beats) out[b.module ?? ""] = (out[b.module ?? ""] ?? 0) + 1;
  return out;
};

/** An alternative with the same purpose and a different visual language.
 *  Picks the least-used candidate — the one that freshens the cut most. */
const swapFor = (
  module: string,
  purpose: VisualPurpose,
  engine: "vox" | "finance",
  used: Record<string, number>,
): string => {
  const preferred = MODULE_BY_PURPOSE[purpose][engine] ?? [];
  const pool = preferred.filter((m) => m !== module);
  if (!pool.length) return module;
  return pool.sort((a, b) => (used[a] ?? 0) - (used[b] ?? 0))[0];
};

/**
 * The continuity pass. Returns restaged beats plus a novelty score per beat:
 * 1.0 for a module the video has not used yet, falling as it repeats. The
 * swipe model reads that score.
 */
export const enforceVariety = (
  script: Script,
  purposeOf: (b: ScriptBeat) => VisualPurpose,
): { beats: ScriptBeat[]; novelty: number[]; warnings: string[] } => {
  const engine: "vox" | "finance" = script.engine === "vox" ? "vox" : "finance";
  const beats = script.beats.map((b) => ({ ...b }));
  const warnings: string[] = [];
  const used = counts(beats);

  for (let i = 1; i < beats.length; i++) {
    const cur = beats[i].module ?? "";
    const prev = beats[i - 1].module ?? "";
    // The outro/cta beat is allowed to be whatever it is — it is the last
    // frame and restaging it breaks the loop.
    if (cur !== prev || i === beats.length - 1) continue;
    const next = swapFor(cur, purposeOf(beats[i]), engine, used);
    if (next !== cur) {
      beats[i] = { ...beats[i], module: next };
      used[cur] -= 1;
      used[next] = (used[next] ?? 0) + 1;
      warnings.push(`beat ${beats[i].n}: "${cur}" repeated back to back — restaged as "${next}"`);
    }
  }

  // Novelty: first appearance is 1.0, each repeat costs.
  const seen: Record<string, number> = {};
  const novelty = beats.map((b) => {
    const m = b.module ?? "";
    seen[m] = (seen[m] ?? 0) + 1;
    return Number(Math.max(0.25, 1 - (seen[m] - 1) * 0.3).toFixed(2));
  });

  const total = Math.max(1, beats.length);
  for (const [module, n] of Object.entries(counts(beats))) {
    if (n / total > 0.4) {
      warnings.push(`"${module}" carries ${Math.round((n / total) * 100)}% of the cut`);
    }
  }

  return { beats, novelty, warnings };
};
