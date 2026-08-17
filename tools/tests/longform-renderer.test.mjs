import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("../..", import.meta.url).pathname);
const read = (p) => readFileSync(resolve(root, p), "utf8");

const finance = read("video/src/FinanceLong.tsx");
const scenes = read("video/src/LongFormScenes.tsx");
const assets = JSON.parse(read("video/src/asset-manifest.json"));
const rootTsx = read("video/src/Root.tsx");

 test("FinanceLong consumes DirectedScene rather than bypassing the director", () => {
  assert.match(finance, /<DirectedScene beat=\{beat\}\s*\/>/);
  assert.doesNotMatch(finance, /LONGFORM_MODULES\[/);
});

test("longform renderer is asset-first", () => {
  assert.match(scenes, /AssetResolver/);
  assert.match(scenes, /resolveAsset\(beat\)/);
  assert.ok(assets.assets.length >= 10);
});

test("longform output remains landscape 16:9", () => {
  assert.match(rootTsx, /width=\{1920\}/);
  assert.match(rootTsx, /height=\{1080\}/);
});

test("longform renderer no longer relies on Arial", () => {
  assert.doesNotMatch(finance, /Arial/);
  assert.doesNotMatch(scenes, /fontFamily:\s*["']Arial/);
});
