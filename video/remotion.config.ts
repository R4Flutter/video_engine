/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import os from "node:os";
import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDelayRenderTimeoutInMilliseconds(90000);
Config.overrideBundlerConfig((current) => {
  const withTailwind = enableTailwind(current);
  return {
    ...withTailwind,
    module: {
      ...withTailwind.module,
      rules: withTailwind.module.rules.map((rule) =>
        rule && rule !== "..." && rule.test && String(rule.test).includes("woff")
          ? { test: /\.(woff2?|otf|ttf|eot)(\?.*)?$/, type: "asset/inline" }
          : rule,
      ),
    },
  };
});

// ------------------------------------------------------------------ speed
// Everything below trades machine time, never picture. The codec settings keep
// the same CRF, so the frames that come out are the frames that went in; the
// only lever pulled is how long x264 is allowed to think about each one.

// Remotion defaults to half the cores and leaves the rest of the box idle.
// A 1080x1920 tab costs roughly 350MB, so this is capped rather than greedy —
// past ~8 workers the render is waiting on memory bandwidth, not cores.
// Override per-run with REMOTION_CONCURRENCY=4 npm run render:vox.
const cores = os.cpus().length || 4;
Config.setConcurrency(
  Number(process.env.REMOTION_CONCURRENCY) || Math.max(2, Math.min(cores, 8)),
);

// x264's default here is "medium". At a fixed CRF the preset buys compression
// efficiency, not quality — "faster" gives back most of the encode time for a
// file maybe a tenth larger, which YouTube re-encodes away regardless.
Config.setX264Preset(
  (process.env.REMOTION_X264_PRESET as "faster") ?? "faster",
);

// Chromium paints on SwiftShader (CPU) unless told otherwise. This page is
// heavy on the exact things a GPU is for — full-frame gradients, mixBlendMode,
// CSS filters, SVG — so "angle" hands that to the integrated GPU and can halve
// the frame time. Some drivers render blank under ANGLE: if the output looks
// wrong, run with REMOTION_GL=swangle to go back to software.
const gl = process.env.REMOTION_GL as "angle" | "swangle" | undefined;
if (gl) Config.setChromiumOpenGlRenderer(gl);

// The archival clips are re-decoded per frame beyond this budget. Half a gig of
// cache is nothing next to re-seeking an mp4 1,100 times.
Config.setOffthreadVideoCacheSizeInBytes(512 * 1024 * 1024);
