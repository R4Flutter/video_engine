#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "video", "src", "shorts-manifest.json"), "utf8"));
const fps = 30;
const shorts = manifest.shorts ?? [];
if (shorts.length !== 3) throw new Error(`Expected exactly 3 derived Shorts, found ${shorts.length}`);

for (let i = 0; i < 3; i++) {
  const s = shorts[i];
  const frames = Math.max(1, Math.ceil(Number(s.duration) * fps));
  const composition = `Shorts${i + 1}`;
  const output = path.join(ROOT, "video", "out", `short-${i + 1}.mp4`);
  console.log(`SHORTS RENDER  ${composition}  ${s.sourceStart.toFixed(1)}–${s.sourceEnd.toFixed(1)}s  ${s.duration.toFixed(1)}s`);
  const result = spawnSync("npx", ["remotion", "render", composition, output, `--frames=0-${frames - 1}`, "--concurrency=2"], {
    cwd: path.join(ROOT, "video"),
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log("SHORTS RENDER  3/3 complete");
