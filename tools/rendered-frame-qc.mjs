#!/usr/bin/env node
/**
 * Rendered-frame QC for long-form video.
 *
 * This is intentionally renderer-level: it samples the actual MP4 pixels instead
 * of trusting the director plan. It looks for blank/near-uniform frames, visual
 * staleness, weak state changes inside long beats, and suspicious text-card
 * dominance. It also emits JSON + Markdown reports and a handful of flagged
 * frame JPEGs so a human can inspect the exact failures.
 *
 * Requires ffmpeg + ffprobe on PATH. No npm CV package is required.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import process from "node:process";

const DEFAULT_INPUT = resolve("out/final.mp4");
const DEFAULT_OUT = resolve("out/render-qc");
const SAMPLE_FPS = 1; // enough for long-form QC without making the laptop crawl
const W = 64;
const H = 36;
const BYTES_PER_FRAME = W * H * 3;
const MAX_SNAPSHOTS = 12;

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const mean = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const variance = (xs, m = mean(xs)) => mean(xs.map((x) => (x - m) ** 2));

const run = (command, args, { capture = true } = {}) => new Promise((resolvePromise, reject) => {
  const child = spawn(command, args, { stdio: ["ignore", capture ? "pipe" : "inherit", "pipe"] });
  let stdout = "";
  let stderr = "";
  if (capture) child.stdout.on("data", (d) => { stdout += d; });
  child.stderr.on("data", (d) => { stderr += d; });
  child.on("error", reject);
  child.on("close", (code) => code === 0 ? resolvePromise({ stdout, stderr }) : reject(new Error(`${command} exited ${code}: ${stderr.trim()}`)));
});

const ffprobe = async (input) => {
  const { stdout } = await run("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration:stream=width,height,r_frame_rate,codec_name",
    "-of", "json",
    input,
  ]);
  const data = JSON.parse(stdout);
  const stream = (data.streams ?? [])[0] ?? {};
  const [n, d] = String(stream.r_frame_rate ?? "30/1").split("/").map(Number);
  return {
    duration: Number(data.format?.duration ?? 0),
    width: Number(stream.width ?? 0),
    height: Number(stream.height ?? 0),
    fps: d ? n / d : 30,
    codec: stream.codec_name ?? "unknown",
  };
};

const sampleFrames = (input) => new Promise((resolvePromise, reject) => {
  const args = [
    "-hide_banner", "-loglevel", "error",
    "-i", input,
    "-vf", `fps=${SAMPLE_FPS},scale=${W}:${H}:flags=bilinear,format=rgb24`,
    "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1",
  ];
  const child = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
  const chunks = [];
  let stderr = "";
  child.stdout.on("data", (d) => chunks.push(d));
  child.stderr.on("data", (d) => { stderr += d; });
  child.on("error", reject);
  child.on("close", (code) => {
    if (code !== 0) return reject(new Error(`ffmpeg exited ${code}: ${stderr.trim()}`));
    const data = Buffer.concat(chunks);
    const frames = [];
    for (let off = 0; off + BYTES_PER_FRAME <= data.length; off += BYTES_PER_FRAME) {
      frames.push(data.subarray(off, off + BYTES_PER_FRAME));
    }
    resolvePromise(frames);
  });
});

const frameMetrics = (buf) => {
  const gray = new Array(W * H);
  let sum = 0;
  let chromaSum = 0;
  for (let i = 0, p = 0; i < gray.length; i++, p += 3) {
    const r = buf[p];
    const g = buf[p + 1];
    const b = buf[p + 2];
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    gray[i] = y;
    sum += y;
    chromaSum += Math.max(r, g, b) - Math.min(r, g, b);
  }
  const avg = sum / gray.length;
  const varY = variance(gray, avg);
  let edge = 0;
  let edgeSum = 0;
  const threshold = 14;
  for (let y = 0; y < H - 1; y++) {
    for (let x = 0; x < W - 1; x++) {
      const a = gray[y * W + x];
      const dx = Math.abs(a - gray[y * W + x + 1]);
      const dy = Math.abs(a - gray[(y + 1) * W + x]);
      const g = (dx + dy) / 2;
      edgeSum += g;
      if (g > threshold) edge++;
    }
  }
  const chroma = chromaSum / gray.length;
  const edgeDensity = edge / ((W - 1) * (H - 1));
  const texture = edgeSum / ((W - 1) * (H - 1));
  return { avg, varY, chroma, edgeDensity, texture };
};

const temporalDiff = (a, b) => {
  if (!a || !b) return 999;
  let total = 0;
  for (let i = 0; i < a.length; i += 3) {
    const aY = 0.2126 * a[i] + 0.7152 * a[i + 1] + 0.0722 * a[i + 2];
    const bY = 0.2126 * b[i] + 0.7152 * b[i + 1] + 0.0722 * b[i + 2];
    total += Math.abs(aY - bY);
  }
  return total / (a.length / 3);
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const input = args.find((a) => !a.startsWith("--")) ?? DEFAULT_INPUT;
  const outFlag = args.indexOf("--out");
  const planFlag = args.indexOf("--plan");
  const outDir = outFlag >= 0 ? resolve(args[outFlag + 1]) : DEFAULT_OUT;
  const planPath = planFlag >= 0 ? resolve(args[planFlag + 1]) : resolve("video/src/director-plan.json");
  const strict = args.includes("--strict");
  return { input: resolve(input), outDir, planPath, strict };
};

const beatAt = (plan, t) => (plan?.beats ?? []).find((b) => t >= Number(b.start) && t < Number(b.end));

const expectedStillModule = (module) => new Set(["evidence", "stat", "chart", "investChart", "timeline", "compare", "quote", "callout", "payoff"]).has(module);

const scoreRun = (samples) => {
  const bad = samples.filter((s) => s.flags.some((f) => f.severity === "FATAL"));
  const high = samples.filter((s) => s.flags.some((f) => f.severity === "HIGH"));
  const warn = samples.filter((s) => s.flags.some((f) => f.severity === "MED" || f.severity === "LOW"));
  return clamp(10 - bad.length * 3 - high.length * 1.25 - warn.length * 0.15, 0, 10);
};

const snapshot = async (input, t, outPath) => {
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-ss", String(Math.max(0, t)), "-i", input, "-frames:v", "1", "-vf", "scale=960:-2", "-q:v", "3", outPath]);
};

const renderMarkdown = (report) => {
  const lines = [
    `# Rendered-frame QC`,
    ``,
    `**Video:** ${report.video.input}`,
    `**Duration:** ${report.video.duration.toFixed(2)}s  |  **Format:** ${report.video.width}×${report.video.height}  |  **FPS:** ${report.video.fps.toFixed(2)}`,
    `**Score:** ${report.score.toFixed(1)}/10  |  **Verdict:** ${report.verdict}`,
    ``,
    `## Findings`,
  ];
  if (!report.findings.length) lines.push(`No rendered-pixel findings.`);
  for (const f of report.findings.slice(0, 80)) {
    lines.push(`- **${f.severity}** @ ${f.time.toFixed(2)}s — ${f.rule}: ${f.message}${f.beat ? ` (beat ${f.beat})` : ""}`);
  }
  lines.push(``, `## Sampling`, ``, `Sampled ${report.samples.length} frames at ${SAMPLE_FPS} fps. Pixel metrics are downscaled to ${W}×${H} before analysis.`);
  return lines.join("\n");
};

const main = async () => {
  const { input, outDir, planPath, strict } = parseArgs();
  if (!existsSync(input)) throw new Error(`rendered-frame QC input does not exist: ${input}`);
  mkdirSync(outDir, { recursive: true });
  const shotsDir = join(outDir, "frames");
  mkdirSync(shotsDir, { recursive: true });

  const [video, frames] = await Promise.all([ffprobe(input), sampleFrames(input)]);
  const plan = existsSync(planPath) ? JSON.parse(readFileSync(planPath, "utf8")) : null;
  if (video.duration <= 0 || !frames.length) throw new Error("rendered-frame QC could not sample the video");

  const samples = frames.map((buf, i) => {
    const time = i / SAMPLE_FPS;
    const beat = beatAt(plan, time);
    const metrics = frameMetrics(buf);
    const diff = i === 0 ? 999 : temporalDiff(frames[i - 1], buf);
    const flags = [];

    const uniform = metrics.varY < 18 && metrics.edgeDensity < 0.015;
    const veryDark = metrics.avg < 7 && metrics.varY < 28;
    const veryBright = metrics.avg > 248 && metrics.varY < 20;
    if (uniform || veryDark || veryBright) {
      flags.push({ severity: "FATAL", rule: "blank-or-uniform-frame", message: `frame is visually near-uniform (mean=${metrics.avg.toFixed(1)}, var=${metrics.varY.toFixed(1)})` });
    }

    const suspiciousCard = metrics.chroma < 13 && metrics.varY > 400 && metrics.edgeDensity > 0.10;
    const module = beat?.visual?.module;
    if (suspiciousCard && module === "footage") {
      flags.push({ severity: "HIGH", rule: "footage-looks-like-text-card", message: "a beat declared as footage renders with card-like low-chroma/high-edge pixels" });
    }

    if (diff < 2.2) {
      flags.push({ severity: "LOW", rule: "low-frame-change", message: `successive samples differ by only ${diff.toFixed(2)} luminance points` });
    }

    if (beat && Number(beat.end) - Number(beat.start) >= 20 && !expectedStillModule(module) && diff < 2.2) {
      flags.push({ severity: "MED", rule: "long-beat-staleness", message: `long beat is not a still-oriented module and is barely changing visually` });
    }

    return { index: i, time, beat: beat?.n ?? null, module: module ?? null, metrics, diff, flags };
  });

  const findings = [];
  for (const s of samples) for (const f of s.flags) findings.push({ ...f, time: s.time, beat: s.beat, module: s.module });

  // Run-length analysis: a clean video can have a few static samples, but a
  // long uninterrupted run is a strong signal that the renderer stalled.
  let runStart = 0;
  for (let i = 1; i <= samples.length; i++) {
    const same = i < samples.length && samples[i].diff < 2.2;
    if (!same) {
      const duration = (i - runStart) / SAMPLE_FPS;
      if (duration >= 8) findings.push({ severity: "HIGH", rule: "visual-monotony-run", time: samples[runStart].time, beat: samples[runStart].beat, module: samples[runStart].module, message: `${duration.toFixed(1)}s sampled run with almost no frame change` });
      runStart = i;
    }
  }

  // Long-beat state-change analysis catches “one card for 30 seconds” even when
  // the card has tiny animation noise.
  for (const beat of plan?.beats ?? []) {
    const start = Number(beat.start);
    const end = Number(beat.end);
    if (end - start < 15) continue;
    const inside = samples.filter((s) => s.time >= start && s.time < end);
    if (inside.length < 4) continue;
    const meaningfulChanges = inside.filter((s) => s.diff >= 5).length;
    const expected = expectedStillModule(beat.visual?.module);
    if (!expected && meaningfulChanges < 2) {
      findings.push({ severity: "MED", rule: "insufficient-state-change", time: start, beat: beat.n, module: beat.visual?.module, message: `${(end - start).toFixed(1)}s beat contains fewer than two meaningful rendered state changes` });
    }
  }

  const blankCount = findings.filter((f) => f.rule === "blank-or-uniform-frame").length;
  const highCount = findings.filter((f) => f.severity === "HIGH").length;
  const medCount = findings.filter((f) => f.severity === "MED").length;
  const score = clamp(10 - blankCount * 3 - highCount * 1.2 - medCount * 0.35, 0, 10);
  const verdict = blankCount ? "FAIL" : (strict && score < 7.5 ? "FAIL" : score < 8.5 ? "REVIEW" : "PASS");

  const report = {
    version: 1,
    generatedAt: new Date().toISOString(),
    video: { input, ...video },
    score,
    verdict,
    findings,
    samples,
  };

  const flaggedTimes = [...new Set(findings.filter((f) => f.severity === "FATAL" || f.severity === "HIGH").map((f) => f.time))].slice(0, MAX_SNAPSHOTS);
  for (let i = 0; i < flaggedTimes.length; i++) {
    const t = flaggedTimes[i];
    await snapshot(input, t, join(shotsDir, `${String(i + 1).padStart(2, "0")}-${t.toFixed(2)}s.jpg`));
  }
  report.snapshots = flaggedTimes.length;

  writeFileSync(join(outDir, "render-qc.json"), JSON.stringify(report, null, 2));
  writeFileSync(join(outDir, "render-qc.md"), renderMarkdown(report));

  console.log(`RENDERED-FRAME QC`);
  console.log(`  ${verdict}  score=${score.toFixed(1)}/10 duration=${video.duration.toFixed(2)}s samples=${samples.length}`);
  for (const f of findings.slice(0, 30)) console.log(`  ${f.severity.padEnd(5)} ${f.time.toFixed(2)}s ${f.rule}: ${f.message}`);
  console.log(`  report=${join(outDir, "render-qc.json")}`);
  console.log(`  review=${join(outDir, "render-qc.md")}`);

  if (verdict === "FAIL") process.exit(1);
};

main().catch((err) => {
  console.error(`RENDERED-FRAME QC ERROR: ${err.message}`);
  process.exit(2);
});
