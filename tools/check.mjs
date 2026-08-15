// Guards the script.md -> script.json contract. Run after editing either the
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

const s = parse("script.md");

assert.equal(s.engine, "finance", "script.md has no vox style header");
assert.equal(s.width, 1080);
assert.equal(s.height, 1920);
assert.equal(s.fps, 30);
assert.ok(s.durationInSeconds > 0, "the episode has a length");

// The contract is "every beat maps to a module that exists", not "this
// episode has these seven modules". The old assertion pinned one script's
// running order, so editing the script broke the test that was supposed to be
// guarding the parser.
const FINANCE_MODULES = new Set([
  "coinDrop", "coinStack", "investChart", "jarFill", "mountain", "payoff", "outro",
]);
for (const b of s.beats) {
  assert.ok(FINANCE_MODULES.has(b.module), `beat ${b.n} staged as unknown module "${b.module}"`);
}
assert.ok(
  s.beats.every((b, i) => i === 0 || b.module !== s.beats[i - 1].module),
  "no module may run back to back — two identical frames read as one long beat",
);

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

// Both timed tables parse row-per-row (a greedy regex silently pairs them up,
// which yields *fewer* cues than beats — so the count must never fall short).
assert.ok(s.texts.length >= s.beats.length, "one overlay cue per beat");
assert.ok(s.sfx.length >= s.beats.length, "one sfx cue per beat");
assert.ok(
  s.texts.every((t) => t.at < s.durationInSeconds && t.text),
  "overlay cues land inside the video",
);
const known = new Set([
  "coin.wav", "coin-soft.wav", "whoosh.wav", "whoosh-up.wav", "boom.wav",
  "chime.wav", "chime-warm.wav", "shimmer.wav", "pop.wav", "tick.wav",
  "riser.wav", "stamp.wav",
]);
const knownSfx = (script) => {
  for (const cue of script.sfx) {
    for (const f of cue.files) assert.ok(known.has(f), `unknown sfx asset ${f}`);
  }
};
knownSfx(s);

// Amounts are grouped the American way wherever they are rendered.
assert.equal(new Intl.NumberFormat("en-US").format(700000), "700,000");
assert.equal(new Intl.NumberFormat("en-US").format(10000000), "10,000,000");

// ---------------------------------------------------------------- vox
// Same parser, second vocabulary: the style header is the only switch.
const v = parse("script_vox.md");

assert.equal(v.engine, "vox", "script_vox.md must declare a vox style");
assert.ok(v.durationInSeconds > 0, "the vox episode has a length");

// The contract is "every beat maps to a module that exists", not "this
// episode has these six modules" — the old assertion pinned one script's
// running order, so editing the script broke the guard for the parser.
const VOX_MODULES = new Set([
  "kinetic", "doodle", "icon", "chart", "compare", "stat",
  "footage", "callout", "timeline", "quote",
]);
for (const b of v.beats) {
  assert.ok(VOX_MODULES.has(b.module), `vox beat ${b.n} staged as unknown module "${b.module}"`);
}
assert.ok(
  v.beats.every((b, i) => i === 0 || b.module !== v.beats[i - 1].module),
  "no vox module may run back to back — two identical frames read as one long beat",
);

// Beats tile the timeline with no gap and no overlap.
v.beats.reduce((prev, b) => {
  assert.equal(b.start, prev, `vox beat ${b.n} starts at ${b.start}, expected ${prev}`);
  assert.ok(b.end > b.start && b.vo, `vox beat ${b.n} needs a duration and narration`);
  return b.end;
}, 0);

// FRAME ONE — same guard as the finance engine: the vox film opens on the
// hook text, so frame one cannot be blank or unreadable.
const vhook = v.beats[0].hook || v.beats[0].text;
assert.ok(vhook && vhook.trim(), "vox beat 1 must carry a `Hook:` or `On-screen text` row — frame one cannot be blank");
assert.ok(vhook.length <= 46, `the vox frame-one hook is ${vhook.length} chars — too long to read in a glance`);

knownSfx(v);
assert.ok(v.texts.length >= v.beats.length, "one overlay cue per vox beat");
assert.ok(v.sfx.length >= v.beats.length, "one sfx cue per vox beat");
assert.ok(
  v.beats.every((b) => !b.text || b.text === b.text.trim()),
  "on-screen text is cleaned",
);

console.log("ok — script.md and script_vox.md both parse into renderable episodes");
