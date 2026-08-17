// Production preflight for long-form finance episodes.
import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const planPath = join(root, "video/src/director-plan.json");
const scriptPath = join(root, "video/src/script.json");
const entryPath = join(root, "tools/direct.mjs");
const plan = JSON.parse(readFileSync(planPath, "utf8"));
const script = JSON.parse(readFileSync(scriptPath, "utf8"));
const entry = readFileSync(entryPath, "utf8");
const errors = [], warnings = [];
const forbiddenEntry = ["buildShortPlan", "estimateSwipe", "planFrameZero", "runRetentionQC", "ShortsSwipeRisk", "ShortLoopPlanner", "ShortFrameZero", "ShortsDerivedPlan", "ShortRender", "ShortsQC"];
const duration = Number(plan?.project?.durationInSeconds ?? 0);
const scriptDuration = Number(script?.durationInSeconds ?? 0);
const mode = plan?.project?.mode;
const width = Number(plan?.project?.width ?? 0), height = Number(plan?.project?.height ?? 0);
const engine = String(plan?.project?.engine ?? "");

if (duration < 120) errors.push(`expected long-form duration >=120s, got ${duration}s`);
if (mode !== "LONGFORM_DOCUMENTARY") errors.push(`director mode must be LONGFORM_DOCUMENTARY, got ${mode}`);
if (width !== 1920 || height !== 1080) errors.push(`FinanceLong requires 1920x1080, got ${width}x${height}`);
if (engine !== "finance") errors.push(`FinanceLong requires finance engine, got ${engine || "missing"}`);
if (script.engine !== "finance") errors.push(`script.json is not the finance source (engine=${script.engine || "missing"})`);
if (scriptDuration < 120) errors.push(`script.json is not long-form: ${scriptDuration}s`);
if (Math.abs(duration - scriptDuration) > 0.35) errors.push(`script/director duration mismatch: script=${scriptDuration}s plan=${duration}s`);
if (script.title && plan.project.title && script.title !== plan.project.title) errors.push(`script/director title mismatch: "${script.title}" / "${plan.project.title}"`);
if (plan.version !== "longform-1.0") errors.push(`unexpected plan version: ${plan.version}`);
if (plan.frameZero) errors.push("Shorts frameZero artifact present in long-form plan");
if (plan.swipeCurve) errors.push("Shorts swipeCurve artifact present in long-form plan");
if (!plan.renderContract || plan.renderContract.schema !== "longform-render-1") errors.push("missing longform-render-1 contract");
for (const symbol of forbiddenEntry) if (entry.includes(symbol)) errors.push(`Short-only symbol reachable from long-form direct entry: ${symbol}`);

const forbiddenModules = new Set(["coinDrop", "coinStack", "jarFill", "mountain", "kinetic"]);
for (const b of plan.beats ?? []) if (forbiddenModules.has(b?.visual?.module)) errors.push(`beat ${b.n}: legacy Shorts module ${b.visual.module}`);

const repeats = [];
for (let i = 1; i < (plan.beats ?? []).length; i++) if (plan.beats[i]?.visual?.module === plan.beats[i - 1]?.visual?.module) repeats.push(plan.beats[i].n);
if (repeats.length > Math.max(3, Math.floor((plan.beats?.length ?? 0) * 0.12))) warnings.push(`adjacent module repetition is high (${repeats.length})`);

const metrics = plan.qc?.metrics || {};
if (Number(metrics.visualChangesPerMinute || 0) < 5) warnings.push(`visual change rate ${Number(metrics.visualChangesPerMinute || 0).toFixed(1)}/min is low`);
if (Number(metrics.evidenceEventsPerMinute || 0) < 1.5) warnings.push(`evidence rate ${Number(metrics.evidenceEventsPerMinute || 0).toFixed(1)}/min is low`);

console.log("LONG-FORM PREFLIGHT");
console.log(`  ${errors.length ? "FAIL" : "PASS"}  ${plan.project.title}`);
console.log(`  mode=${mode} engine=${engine} duration=${duration}s format=${width}x${height} beats=${plan.beats?.length ?? 0}`);
for (const w of warnings) console.log(`  WARN  ${w}`);
for (const e of errors) console.log(`  ERROR ${e}`);
if (errors.length) process.exit(1);
