// Production long-form editorial gate.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");
const planPath = resolve(root, "video/src/director-plan.json");
const scriptPath = resolve(root, "video/src/script.json");
const plan = JSON.parse(readFileSync(planPath, "utf8"));
const script = JSON.parse(readFileSync(scriptPath, "utf8"));

import { GATES, gateFailures } from "./longform-gates.mjs";

const gates = GATES;
const findings = [];
const scores = plan.qc?.scores || {};
const add = (severity, rule, message, fix) => findings.push({ severity, rule, message, fix });

if (plan.project?.mode !== "LONGFORM_DOCUMENTARY") add("FATAL", "canonical_mode", `Expected LONGFORM_DOCUMENTARY, got ${plan.project?.mode}`, "Run the long-form director.");
if (Number(script.durationInSeconds) < 120) add("FATAL", "duration", `Script is ${script.durationInSeconds}s; long-form requires >=120s`, "Use a 120s+ finance/documentary script.");
if (Math.abs(Number(plan.project?.durationInSeconds) - Number(script.durationInSeconds)) > 0.35) add("FATAL", "duration_sync", "Script and director durations disagree.", "Regenerate the director plan from the current script.");
if (plan.swipeCurve) add("FATAL", "short_model_contamination", "Long-form plan contains swipeCurve data.", "Use the standalone long-form director only.");
if (plan.frameZero) add("HIGH", "short_schema_contamination", "Long-form plan still contains frameZero-style schema.", "Remove Shorts-specific frame-zero artifacts.");
if (plan.version !== "longform-1.0") add("FATAL", "plan_schema", `Unexpected plan version: ${plan.version}`, "Regenerate with the production long-form director.");
if (!plan.renderContract || plan.renderContract.schema !== "longform-render-1") add("FATAL", "render_contract", "Missing deterministic long-form render contract.", "Regenerate the plan.");
if (!Array.isArray(plan.coldOpen?.candidates) || plan.coldOpen.candidates.length < 8) add("HIGH", "cold_open_candidates", "Fewer than eight cold-open candidates were generated.", "Generate the full candidate set before selection.");
if (Number(plan.coldOpen?.selected?.score || 0) < 8.5) add("HIGH", "cold_open_score", `Selected cold open scored ${plan.coldOpen?.selected?.score ?? 0}/10.`, "Generate/score stronger candidates before rendering.");
if (!Array.isArray(plan.beats) || plan.beats.length < 20) add("HIGH", "beat_density", `Only ${plan.beats?.length ?? 0} directed beats for a long-form episode.`, "Increase meaningful narrative/visual state changes.");

const metrics = plan.qc?.metrics || {};
findings.push(...gateFailures(scores, metrics));

const blockers = findings.filter(f => f.severity === "FATAL");
const failingGates = findings.filter(f => ["FATAL", "HIGH"].includes(f.severity));
const overall = Number(plan.qc?.score || 0);
const lines = [
  "LONGFORM QC",
  "════════════════════════════════════════════════════════════",
  `${plan.project.title}`,
  `${plan.project.durationInSeconds}s · ${plan.beats.length} beats · mode=${plan.project.mode}`,
  "",
  `STATUS   ${blockers.length ? "FAIL" : failingGates.length ? "FIX_FIRST" : "PASS"}`,
  `OVERALL  ${overall.toFixed(2)}/10`,
  "",
  "SCORES",
  ...Object.entries(scores).map(([k,v]) => `  ${k.padEnd(18)} ${Number(v).toFixed(1)}/10  gate ${gates[k] ?? "-"}`),
  "",
  `COLD OPEN  ${plan.coldOpen?.selected?.archetype || "n/a"} · ${plan.coldOpen?.selected?.score ?? 0}/10`,
  `VISUAL     ${Number(metrics.visualChangesPerMinute || 0).toFixed(1)}/min`,
  `EVIDENCE   ${Number(metrics.evidenceEventsPerMinute || 0).toFixed(1)}/min`,
  "",
  "FINDINGS",
  ...findings.map(f => `[${f.severity}] ${f.rule}: ${f.message}\n        fix: ${f.fix}`),
  "",
  "A strong hook never compensates for a weak middle; every dimension gates independently.",
];
const out = lines.join("\n") + "\n";
console.log(out);
const outFile = join(root, "video/out/qc-report.txt");
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, out, "utf8");
if (strict && (blockers.length || failingGates.length)) process.exit(1);
