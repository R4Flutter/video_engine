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
const HOLD_FRAMES = FPS * 5;

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
 * Positional editorial contract:
 * asset 01 -> shot 01, asset 02 -> shot 02, etc.
 * There is no semantic fallback, random selection, or generated placeholder.
 */
export const buildHandDrawnSpec = (): DocumentaryEpisodeSpec => ({
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
});

export const HAND_DRAWN_LONG_FORM_SPEC = buildHandDrawnSpec();
export const HAND_DRAWN_LONG_FORM_DURATION = Math.max(
  1,
  HAND_DRAWN_LONG_FORM_SPEC.shots.reduce((sum, shot) => sum + shot.durationInFrames, 0),
);

const validateAssetSequence = () => {
  if (assets.length === 0) {
    return "No numbered hand-drawn assets found. Copy 01_..., 02_..., ... into public/handdrawn and run npm run assets:prepare.";
  }
  const mismatch = assets.find((asset, index) => asset.order !== index + 1);
  return mismatch
    ? `Asset sequence is invalid at ${String(mismatch.order).padStart(2, "0")}. Run npm run assets:prepare and fix numbering.`
    : null;
};

export const HandDrawnLongForm: React.FC = () => {
  const error = validateAssetSequence();
  if (error) {
    return (
      <AbsoluteFill style={{backgroundColor: "#080808", color: "#f4f1ea", alignItems: "center", justifyContent: "center", padding: 80, fontFamily: "Arial"}}>
        <div style={{maxWidth: 840, textAlign: "center", fontSize: 40, lineHeight: 1.35}}>{error}</div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{backgroundColor: "#080808"}}>
      <DocumentaryEpisode spec={HAND_DRAWN_LONG_FORM_SPEC} />
    </AbsoluteFill>
  );
};
