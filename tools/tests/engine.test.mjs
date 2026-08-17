// engine.test.mjs — closed-loop engine tests: beam determinism, gate
// filtering, baseline guarantee, calibrate round-trip (schema + self fields).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { searchPlan, dialsFor } from "../engine/search.mjs";
import { buildPlan } from "../longform-director.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = JSON.parse(readFileSync(join(ROOT, "video/src/script.json"), "utf8"));
const PY = process.env.PYTHON || "python";

test("beam is deterministic: same seed, same winner", () => {
  const a = searchPlan(script, { variants: 16, seed: 20260817 });
  const b = searchPlan(script, { variants: 16, seed: 20260817 });
  assert.equal(a.winner.tag, b.winner.tag);
  assert.equal(a.winner.overall, b.winner.overall);
  assert.equal(a.passedCount, b.passedCount);
  assert.deepEqual(a.plan.search.dials, b.plan.search.dials);
  assert.equal(a.winner.index, b.winner.index);
});

test("baseline variant is always in the beam and gate-passing", () => {
  const { evaluated, winner } = searchPlan(script, { variants: 32, seed: 99 });
  const baseline = evaluated.find(e => e.tag === "baseline");
  assert.ok(baseline, "baseline variant missing");
  assert.equal(baseline.passed, true, "baseline must never regress");
  const dials = dialsFor(0, () => 0.5);
  assert.deepEqual(dials, { tag: "baseline" });
});

test("gate filter: only gate-passing variants can win", () => {
  const { evaluated, passedCount, winner } = searchPlan(script, { variants: 64, seed: 424242 });
  assert.ok(passedCount >= 1);
  assert.equal(winner.passed, true);
  const passing = evaluated.filter(e => e.passed);
  assert.equal(passing.length, passedCount);
  for (const e of evaluated) assert.equal(e.passed, e.failures.length === 0);
});

test("all variants respect canonical narration and authored staging", () => {
  const { evaluated, plan } = searchPlan(script, { variants: 8, seed: 7 });
  assert.equal(plan.beats.length, script.beats.length);
  const multiset = p => p.beats.map(b => JSON.stringify(b.narrative)).sort();
  const first = multiset(plan);
  for (const e of evaluated) {
    const p = buildPlan(script, { seed: 7 + e.index * 7919, dials: e.dials });
    assert.deepEqual(multiset(p), first, `variant ${e.tag} altered the narration`);
  }
});

test("calibrate round-trip: schema-compatible output with self-calibration fields", () => {
  const priorPath = process.env.YT_ENGINE_MODEL || "C:/Users/rajna/yt_engine/reports/retention_coefficients.json";
  if (!existsSync(priorPath)) { console.log("  SKIP: prior model missing"); return; }
  const dir = mkdtempSync(join(tmpdir(), "engine-cal-"));
  const csv = join(dir, "fixture.csv");
  const out = join(dir, "coef.json");
  try {
    const d = Number(script.durationInSeconds);
    let rows = ["video_id,video_title,duration_sec,minute,retention_pct"];
    for (let m = 0; m <= Math.ceil(d / 60); m++) rows.push(`synth,${script.title},${Math.round(d)},${m},${(100 * Math.exp(-m / 40)).toFixed(2)}`);
    writeFileSync(csv, rows.join("\n"), "utf8");
    const r = spawnSync(PY, ["tools/engine/calibrate.py", "--csv", csv, "--out", out, "--prior", priorPath], { cwd: ROOT, encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr || r.stdout);
    const prior = JSON.parse(readFileSync(priorPath, "utf8"));
    const cal = JSON.parse(readFileSync(out, "utf8"));
    assert.equal(cal.coefficients.length, prior.coefficients.length, "coefficient count must match schema");
    assert.deepEqual(cal.coefficients.map(c => c.feature), prior.coefficients.map(c => c.feature));
    for (const c of cal.coefficients) { assert.ok(Number.isFinite(c.effect)); assert.ok(Number.isFinite(c.self_effect)); }
    assert.equal(cal.position_curve.length, 50);
    assert.equal(cal.self_calibrated_videos, 1);
    assert.ok(cal.self_calibrated_sentences >= 100);
    assert.ok(cal.self_calibrated_at);
    assert.ok(cal.prior_weight > 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("calibrate dry run writes nothing and aborts on garbage CSV", () => {
  const dir = mkdtempSync(join(tmpdir(), "engine-cal-"));
  try {
    const priorPath = process.env.YT_ENGINE_MODEL || "C:/Users/rajna/yt_engine/reports/retention_coefficients.json";
    if (!existsSync(priorPath)) { console.log("  SKIP: prior model missing"); return; }
    const csv = join(dir, "bad.csv");
    writeFileSync(csv, "video_id,video_title,duration_sec,minute,retention_pct\nx,y,ten,0,1\n", "utf8");
    const r = spawnSync(PY, ["tools/engine/calibrate.py", "--csv", csv, "--out", join(dir, "never.json")], { cwd: ROOT, encoding: "utf8" });
    assert.notEqual(r.status, 0, "garbage duration_sec must abort");
    assert.ok(!existsSync(join(dir, "never.json")));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});