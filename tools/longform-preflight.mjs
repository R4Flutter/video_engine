// Production preflight for long-form finance episodes.
// Fails before render when the plan is not a genuine documentary plan.
import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const planPath = join(root, "video/src/director-plan.json");
const scriptPath = join(root, "video/src/script.json");
const plan = JSON.parse(readFileSync(planPath, "utf8"));
const script = JSON.parse(readFileSync(scriptPath, "utf8"));
const errors = []; const warnings = [];
const duration = Number(plan?.project?.durationInSeconds ?? 0);
const mode = plan?.project?.mode;
const width = Number(plan?.project?.width ?? 0); const height = Number(plan?.project?.height ?? 0);
if (duration < 120) errors.push(`expected long-form duration >=120s, got ${duration}s`);
if (mode !== "LONG_FORM") errors.push(`director mode must be LONG_FORM, got ${mode}`);
if (width !== 1920 || height !== 1080) errors.push(`FinanceLong requires 1920x1080, got ${width}x${height}`);
if (!Array.isArray(plan.beats) || plan.beats.length < 2) errors.push("director plan has too few beats");
if (plan.swipeCurve?.length) errors.push("LONG_FORM plan contains swipeCurve data; Shorts retention must never enter the long-form artifact");
const forbidden = new Set(["coinDrop","coinStack","jarFill","mountain","investChart","kinetic"]);
for (const b of plan.beats ?? []) if (forbidden.has(b?.visual?.module)) errors.push(`beat ${b.n}: forbidden legacy module ${b.visual.module}`);
const longBeats = (plan.beats ?? []).filter((b) => (Number(b.end) - Number(b.start)) >= 20);
const internallyStaged = longBeats.filter((b) => (b?.motion?.reveal?.triggers?.length ?? 0) > 0 || (b?.narrative?.reveal ?? "").length > 0);
if (longBeats.length && internallyStaged.length / longBeats.length < 0.6) warnings.push("fewer than 60% of 20s+ beats contain explicit internal visual staging; add meaningful reveals before render");
const repeated = [];
for (let i=1;i<(plan.beats??[]).length;i++) if (plan.beats[i].visual.module === plan.beats[i-1].visual.module) repeated.push(plan.beats[i].n);
if (repeated.length > Math.max(2, Math.floor((plan.beats?.length ?? 0)*0.08))) warnings.push(`module repetition is high (${repeated.length} adjacent repeats)`);
if (script.title && plan.project.title && script.title !== plan.project.title) warnings.push(`script title and director title differ: ${script.title} / ${plan.project.title}`);
console.log(`LONG-FORM PREFLIGHT`);
console.log(`  ${errors.length ? "FAIL" : "PASS"}  ${plan.project.title}`);
console.log(`  mode=${mode} duration=${duration}s format=${width}x${height} beats=${plan.beats?.length ?? 0}`);
for (const w of warnings) console.log(`  WARN  ${w}`);
for (const e of errors) console.log(`  ERROR ${e}`);
if (errors.length) process.exit(1);
