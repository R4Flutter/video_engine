// e2e.test.mjs — end-to-end smoke render test.
//
// Renders 60-frame windows of the REAL plan at 0%, ~25%, ~50%, ~75% and the
// final 60 frames (FinanceLong reads video/src/director-plan.json statically)
// and runs the partial pixel QC against each output. This is the only test
// that exercises the actual render pipeline: media binding, composition,
// ffmpeg, and the QC contract — across the whole runtime, not just the open.
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
const planPath = resolve(videoDir, "src/director-plan.json");
const qcReportPath = resolve(videoDir, "out/pixel-qc-report.json");
const fps = 30;

test("asset resolver binds every media beat of the real plan", () => {
  const r = spawnSync(process.execPath, [resolve(root, "tools/engine/assets.mjs"), "--plan", planPath], { encoding: "utf8" });
  assert.equal(r.status, 0, `assets.mjs failed:\n${r.stdout}\n${r.stderr}`);
  const plan = JSON.parse(readFileSync(planPath, "utf8"));
  const mediaModules = new Set(["footage", "evidence", "stat", "chart", "investChart", "timeline", "compare"]);
  const unbound = (plan.beats || []).filter(b => mediaModules.has(b?.visual?.module) && !b?.render?.media?.src && !b?.visual?.assetPath);
  assert.deepEqual(unbound, [], `beats missing media: ${unbound.map(b => b.n).join(", ")}`);
});

test("semantic bindings match the storyboard contract", () => {
  const plan = JSON.parse(readFileSync(planPath, "utf8"));
  const srcOf = n => plan.beats.find(b => b.n === n)?.render?.media?.src || plan.beats.find(b => b.n === n)?.visual?.assetPath || "";
  const cases = [
    [1, "gym"],            // cold open: empty gym, NEVER the FTC building
    [2, "g01"],            // impossible ratio -> membership density
    [3, "g02"],            // fire code -> four percent math
    [5, "cr_subscription"],// $86 estimate -> C+R survey chart
    [7, "g03"],            // $133 gap -> subscription gap graphic
    [12, "b05"],           // ideal customer -> person walking past the storefront
    [18, "bally_1994"],    // 1994 investigation -> Bally regulatory document
    [20, "bally_1994"],    // victim with a document -> Bally contract
    [31, "adobe_2013"],    // the backlash -> 2013 announcement
    [32, "g08"],           // the numbers -> Adobe revenue ladder
    [44, "amazon_cancel"], // cancellation maze -> Amazon cancel flow
    [47, "amazon_settlement"], // SEP 25, 2025 -> Amazon's settlement
    [49, "adobe_doj"],     // Adobe sued too -> DOJ settlement
    [53, "g14"],           // click-to-cancel -> symmetry graphic
    [56, "eighth_circuit"],// not about the rule -> the court ruling
    [64, "g15"],           // gap reframed -> final 133 gap callback
  ];
  for (const [n, needle] of cases) {
    const src = srcOf(n);
    assert.ok(src.includes(needle), `beat ${n} bound to ${src || "nothing"}, expected *${needle}*`);
  }
});

const renderWindow = (outPath, frames) => {
  if (existsSync(outPath)) unlinkSync(outPath);
  // npx is a .cmd shim on Windows — spawnSync refuses it without a shell.
  const render = spawnSync(`npx remotion render FinanceLong "${outPath}" --frames=${frames} --concurrency=2`, { cwd: videoDir, shell: true, encoding: "utf8", timeout: 240000 });
  assert.equal(render.status, 0, `render failed:\n${render.stdout?.slice(-2000)}\n${render.stderr?.slice(-2000)}`);
  assert.ok(existsSync(outPath), "render produced no output file");
  const qc = spawnSync(process.execPath, [resolve(root, "tools/longform-pixel-qc.mjs"), "--video", outPath, "--partial"], { encoding: "utf8" });
  const report = JSON.parse(readFileSync(qcReportPath, "utf8"));
  assert.equal(qc.status, 0, `pixel QC failed:\n${report.errors?.join("\n")}`);
  assert.equal(report.status, "PASS", `pixel QC status ${report.status}: ${report.warnings?.join("; ")}`);
  assert.equal(report.media.hasAudio, true, "rendered clip has no audio stream");
  assert.equal(report.media.width, 1920);
  assert.equal(report.media.height, 1080);
  assert.ok(Math.abs(report.media.fps - fps) <= 0.05, `fps ${report.media.fps}`);
};

const windows = () => {
  const plan = JSON.parse(readFileSync(planPath, "utf8"));
  const total = Math.round(plan.project.durationInSeconds * fps);
  const q = i => Math.min(total - 60, Math.floor((total * i) / 4));
  return [
    ["open", "0-59"],
    ["25%", `${q(1)}-${q(1) + 59}`],
    ["50%", `${q(2)}-${q(2) + 59}`],
    ["75%", `${q(3)}-${q(3) + 59}`],
    ["final", `${total - 60}-${total - 1}`],
  ];
};

for (const [label, frames] of windows()) {
  test(`render window ${label} (frames ${frames}) + partial pixel QC passes`, { timeout: 300000 }, () => {
    renderWindow(resolve(videoDir, `out/e2e-${label}.mp4`), frames);
  });
}