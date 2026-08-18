// e2e.test.mjs — end-to-end smoke render test.
//
// Renders the first 60 frames of the REAL plan (FinanceLong reads
// video/src/director-plan.json statically) and runs the partial pixel QC
// against the output. This is the only test that exercises the actual
// render pipeline: media binding, composition, ffmpeg, and the QC contract.
//
//   npm run test:e2e
//
// Slow by design (spawns remotion) — not part of `check`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const videoDir = resolve(root, "video");
const outPath = resolve(videoDir, "out/e2e-smoke.mp4");
const planPath = resolve(videoDir, "src/director-plan.json");

test("asset resolver binds every media beat of the real plan", () => {
  const r = spawnSync(process.execPath, [resolve(root, "tools/engine/assets.mjs"), "--plan", planPath], { encoding: "utf8" });
  assert.equal(r.status, 0, `assets.mjs failed:\n${r.stdout}\n${r.stderr}`);
  const plan = JSON.parse(readFileSync(planPath, "utf8"));
  const mediaModules = new Set(["footage", "evidence", "stat", "chart", "investChart", "timeline", "compare"]);
  const unbound = (plan.beats || []).filter(b => mediaModules.has(b?.visual?.module) && !b?.render?.media?.src && !b?.visual?.assetPath);
  assert.deepEqual(unbound, [], `beats missing media: ${unbound.map(b => b.n).join(", ")}`);
});

test("60-frame smoke render + partial pixel QC passes", { timeout: 300000 }, () => {
  if (existsSync(outPath)) unlinkSync(outPath);
  // npx is a .cmd shim on Windows — spawnSync refuses it without a shell.
  const render = spawnSync(`npx remotion render FinanceLong "${outPath}" --frames=0-59 --concurrency=2`, { cwd: videoDir, shell: true, encoding: "utf8", timeout: 240000 });
  assert.equal(render.status, 0, `render failed:\n${render.stdout?.slice(-2000)}\n${render.stderr?.slice(-2000)}`);
  assert.ok(existsSync(outPath), "render produced no output file");

  const qc = spawnSync(process.execPath, [resolve(root, "tools/longform-pixel-qc.mjs"), "--video", outPath, "--partial"], { encoding: "utf8" });
  const report = JSON.parse(readFileSync(resolve(videoDir, "out/pixel-qc-report.json"), "utf8"));
  assert.equal(qc.status, 0, `pixel QC failed:\n${report.errors?.join("\n")}`);
  assert.equal(report.status, "PASS", `pixel QC status ${report.status}: ${report.warnings?.join("; ")}`);
  assert.equal(report.media.hasAudio, true, "rendered clip has no audio stream");
  assert.equal(report.media.width, 1920);
  assert.equal(report.media.height, 1080);
  assert.ok(Math.abs(report.media.fps - 30) <= 0.05, `fps ${report.media.fps}`);
});