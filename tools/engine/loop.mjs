// loop.mjs — the closed-loop orchestrator.
//
//   node tools/engine/loop.mjs status                     pipeline state
//   node tools/engine/loop.mjs beam    [--variants 32]    editorial beam -> winner plan -> autofix -> gate
//   node tools/engine/loop.mjs calibrate --csv <file>     learn from real YouTube retention, then re-score
//
// The loop, end to end: publish episode -> export retention CSV -> loop calibrate
// -> next loop beam composes against a model that knows YOUR channel.
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const node = process.execPath;
const arg = (name, fallback = null) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : fallback; };

const MODEL = process.env.YT_ENGINE_MODEL || "C:/Users/rajna/yt_engine/reports/retention_coefficients.json";
const planPath = resolve(root, "video/src/director-plan.json");
const auditPath = resolve(root, "video/out/gemini-audit.json");
const beamAuditPath = resolve(root, "video/out/plan-variants.json");
const voDir = resolve(root, "video/public/audio/vo");

const run = (argv, opts = {}) => {
  const r = spawnSync(node, argv, { cwd: root, stdio: opts.silent ? "pipe" : "inherit" });
  if (r.status !== 0) { console.error(`[loop] ${argv[0]} failed (${r.status})`); process.exit(r.status ?? 1); }
  return r;
};

function status() {
  const plan = existsSync(planPath) ? JSON.parse(readFileSync(planPath, "utf8")) : null;
  console.log("LOOP STATUS");
  if (!plan) { console.log("  PLAN     none — run: npm run direct"); return; }
  console.log(`  PLAN     ${plan.project.title} · ${plan.project.mode}`);
  console.log(`  QC       ${plan.qc?.score ?? "?"}/10 across ${plan.qc ? Object.keys(plan.qc.scores ?? {}).length : 0} dimensions`);
  const failures = Object.entries(plan.qc?.scores ?? {}).filter(([, v]) => v < 8);
  if (failures.length) for (const [k, v] of failures) console.log(`           FAIL ${k} ${v}/10`);
  const search = plan.search ?? JSON.parse(existsSync(beamAuditPath) ? readFileSync(beamAuditPath, "utf8") : "{}");
  console.log(`  SEARCH   variant "${search.tag ?? "baseline"}" · seed ${search.seed ?? "?"} ${search.generated ? `· audited ${search.generated}` : ""}`);
  if (existsSync(beamAuditPath)) {
    const a = JSON.parse(readFileSync(beamAuditPath, "utf8"));
    if (a.winner) console.log(`           beam ${a.variants} variants · ${a.passedCount ?? "?"} passed · Δ${a.deltaVsBaseline ?? 0} vs baseline`);
  }
  let takes = 0;
  if (existsSync(voDir)) for (const f of readdirSync(voDir)) if (f.endsWith(".wav")) takes++;
  console.log(`  VOICE    ${takes} take(s) rendered / ${plan.beats?.length ?? "?"} beats${takes > 0 ? " — ready to align" : " — render in progress"}`);
  if (existsSync(MODEL)) {
    const m = JSON.parse(readFileSync(MODEL, "utf8"));
    console.log(`  MODEL    ${m.self_calibrated_at ? `self-calibrated ${m.self_calibrated_at} on ${m.self_calibrated_videos} video(s) · ${m.self_calibrated_sentences} sentences (prior weight ${m.prior_weight})` : `corpus model (${m.n_sentences ?? "?"} sentences) — not yet self-calibrated`}`);
  } else console.log("  MODEL    MISSING — retention scores will be 0");
  if (existsSync(auditPath)) {
    const a = JSON.parse(readFileSync(auditPath, "utf8"));
    const ageMs = Date.now() - statSync(auditPath).mtimeMs;
    const last = (a.round || []).filter(r => r.verdicts).pop();
    console.log(`  AUDIT    ${a.status?.ready ? "READY" : a.status?.skipped ? "skipped (no key)" : a.status?.error ? `error ${a.status.error}` : "NOT READY"} · ${a.round?.length ?? 0} round(s) · ${last ? `weakest ${Object.entries(last.verdicts).sort((x, y) => x[1].score - y[1].score)[0][0]} ${Math.min(...Object.values(last.verdicts).map(v => v.score))}/10` : ""} (${Math.round(ageMs / 60000)} min old)`);
  }
}

function beam() {
  const variants = Number(arg("variants", "32")) || 32;
  const seed = Number(arg("seed", "20260817")) || 20260817;
  run([resolve(root, "tools/engine/search.mjs"), "--script", resolve(root, "video/src/script.json"),
       "--out", planPath, "--variants", String(variants), "--seed", String(seed)]);
  if (!process.argv.includes("--no-audit")) {
    run([resolve(root, "tools/engine/auditor.mjs"), "--script", resolve(root, "video/src/script.json"), "--plan", planPath]);
  }
  run([resolve(root, "tools/longform-autofix.mjs")]);
  run([resolve(root, "tools/qc.mjs"), "--plan", planPath]);
}

function auditCmd() {
  run([resolve(root, "tools/engine/auditor.mjs"), "--script", resolve(root, "video/src/script.json"), "--plan", planPath]);
  run([resolve(root, "tools/longform-autofix.mjs")]);
  run([resolve(root, "tools/qc.mjs"), "--plan", planPath]);
}

function calibrate() {
  const csv = arg("csv");
  if (!csv) { console.error("usage: node tools/engine/loop.mjs calibrate --csv <retention.csv>"); process.exit(2); }
  const r = spawnSync("python", [resolve(root, "tools/engine/calibrate.py"), "--csv", csv], { cwd: root, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
  console.log("\nRE-SCORE against the recalibrated model:");
  run([resolve(root, "tools/retention-score.mjs")]);
}

const cmd = process.argv[2];
if (cmd === "status") status();
else if (cmd === "beam") beam();
else if (cmd === "audit") auditCmd();
else if (cmd === "calibrate") calibrate();
else { console.error("usage: node tools/engine/loop.mjs <status|beam|audit|calibrate> [opts]"); process.exit(2); }