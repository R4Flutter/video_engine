import type {CSSProperties} from "react";
import type {EffectName} from "../types";

export type NormalizedPoint = {x: number; y: number};
export type DepthLayer = {src: string; depth: number; blur?: number; opacity?: number};

export type ShotCamera = {
  effect?: EffectName;
  target?: NormalizedPoint;
  scale?: number;
  panX?: number;
  panY?: number;
  rotate?: number;
  intensity?: 0.5 | 1 | 1.5 | 2;
};

export type ShotOverlay = {
  effect: EffectName;
  text?: string;
  image?: string;
  from?: number;
  durationInFrames?: number;
  delay?: number;
  intensity?: 0.5 | 1 | 1.5 | 2;
  config?: Record<string, unknown>;
};

export type DocumentaryShotSpec = {
  id: string;
  durationInFrames: number;
  image: string;
  nextImage?: string;
  focalPoint?: NormalizedPoint;
  camera?: ShotCamera;
  depth?: DepthLayer[];
  overlays?: ShotOverlay[];
  atmosphere?: {
    grain?: number;
    vignette?: number;
    dust?: number;
    mist?: number;
    lightLeak?: number;
  };
  backgroundColor?: string;
  style?: CSSProperties;
};

export type DocumentaryEpisodeSpec = {
  fps: 24 | 25 | 30 | 60;
  width: number;
  height: number;
  shots: DocumentaryShotSpec[];
};

export type RenderContract = {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  scenes: Array<{
    id: string;
    from: number;
    durationInFrames: number;
    media: {image: string; nextImage?: string};
    camera: ShotCamera;
    overlays: ShotOverlay[];
    depth: DepthLayer[];
  }>;
};
