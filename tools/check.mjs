// Guards the script.md -> script.json contract. Run after editing either the
// script or the parser:  node tools/check.mjs
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(tmpdir(), `script-check-${process.pid}.json`);
execFileSync(process.execPath, [
  join(root, "tools/parse-script.mjs"),
  join(root, "script.md"),
  out,
]);
const s = JSON.parse(readFileSync(out, "utf8"));

assert.equal(s.durationInSeconds, 30);
assert.equal(s.fps * s.durationInSeconds, 900);
assert.deepEqual(
  s.beats.map((b) => b.module),
  ["coinDrop", "coinStack", "investChart", "jarFill", "mountain", "payoff", "outro"],
  "every beat must map to a scene module, and the outro must not be read as a mountain",
);

// Beats tile the timeline with no gap and no overlap.
s.beats.reduce((prev, b) => {
  assert.equal(b.start, prev, `beat ${b.n} starts at ${b.start}, expected ${prev}`);
  assert.ok(b.end > b.start && b.vo, `beat ${b.n} needs a duration and narration`);
  return b.end;
}, 0);

// Both timed tables parse row-per-row (a greedy regex silently pairs them up).
assert.equal(s.texts.length, 8, "8 overlay cues");
assert.equal(s.sfx.length, 8, "8 sfx cues");
assert.ok(
  s.texts.every((t) => t.at < s.durationInSeconds && t.text),
  "overlay cues land inside the video",
);
const known = new Set([
  "coin.wav", "coin-soft.wav", "whoosh.wav", "whoosh-up.wav", "boom.wav",
  "chime.wav", "chime-warm.wav", "shimmer.wav", "pop.wav", "tick.wav",
  "riser.wav", "stamp.wav",
]);
for (const cue of s.sfx) {
  for (const f of cue.files) assert.ok(known.has(f), `unknown sfx asset ${f}`);
}

// Amounts are grouped the Indian way wherever they are rendered.
assert.equal(new Intl.NumberFormat("en-IN").format(700000), "7,00,000");
assert.equal(new Intl.NumberFormat("en-IN").format(10000000), "1,00,00,000");

console.log("ok — script.md parses into a renderable episode");
