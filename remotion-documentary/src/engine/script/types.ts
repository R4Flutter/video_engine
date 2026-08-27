import type {EffectName} from "../../types";
import type {DocumentaryShotSpec, ShotIntent} from "../types";

export type ScriptVisual = {
  image: string;
  shot?: EffectName;
  effect?: EffectName;
  duration?: number;
  intent?: ShotIntent;
  focalPoint?: {x: number; y: number};
  title?: string;
  text?: string;
  accent?: string;
  config?: Record<string, unknown>;
};

export type ScriptScene = {
  id: string;
  narration?: string;
  duration?: number;
  visuals: ScriptVisual[];
};

export type DocumentaryScript = {
  fps?: 24 | 25 | 30 | 60;
  width?: number;
  height?: number;
  scenes: ScriptScene[];
};

export type ResolvedVisual = ScriptVisual & {
  shot: EffectName;
  duration: number;
};

export type ResolvedScene = {
  id: string;
  narration: string;
  visuals: ResolvedVisual[];
  duration: number;
};

export type ResolvedDocumentaryScript = {
  fps: 24 | 25 | 30 | 60;
  width: number;
  height: number;
  scenes: ResolvedScene[];
};

export type ScriptRenderContract = {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  scenes: Array<{
    id: string;
    from: number;
    durationInFrames: number;
    visuals: Array<{
      image: string;
      shot: EffectName;
      from: number;
      durationInFrames: number;
      config?: Record<string, unknown>;
    }>;
  }>;
};

export type {DocumentaryShotSpec};
