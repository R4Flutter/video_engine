import React from "react";
import {AbsoluteFill, staticFile} from "remotion";
import {DocumentaryEpisode} from "../engine/CinematicShot";
import {planEpisode, type ShotIntent} from "../engine/shotPlanner";
import type {DocumentaryEpisodeSpec} from "../engine/types";
import manifest from "../handdrawn/handdrawn-manifest.json";

type HandDrawnAsset = {
  order: number;
  file: string;
  name: string;
  bytes: number;
};

const assets = manifest as HandDrawnAsset[];
const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;
const HOLD_SECONDS = 5;
const HOLD_FRAMES = FPS * HOLD_SECONDS;

const intents: ShotIntent[] = [
  "establish",
  "approach",
  "evidence",
  "detail",
  "escalate",
  "location",
  "resolve",
];

const focalPointFor = (index: number) => {
  // Keep a stable, deterministic focal point. The composition stays centered
  // unless a later planner revision explicitly adds per-image metadata.
  const cycle = index % 5;
  return [
    {x: 0.50, y: 0.48},
    {x: 0.52, y: 0.44},
    {x: 0.48, y: 0.52},
    {x: 0.55, y: 0.46},
    {x: 0.46, y: 0.50},
  ][cycle];
};

/**
 * The editorial contract is deliberately positional:
 * asset 01 -> shot 01, asset 02 -> shot 02, etc.
 * There is no semantic fallback and no random selection.
 */
export const buildHandDrawnSpec = (): DocumentaryEpisodeSpec => {
  if (assets.length === 0) {
    throw new Error(
      "[HandDrawnLongForm] No numbered assets are available. Run `npm run assets:prepare` after copying 01_..., 02_..., ... stills into public/handdrawn.",
    );
  }

  for (const [index, asset] of assets.entries()) {
    const expected = index + 1;
    if (asset.order !== expected) {
      throw new Error(
        `[HandDrawnLongForm] Asset sequence mismatch at index ${expected}: found order ${asset.order}. Run npm run assets:prepare and fix numbering.`,
      );
    }
  }

  return {
    fps: FPS,
    width: WIDTH,
    height: HEIGHT,
    shots: planEpisode(
      assets.map((asset, index) => ({
        id: `handdrawn-${String(asset.order).padStart(2, "0")}`,
        image: staticFile(asset.file),
        durationInFrames: HOLD_FRAMES,
        intent: intents[index % intents.length],
        focalPoint: focalPointFor(index),
      })),
    ),
  };
};

export const HAND_DRAWN_LONG_FORM_SPEC = buildHandDrawnSpec();
export const HAND_DRAWN_LONG_FORM_DURATION = HAND_DRAWN_LONG_FORM_SPEC.shots.reduce(
  (sum, shot) => sum + shot.durationInFrames,
  0,
);

export const HandDrawnLongForm: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: "#080808"}}>
    <DocumentaryEpisode spec={HAND_DRAWN_LONG_FORM_SPEC} />
  </AbsoluteFill>
);
