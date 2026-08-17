// search.mjs — the editorial beam. Phase 1 of the closed loop:
//
//   corpus → learn patterns → generate many edits → simulate → select → render
//
// buildPlan is deterministic given (script, seed, dials), so the beam is
// reproducible: N editorial variants of the SAME canonical narration, each
// scored by the full 13-dimension gate + yt_engine retention model, gate-
// filtered, argmax-selected. The baseline variant (no dials) is always in the
// beam, so the beam can never ship worse than today's deterministic plan.
//
//   node tools/engine/search.mjs [--variants 32] [--seed 20260817]
//                               [--script video/src/script.json] [--out ...]
//
// Writes the winner to --out (then longform-autofix repairs it, exactly as the
// single-plan path did) and the full audit to video/out/plan-variants.json.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { buildPlan } from "../longform-director.mjs";
import { gateFailures } from "../longform-gates.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const arg = (name, fallback = null) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : fallback; };
const scriptPath = resolve(ROOT, arg("script", "video/src/script.json"));
const outPath = resolve(ROOT, arg("out", "video/src/director-plan.json"));
const referencePath = resolve(ROOT, "yt_engine/reference-patterns.json");
const previousPlanPath = resolve(ROOT, "video/src/director-plan.json");
const N = Math.max(1, Number(arg("variants", "32")) || 32);
const SEED = Number(arg("seed", "20260817")) || 20260817;

// ------------------------------------------------------------------ dials
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
export function dialsFor(index, rng) {
  if (index === 0) return { tag: "baseline" };
  const stagingPattern = pick(rng, ["spread", "front", "back", "even"]);
  const cameraBias = pick(rng, [null, "push", "settle", "punch", "hold"]);
  const revealShift = pick(rng, [0, 0, 0.4, 0.8]);
  const contrastPolicy = pick(rng, ["payoff", "chapters"]);
  const jcutAdd = pick(rng, [0, 0, 1, 2]);
  return {
    tag: `v${index}-${stagingPattern}-${cameraBias || "keep"}-r${revealShift}-${contrastPolicy}-j${jcutAdd}`,
    stagingPattern, cameraBias, revealShift, contrastPolicy, jcutAdd,
  };
}

// ---------------------------------------------------------------- search
export const searchPlan = (script, { variants = N, seed = SEED } = {}) => {
  const rng = (() => { let a = seed | 0; a = (a + 0x6D2B79F5) | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
  const evaluated = [];
  for (let i = 0; i < variants; i++) {
    const dials = dialsFor(i, rng);
    const plan = buildPlan(script, { previousPlanPath, references: referencePath, seed: seed + i * 7919, dials });
    const failures = gateFailures(plan.qc.scores, plan.qc.metrics);
    evaluated.push({
      index: i,
      tag: dials.tag,
      dials,
      score: plan.qc.score,
      overall: plan.qc.score,
      retentionResidual: plan.qc.metrics.retentionResidual,
      visualRate: plan.qc.metrics.visualChangesPerMinute,
      evidenceRate: plan.qc.metrics.evidenceEventsPerMinute,
      jlCuts: plan.qc.metrics.jlCuts,
      passed: failures.length === 0,
      failures: failures.map(f => `${f.severity}:${f.rule}`),
    });
  }
  const passed = evaluated.filter(e => e.passed);
  const rank = (a, b) => b.overall - a.overall || (b.retentionResidual ?? -1) - (a.retentionResidual ?? -1) || b.visualRate - a.visualRate || b.evidenceRate - a.evidenceRate || a.index - b.index;
  const pool = passed.length ? passed : evaluated;
  pool.sort(rank);
  const winner = pool[0];
  const baseline = evaluated.find(e => e.tag === "baseline");
  const plan = buildPlan(script, { previousPlanPath, references: referencePath, seed: seed + winner.index * 7919, dials: winner.dials });
  return { winner, baseline, evaluated, plan, passedCount: passed.length };
};

// -------------------------------------------------------------------- CLI
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const script = JSON.parse(readFileSync(scriptPath, "utf8"));
  const t0 = Date.now();
  const { winner, baseline, evaluated, plan, passedCount } = searchPlan(script);
  const delta = baseline ? Number((winner.overall - baseline.overall).toFixed(2)) : 0;

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(plan, null, 2), "utf8");
  const audit = {
    generated: new Date().toISOString(), variants: N, seed: SEED,
    passedCount, baseline: baseline ? { tag: baseline.tag, overall: baseline.overall } : null,
    winner: { tag: winner.tag, overall: winner.overall, residual: winner.retentionResidual, dials: winner.dials },
    deltaVsBaseline: delta,
    ranked: evaluated.sort((a, b) => (b.overall - a.overall) || (b.retentionResidual ?? -1) - (a.retentionResidual ?? -1) || a.index - b.index),
  };
  const auditPath = resolve(ROOT, "video/out/plan-variants.json");
  mkdirSync(dirname(auditPath), { recursive: true });
  writeFileSync(auditPath, JSON.stringify(audit, null, 2), "utf8");

  const top = evaluated.sort((a, b) => b.overall - a.overall || a.index - b.index).slice(0, 3);
  console.log(`BEAM SEARCH  ${N} variants · seed ${SEED} · ${Date.now() - t0}ms`);
  console.log(`GATE        ${passedCount}/${N} variants pass the production gate`);
  console.log(`WINNER      ${winner.tag} · ${winner.overall}/10 · Δ${delta >= 0 ? "+" : ""}${delta} vs baseline`);
  for (const t of top) console.log(`  top  ${t.overall}/10  ${t.tag}  residual ${t.retentionResidual ?? "n/a"}σ  ${t.passed ? "PASS" : t.failures.join(", ")}`);
  console.log(`WROTE       ${outPath}`);
  console.log(`AUDIT       ${auditPath}`);
}