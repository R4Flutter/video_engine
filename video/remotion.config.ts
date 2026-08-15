/** Remotion configuration tuned for CPU-only 16 GB machines. */
import os from "node:os";
import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.overrideBundlerConfig(enableTailwind);

// 16 GB RAM is the hard constraint. Four Chromium workers are a safer default
// than the core-count heuristic; users can raise it explicitly after measuring.
const requested = Number(process.env.REMOTION_CONCURRENCY);
const cores = os.cpus().length || 4;
const defaultConcurrency = Math.min(4, Math.max(2, cores));
Config.setConcurrency(Number.isFinite(requested) && requested > 0 ? Math.min(requested, 6) : defaultConcurrency);

// Faster encoding keeps render time low; YouTube re-encodes the upload anyway.
Config.setX264Preset((process.env.REMOTION_X264_PRESET as "faster" | "fast" | "medium") ?? "faster");

// Optional GPU path. Never required for correctness.
const gl = process.env.REMOTION_GL as "angle" | "swangle" | undefined;
if (gl) Config.setChromiumOpenGlRenderer(gl);

// Keep decoded video reuse bounded so long projects do not balloon memory.
Config.setOffthreadVideoCacheSizeInBytes(512 * 1024 * 1024);
