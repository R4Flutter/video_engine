import assert from "node:assert/strict";
import { test } from "node:test";
import { pathToFileURL, fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../..", import.meta.url));
const { assetIssuesForScript, assetForBeat } = await import(
  pathToFileURL(join(root, "video/src/director/assets.ts")).href,
);

test("required footage beat fails closed when no asset mapping exists", () => {
  const script = {
    title: "asset-test",
    engine: "vox",
    fps: 30,
    width: 1920,
    height: 1080,
    durationInSeconds: 2,
    beats: [{
      n: 1,
      name: "FOOTAGE",
      start: 0,
      end: 2,
      vo: "test",
      visual: "use documentary footage",
      module: "footage",
      text: "TEST",
    }],
  };
  const issues = assetIssuesForScript(script);
  assert.equal(issues.length, 1);
  assert.match(issues[0], /requires an asset/);
  assert.equal(assetForBeat(script.beats[0]), undefined);
});

test("legacy beat footage path resolves to the renderer contract", () => {
  const beat = {
    n: 1,
    name: "FOOTAGE",
    start: 0,
    end: 2,
    vo: "test",
    visual: "use footage",
    module: "footage",
    footage: "assets/test.mp4",
  };
  const asset = assetForBeat(beat);
  assert.equal(asset?.path, "assets/test.mp4");
  assert.equal(asset?.type, "video");
});
