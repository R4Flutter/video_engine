// The long-form episode pipeline, with a stopwatch on every stage.
//
//     npm run episode:longform
//     npm run episode:longform -- --from voice
//     npm run episode:longform -- --only render
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const VIDEO = fileURLToPath(new URL("../video/", import.meta.url));

const PIPELINE = {
  longform: [
    "script",
    "story:gate",
    "voice",
    "align",
    "footage",
    "direct",
    "gate",
    "lint",
    "render:longform",
    "master",
  ],
  finance: [
    "script",
    "story:gate",
    "voice",
    "align",
    "direct",
    "gate",
    "lint",
    "render",
  ],
};

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? null : process.argv[i + 1];
};

const engine = arg("engine") ?? "longform";
const stages = PIPELINE[engine];
if (!stages) throw new Error(`unknown engine "${engine}" — expected longform or finance`);

const resolve = (name) => {
  const i = stages.findIndex((s) => s === name || s.startsWith(`${name}:`));
  if (i === -1) throw new Error(`no stage "${name}" in: ${stages.join(", ")}`);
  return i;
};

const only = arg("only");
const from = arg("from");
const plan = only ? [stages[resolve(only)]] : from ? stages.slice(resolve(from)) : stages;

const clock = (secs) =>
  secs < 60 ? `${secs.toFixed(1)}s` : `${Math.floor(secs / 60)}m${String(Math.round(secs % 60)).padStart(2, "0")}s`;

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const timings = [];
const started = Date.now();

for (const stage of plan) {
  process.stdout.write(`\n\x1b[1m── ${stage}\x1b[0m\n`);
  const t0 = Date.now();
  const run = spawnSync(npm, ["run", stage], { cwd: VIDEO, stdio: "inherit", shell: true });
  const secs = (Date.now() - t0) / 1000;
  timings.push({ stage, secs, ok: run.status === 0 });
  if (run.status !== 0) {
    report(timings, started);
    process.exit(run.status ?? 1);
  }
  process.stdout.write(`\x1b[2m   ${stage} — ${clock(secs)}\x1b[0m\n`);
}

report(timings, started);

function report(rows, t0) {
  const total = (Date.now() - t0) / 1000;
  const width = Math.max(...rows.map((r) => r.stage.length));
  const bar = (secs) => "█".repeat(Math.max(1, Math.round((secs / total) * 32)));
  const lines = [
    `episode — ${clock(total)} total`,
    "",
    ...rows.map((r) => `${r.stage.padEnd(width)}  ${clock(r.secs).padStart(7)}  ${String(Math.round((r.secs / total) * 100)).padStart(3)}%  ${bar(r.secs)}${r.ok ? "" : "  FAILED"}`),
  ];
  const out = join(VIDEO, "out");
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "timings.txt"), `${lines.join("\n")}\n`, "utf8");
  process.stdout.write(`\n${lines.join("\n")}\n\nwritten to video/out/timings.txt\n`);
}
