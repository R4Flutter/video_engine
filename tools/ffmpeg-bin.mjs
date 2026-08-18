// ffmpeg-bin.mjs — resolve ffmpeg/ffprobe for the render toolchain.
//
// Order: FFMPEG_BIN env override → vendored build (vendor/ffmpeg-*/bin) →
// PATH. The vendored fallback keeps the pipeline runnable on machines where
// ffmpeg is not installed globally (this repo ships the portable build).
import { readdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

export function ffmpegDir() {
  if (process.env.FFMPEG_BIN) return process.env.FFMPEG_BIN;
  try {
    const dir = readdirSync(resolve(ROOT, "vendor"))
      .map(d => join(ROOT, "vendor", d, "bin"))
      .find(d => existsSync(join(d, "ffmpeg.exe")) || existsSync(join(d, "ffmpeg")));
    if (dir) return dir;
  } catch { /* no vendor dir */ }
  return null;
}

export function ffmpegBin() {
  const dir = ffmpegDir();
  if (dir) {
    const exe = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
    const full = join(dir, exe);
    if (existsSync(full)) return full;
  }
  return "ffmpeg";
}

export function ffprobeBin() {
  const dir = ffmpegDir();
  if (dir) {
    const exe = process.platform === "win32" ? "ffprobe.exe" : "ffprobe";
    const full = join(dir, exe);
    if (existsSync(full)) return full;
  }
  return "ffprobe";
}