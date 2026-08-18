import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ffmpegBin, ffprobeBin } from "./ffmpeg-bin.mjs";

const FFMPEG = ffmpegBin();
const FFPROBE = ffprobeBin();

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const arg = (name, fallback = null) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : fallback; };
const video = resolve(ROOT, arg("video", "video/out/final.mp4"));
const planPath = resolve(ROOT, arg("plan", "video/src/director-plan.json"));
const reportPath = resolve(ROOT, "video/out/pixel-qc-report.json");
const partial = process.argv.includes("--partial");
const plan = JSON.parse(readFileSync(planPath, "utf8"));
const errors = [];
const warnings = [];

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", shell: false });
  return { ok: r.status === 0, stdout: r.stdout || "", stderr: r.stderr || "", status: r.status };
}
function requireTool(cmd) {
  const r = run(cmd, ["-version"]);
  if (!r.ok) throw new Error(`${cmd} is required for rendered-pixel QC`);
}

if (!existsSync(video)) errors.push("missing final.mp4");
if (!existsSync(planPath)) errors.push("missing director-plan.json");
if (errors.length) { writeFileSync(reportPath, JSON.stringify({ status: "FAIL", errors, warnings }, null, 2)); console.error(errors.join("\n")); process.exit(1); }

try { requireTool(FFPROBE); } catch (e) { errors.push(e.message); }
try { requireTool(FFMPEG); } catch (e) { errors.push(e.message); }
if (errors.length) { writeFileSync(reportPath, JSON.stringify({ status: "FAIL", errors, warnings }, null, 2)); console.error(errors.join("\n")); process.exit(1); }

const probe = run(FFPROBE, ["-v","error","-show_entries","format=duration,size:stream=index,codec_type,width,height,r_frame_rate,duration","-of","json",video]);
if (!probe.ok) errors.push(`ffprobe failed: ${probe.stderr.trim()}`);
let metadata = null;
try { metadata = JSON.parse(probe.stdout); } catch { errors.push("ffprobe returned invalid JSON"); }
const format = metadata?.format || {};
const streams = metadata?.streams || [];
const vstream = streams.find(s => s.codec_type === "video");
const astream = streams.find(s => s.codec_type === "audio");
const duration = Number(format.duration || 0);
const expected = Number(plan.project?.durationInSeconds || 0);
const width = Number(vstream?.width || 0), height = Number(vstream?.height || 0);
const fps = vstream?.r_frame_rate ? (() => { const [n, d] = String(vstream.r_frame_rate).split("/").map(Number); return d ? n / d : n; })() : 0;
if (!partial && Math.abs(duration - expected) > 0.35) errors.push(`duration mismatch: rendered=${duration.toFixed(2)}s plan=${expected.toFixed(2)}s`);
if (width !== Number(plan.project.width) || height !== Number(plan.project.height)) errors.push(`resolution mismatch: rendered=${width}x${height} plan=${plan.project.width}x${plan.project.height}`);
if (Math.abs(fps - Number(plan.project.fps)) > 0.05) errors.push(`fps mismatch: rendered=${fps.toFixed(2)} plan=${Number(plan.project.fps)}`);
if (!astream) errors.push("no audio stream in rendered video");
if (!partial) {
  const loud = run(FFMPEG, ["-hide_banner","-nostats","-i",video,"-af","ebur128","-f","null","-"]);
  const m = (loud.stderr || "").match(/I:\s*(-?[\d.]+)\s+LUFS/);
  if (!m) warnings.push("loudness measurement could not complete");
  else {
    const integrated = Number(m[1]);
    if (integrated < -19 || integrated > -11) errors.push(`loudness out of tolerance: integrated ${integrated.toFixed(1)} LUFS (band -19..-11)`);
  }
}

