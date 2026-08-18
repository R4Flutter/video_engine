// Audio mastering. Runs on the rendered file, not on the plan.
//
// Remotion mixes the voice, the bed and the sfx at whatever levels the plan
// asked for, and it is not its job to know what a platform wants. The measured
// result of the last render was:
//
//   integrated  -16.9 LUFS      YouTube normalises toward about -14
//   true peak     0.0 dBFS      i.e. touching the ceiling, almost certainly
//                               clipping once the AAC encoder is done with it
//   range         2.8 LU        flattened
//
// Those two findings sound contradictory and are not. The mix is squashed
// against the ceiling — no headroom — while still averaging quiet. YouTube only
// ever turns audio *down*, never up, so at -16.9 the video simply plays quieter
// than everything around it in the feed. On a phone, at a glance, quieter reads
// as lower production value before a single word is understood.
//
// This pass re-normalises to -14 LUFS with 1.5 dB of true-peak headroom, in two
// passes so the gain is measured rather than guessed. Video is copied through
// untouched, so it costs a few seconds and cannot alter a single frame.
//
//   node ../tools/master.mjs out/vox.mp4 out/vox_upload.mp4
import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { ffmpegBin } from "./ffmpeg-bin.mjs";

const FFMPEG = ffmpegBin();

const TARGET_I = -14; // LUFS, what the platform normalises toward
const TARGET_TP = -1.5; // dBTP, headroom left for the lossy encoder
const TARGET_LRA = 7; // LU, loose enough to keep the read's dynamics

const [, , input, output] = process.argv;

if (!input || !output) {
  console.error("usage: node master.mjs <input.mp4> <output.mp4>");
  process.exit(1);
}
if (!existsSync(input)) {
  console.error(`no such file: ${path.resolve(input)}`);
  process.exit(1);
}

/** ffmpeg reports everything worth reading — the loudnorm JSON, the ebur128
 *  summary — on stderr, and exits 0 while doing it. So both streams are
 *  captured and concatenated: the caller wants the measurements, not the exit
 *  code. */
const run = (args) => {
  const r = spawnSync(FFMPEG, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.error) {
    console.error(`could not run ffmpeg: ${r.error.message}`);
    console.error("ffmpeg must be on PATH for this step.");
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error(`ffmpeg failed (exit ${r.status}):`);
    console.error(`${r.stdout ?? ""}${r.stderr ?? ""}`.slice(-2000));
    process.exit(1);
  }
  return `${r.stdout ?? ""}${r.stderr ?? ""}`;
};

console.log(`measuring ${input} ...`);

// Pass one: measure. loudnorm reports what it found as JSON on stderr.
const measured = run([
  "-hide_banner",
  "-nostats",
  "-i",
  input,
  "-af",
  `loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:print_format=json`,
  "-f",
  "null",
  "-",
]);

const json = /\{[\s\S]*\}/.exec(measured);
if (!json) {
  console.error("could not read loudnorm measurements from ffmpeg");
  console.error(measured.slice(-2000));
  process.exit(1);
}
const m = JSON.parse(json[0]);

console.log(
  `  in : ${m.input_i} LUFS   peak ${m.input_tp} dBTP   range ${m.input_lra} LU`,
);

// Pass two: apply the measured correction. linear=true so the whole file gets
// one gain change rather than a compressor riding the read — a narrated
// explainer that breathes is being narrated, one that pumps is being processed.
const filter =
  `loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}` +
  `:measured_I=${m.input_i}:measured_TP=${m.input_tp}` +
  `:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}` +
  `:offset=${m.target_offset}:linear=true:print_format=summary`;

run([
  "-hide_banner",
  "-nostats",
  "-y",
  "-i",
  input,
  "-map",
  "0:v",
  "-map",
  "0:a",
  "-c:v",
  "copy", // not one frame is re-encoded
  "-af",
  filter,
  "-c:a",
  "aac",
  "-b:a",
  "320k",
  "-ar",
  "48000",
  "-movflags",
  "+faststart",
  output,
]);

// Verify rather than assert. The point of the pass is a number, so read it back.
const check = run([
  "-hide_banner",
  "-nostats",
  "-i",
  output,
  "-af",
  "ebur128=peak=true",
  "-f",
  "null",
  "-",
]);
// ebur128 prints a running measurement every 100ms and *then* a Summary block.
// Reading the first "I:" in the stream gets the reading at t=0, which is
// silence — hence -70 LUFS. Only the summary is the file's actual loudness.
const summary = check.slice(check.lastIndexOf("Summary:"));
const got = {
  i: /I:\s*(-?[\d.]+)\s*LUFS/.exec(summary)?.[1],
  tp: /Peak:\s*(-?[\d.]+)\s*dBFS/.exec(summary)?.[1],
};

console.log(`  out: ${got.i} LUFS   peak ${got.tp} dBFS`);

if (!existsSync(output) || statSync(output).size === 0) {
  console.error(`FAIL: output missing or empty: ${path.resolve(output)}`);
  process.exit(1);
}
console.log(`wrote ${output} (${(statSync(output).size / 1024 / 1024).toFixed(1)} MB)`);

if (got.i && Math.abs(Number(got.i) - TARGET_I) > 1.5) {
  console.error(`FAIL: integrated loudness ${got.i} LUFS outside tolerance ${TARGET_I} ± 1.5`);
  process.exit(1);
}
if (got.tp && Number(got.tp) > -0.5) {
  console.error(`FAIL: true peak ${got.tp} dBFS too close to clipping (limit -0.5)`);
  process.exit(1);
}
