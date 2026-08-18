// Long-form production director front door.
// This finance branch intentionally routes only through the standalone long-form engine.
// Default: editorial beam search (--variants N, default 32) over the deterministic
// director, gate-filtered, argmax-selected. --variants 1 restores the single-plan path.
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { assertLongformScript } from "./longform-policy.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback = null) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : fallback; };
const scriptPath = resolve(root, arg("script", "video/src/script.json"));
const outPath = resolve(root, arg("out", "video/src/director-plan.json"));
const variants = Number(arg("variants", "32")) || 1;
const seed = Number(arg("seed", "20260817")) || 20260817;
const script = JSON.parse(readFileSync(scriptPath, "utf8"));
assertLongformScript(script);
const node = process.execPath;

const steps = variants > 1
  ? [["EditorialBeam", [resolve(root, "tools/engine/search.mjs"), "--script", scriptPath, "--out", outPath, "--variants", String(variants), "--seed", String(seed)]]]
  : [["LongFormDirector", [resolve(root, "tools/longform-director.mjs"), "--script", scriptPath, "--out", outPath, "--references", resolve(root, "yt_engine/reference-patterns.json")]]];
if (!process.argv.includes("--no-audit")) {
  steps.push(["GeminiAuditor", [resolve(root, "tools/engine/auditor.mjs"), "--script", scriptPath, "--plan", outPath]]);
}
steps.push(["LongFormAutofix", [resolve(root, "tools/longform-autofix.mjs")]]);

for (const [name, argv] of steps) {
  const r = spawnSync(node, argv, { cwd: root, stdio: "inherit" });
  if (r.status !== 0) { console.error(`[${name}] failed (${r.status})`); process.exit(r.status ?? 1); }
}

mkdirSync(dirname(outPath), { recursive: true });
const plan = JSON.parse(readFileSync(outPath, "utf8"));
console.log(`DIRECTOR   ${plan.project.title}`);
console.log(`MODE       ${plan.project.mode}`);
console.log(`FORMAT     ${plan.project.width}x${plan.project.height}@${plan.project.fps} · ${plan.project.durationInSeconds}s · ${plan.beats.length} beats`);
console.log(`COLD OPEN  ${plan.coldOpen?.selected?.archetype || "selected"} · ${plan.coldOpen?.selected?.score ?? 0}/10`);
console.log(`QC         ${plan.qc?.score ?? 0}/10`);
console.log(`WROTE      ${outPath}`);