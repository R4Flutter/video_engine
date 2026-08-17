// Long-form production director front door.
// This finance branch intentionally routes only through the standalone long-form engine.
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { assertLongformScript } from "./longform-policy.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback = null) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : fallback; };
const scriptPath = resolve(root, arg("script", "video/src/script.json"));
const outPath = resolve(root, arg("out", "video/src/director-plan.json"));
const script = JSON.parse(readFileSync(scriptPath, "utf8"));
assertLongformScript(script);
const node = process.execPath;

for (const step of [
  ["LongFormDirector", [resolve(root, "tools/longform-director.mjs"), "--script", scriptPath, "--out", outPath, "--references", resolve(root, "yt_engine/reference-patterns.json")]],
  ["LongFormAutofix", [resolve(root, "tools/longform-autofix.mjs")]],
]) {
  const r = spawnSync(node, step[1], { cwd: root, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

mkdirSync(dirname(outPath), { recursive: true });
const plan = JSON.parse(readFileSync(outPath, "utf8"));
console.log(`DIRECTOR   ${plan.project.title}`);
console.log(`MODE       ${plan.project.mode}`);
console.log(`FORMAT     ${plan.project.width}x${plan.project.height}@${plan.project.fps} · ${plan.project.durationInSeconds}s · ${plan.beats.length} beats`);
console.log(`COLD OPEN  ${plan.coldOpen?.selected?.archetype || "selected"} · ${plan.coldOpen?.selected?.score ?? 0}/10`);
console.log(`QC         ${plan.qc?.score ?? 0}/10`);
console.log(`WROTE      ${outPath}`);
