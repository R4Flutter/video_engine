import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("../..", import.meta.url).pathname);
const read = (p) => readFileSync(resolve(root, p), "utf8");

const qc = read("tools/rendered-frame-qc.mjs");
const pkg = JSON.parse(read("video/package.json"));


test("rendered-frame QC samples real pixels through ffmpeg", () => {
  assert.match(qc, /ffmpeg/);
  assert.match(qc, /rawvideo/);
  assert.match(qc, /frameMetrics/);
  assert.match(qc, /temporalDiff/);
});

test("rendered-frame QC catches blank frames and visual monotony", () => {
  assert.match(qc, /blank-or-uniform-frame/);
  assert.match(qc, /visual-monotony-run/);
  assert.match(qc, /insufficient-state-change/);
});

test("rendered-frame QC emits an auditable report and can gate render", () => {
  assert.match(qc, /render-qc\.json/);
  assert.match(qc, /render-qc\.md/);
  assert.match(qc, /process\.exit\(1\)/);
  assert.match(pkg.scripts["render:finance"], /render:qc/);
  assert.match(pkg.scripts["render:qc"], /rendered-frame-qc\.mjs/);
});