// black/freeze/silence scans need a meaningful window (d=5s freeze, d=3s
// silence) — on a partial smoke clip they cannot complete, so they are
// skipped rather than reported as degraded QC.
let blackMatches = [], frozenMatches = [], silence = [];
if (!partial) {

const black = run(FFMPEG, ["-hide_banner","-nostats","-i",video,"-vf","blackdetect=d=1:pix_th=0.995","-an","-f","null","-"]);
blackMatches = [...black.stderr.matchAll(/black_start:([\d.]+)\s+black_end:([\d.]+)\s+black_duration:([\d.]+)/g)].map(m => ({ start:Number(m[1]), end:Number(m[2]), duration:Number(m[3]) }));
for (const b of blackMatches) if (b.duration > 1.0 && b.start > 0.05) warnings.push(`black frame interval ${b.start.toFixed(2)}-${b.end.toFixed(2)}s`);
if (black.status !== 0) warnings.push("blackdetect could not complete");

const frozen = run(FFMPEG, ["-hide_banner","-nostats","-i",video,"-vf","freezedetect=n=-60d=5","-an","-f","null","-"]);
frozenMatches = [...frozen.stderr.matchAll(/freeze_start:([\d.]+).*?freeze_end:([\d.]+).*?freeze_duration:([\d.]+)/gs)].map(m => ({ start:Number(m[1]), end:Number(m[2]), duration:Number(m[3]) }));
for (const f of frozenMatches) if (f.duration > 5) warnings.push(`possible stale/frozen visual ${f.start.toFixed(2)}-${f.end.toFixed(2)}s`);
if (frozen.status !== 0) warnings.push("freezedetect could not complete");

const audio = run(FFMPEG, ["-hide_banner","-nostats","-i",video,"-af","silencedetect=n=-55dB:d=3","-vn","-f","null","-"]);
silence = [...audio.stderr.matchAll(/silence_start: ([\d.]+)|silence_end: ([\d.]+)/g)].map(m => m[1] ? { type:"start", at:Number(m[1]) } : { type:"end", at:Number(m[2]) });
if (silence.length > 8) warnings.push(`many long silence events detected (${silence.length}); verify against intentional dramatic silence`);
} // end partial-exempt duration scans

const missingMedia = [];
const unboundMedia = [];
const mediaModules = new Set(["footage", "evidence", "stat", "chart", "investChart", "timeline", "compare"]);
for (const b of plan.beats || []) {
  const src = b?.render?.media?.src || b?.visual?.assetPath || b?.visual?.asset || b?.visual?.footage;
  if (mediaModules.has(b?.visual?.module) && !src) { unboundMedia.push({ beat: b.n, module: b.visual.module }); continue; }
  if (!src) continue;
  const normalized = String(src).replace(/\\/g,"/").replace(/^assets\//,"");
  const candidates = [join(ROOT,"video/public/assets",normalized), join(ROOT,"video/public",normalized)];
  if (!candidates.some(existsSync)) missingMedia.push({ beat:b.n, src });
}
for (const m of missingMedia) errors.push(`missing asset beat ${m.beat}: ${m.src}`);
for (const m of unboundMedia) errors.push(`beat ${m.beat}: ${m.module} requires media but has no src in the rendered contract`);

const report = { status: errors.length ? "FAIL" : warnings.length ? "PASS_WITH_WARNINGS" : "PASS", errors, warnings, partial,
  media: { duration, width, height, fps: Number(fps.toFixed(2)), hasAudio: Boolean(astream), sizeBytes:Number(format.size || 0), videoCodec:vstream?.codec_name || "" }, blackIntervals:blackMatches, frozenIntervals:frozenMatches, silenceEvents:silence.length, checkedAt:new Date().toISOString() };
mkdirSync(join(ROOT,"video/out"),{recursive:true});
writeFileSync(reportPath, JSON.stringify(report,null,2));
console.log(`PIXEL QC  ${report.status}${partial ? " (partial)" : ""}`);
console.log(`  duration ${duration.toFixed(2)}s / plan ${expected.toFixed(2)}s`);
console.log(`  format   ${width}x${height}@${fps.toFixed(2)}fps · ${vstream?.codec_name || "unknown"} · ${astream ? "audio" : "NO AUDIO"}`);
console.log(`  errors   ${errors.length}`);
console.log(`  warnings ${warnings.length}`);
console.log(`WROTE     ${reportPath}`);
if (errors.length) process.exit(1);
