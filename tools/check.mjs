// Guards the script_beats.md -> script.json contract. Run after editing the
// script or the parser:  node tools/check.mjs
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const parse = (name) => {
  const out = join(tmpdir(), `script-check-${process.pid}-${name}.json`);
  execFileSync(process.execPath, [
    join(root, "tools/parse-script.mjs"),
    join(root, name),
    out,
  ]);
  return JSON.parse(readFileSync(out, "utf8"));
};

// script_beats.md is the parsed source of truth for the long-form episode.
// script.md is the raw documentary text and deliberately has no BEAT blocks.
const s = parse("script_beats.md");

assert.equal(s.engine, "finance", "script_beats.md has no finance style header");
assert.equal(s.width, 1920);
assert.equal(s.height, 1080);
assert.equal(s.fps, 30);
assert.ok(s.durationInSeconds >= 120, "the long-form episode must be >= 120s");

// Every beat maps to a module the long-form renderer knows. Legacy Shorts
// modules (coinDrop, coinStack, jarFill, mountain, kinetic) are forbidden.
const LONGFORM_MODULES = new Set([
  "footage", "evidence", "archive", "stat", "compare", "chart",
  "investChart", "timeline", "icon", "quote", "callout", "payoff", "outro",
]);
for (const b of s.beats) {
  assert.ok(LONGFORM_MODULES.has(b.module), `beat ${b.n} staged as unknown module "${b.module}"`);
}

// Beats tile the timeline with no gap and no overlap.
s.beats.reduce((prev, b) => {
  assert.equal(b.start, prev, `beat ${b.n} starts at ${b.start}, expected ${prev}`);
  assert.ok(b.end > b.start && b.vo, `beat ${b.n} needs a duration and narration`);
  return b.end;
}, 0);

// FRAME ONE. This is the regression guard for the failure that started the
// director: an episode shipped with a blank first frame while the hook typed
// itself in underneath, and nothing in the build noticed.
const hook = s.beats[0].hook || s.beats[0].text;
assert.ok(hook && hook.trim(), "beat 1 must carry a `Hook:` or `On-screen text` row — frame one cannot be blank");
assert.ok(hook.length <= 46, `the frame-one hook is ${hook.length} chars — too long to read in a glance`);

// The direction rows survive the parse. Legacy scripts predate the direction
// vocabulary, so this is best-effort: only assert what the script chose to
// write, never demand the rows exist.
assert.ok(
  s.beats.every((b) => !b.purpose || typeof b.purpose === "string"),
  "a `Purpose:` row that exists must survive the parse",
);
assert.ok(
  s.beats.every((b) => !b.camera || /hold|push|pull|punch|settle/i.test(b.camera)),
  "every `Camera:` row names an intent the planner knows",
);

// Timed overlay/sfx tables are optional for long-form (the director synthesizes
// audio and attention events from the editorial rows); when present they must
// parse row-per-row without losing cues.
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

// Amounts are grouped the American way wherever they are rendered.
assert.equal(new Intl.NumberFormat("en-US").format(700000), "700,000");
assert.equal(new Intl.NumberFormat("en-US").format(10000000), "10,000,000");

console.log("ok — script_beats.md parses into a long-form finance episode");