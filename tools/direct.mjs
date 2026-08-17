// Long-form production director front door.
// The finance episode branch is intentionally long-form-only: no ShortPlan,
// swipe model, frame-zero Shorts hook, or Short QC is reachable from here.
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertLongformScript } from "./longform-policy.mjs";

const root = joinRoot();
const arg = (name, fallback = null) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : fallback; };
const scriptPath = resolve(root, arg("script", "video/src/script.json"));
const outPath = resolve(root, arg("out", "video/src/director-plan.json"));
const script = JSON.parse(readFileSync(scriptPath, "utf8"));
assertLongformScript(script);

const { spawnSync } = await import("node:child_process");
const runner = process.execPath;
const result = spawnSync(runner, [resolve(root, "tools/longform-director.mjs"), "--script", scriptPath, "--out", outPath, "--references", resolve(root, "yt_engine/reference-patterns.json")], { cwd: root, stdio: "inherit" });
if (result.status !== 0) process.exit(result.status ?? 1);

mkdirSync(dirname(outPath), { recursive: true });
const plan = JSON.parse(readFileSync(outPath, "utf8"));
console.log(`DIRECTOR   ${plan.project.title}`);
console.log(`MODE       ${plan.project.mode}`);
console.log(`FORMAT     ${plan.project.width}x${plan.project.height}@${plan.project.fps} · ${plan.project.durationInSeconds}s · ${plan.beats.length} beats`);
console.log(`COLD OPEN  ${plan.coldOpen?.selected?.archetype || plan.coldOpen?.selected?.id || "selected"} · ${plan.coldOpen?.selected?.score ?? "n/a"}/10`);
console.log(`QC         ${plan.qc?.score ?? "n/a"}/10`);
console.log(`WROTE      ${outPath}`);

function joinRoot() { return resolve(dirname(fileURLToPath(import.meta.url)), ".."); }
