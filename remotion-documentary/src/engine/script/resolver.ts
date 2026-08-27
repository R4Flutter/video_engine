import type {EffectName} from "../../types";
import type {DocumentaryShotSpec, ShotIntent} from "../types";
import type {DocumentaryScript, ResolvedDocumentaryScript, ResolvedScene, ResolvedVisual, ScriptRenderContract, ScriptScene, ScriptVisual} from "./types";

const EFFECT_ALIASES: Record<string, EffectName> = {
  pushin: "pushIn", "push-in": "pushIn", push: "pushIn",
  pullout: "pullOut", "pull-out": "pullOut", pull: "pullOut",
  fadein: "fadeIn", "fade-in": "fadeIn",
  fadeout: "fadeOut", "fade-out": "fadeOut",
  panleft: "panLeft", "pan-left": "panLeft",
  panright: "panRight", "pan-right": "panRight",
  panup: "panUp", "pan-up": "panUp",
  pandown: "panDown", "pan-down": "panDown",
  drift: "slowDrift", slowdrift: "slowDrift", "slow-drift": "slowDrift",
  zoom: "pushIn", zoomin: "pushIn", "zoom-in": "pushIn",
  zoomout: "pullOut", "zoom-out": "pullOut",
  parallax: "twoLayerParallax", "2.5d": "threeLayerParallax",
  handheld: "handheld", shake: "cameraShake",
  document: "documentReveal", newspaper: "newspaperZoom",
  spotlight: "spotlight", focus: "focusPull",
};

const KNOWN_EFFECTS = new Set<string>();

export const registerKnownEffects = (effects: readonly string[]) => {
  for (const effect of effects) KNOWN_EFFECTS.add(effect);
};

const normalizeEffectKey = (effect: string) => effect.trim().replace(/\s+/g, "").toLowerCase();

export const resolveEffectName = (effect?: string): EffectName => {
  if (!effect) return "staticHold";
  const key = normalizeEffectKey(effect);
  const alias = EFFECT_ALIASES[key];
  if (alias) return alias;
  if (KNOWN_EFFECTS.has(effect)) return effect as EffectName;
  throw new Error(`[script] Unknown shot/effect "${effect}". Use a registered EffectName or a supported alias.`);
};

const asDuration = (value: unknown, fallback: number) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return fallback;
  return Math.max(1, Math.round(value));
};

const isPoint = (value: unknown): value is {x: number; y: number} => {
  if (!value || typeof value !== "object") return false;
  const point = value as Record<string, unknown>;
  return typeof point.x === "number" && typeof point.y === "number";
};

const defaultDurationFor = (shot: EffectName) => {
  if (["fadeIn", "fadeOut", "fadeInScale", "fadeInBlur"].includes(shot)) return 24;
  if (["staticHold", "microBreathing"].includes(shot)) return 150;
  if (["handheld", "cameraShake", "rapidZoom", "flash"].includes(shot)) return 45;
  return 90;
};

export const resolveVisual = (visual: ScriptVisual, sceneDuration: number): ResolvedVisual => {
  if (!visual.image || typeof visual.image !== "string") {
    throw new Error("[script] Every visual requires an image path/URL.");
  }
  const requested = visual.shot ?? visual.effect;
  const shot = resolveEffectName(requested);
  const duration = Math.min(asDuration(visual.duration, defaultDurationFor(shot)), sceneDuration);
  const focalPoint = visual.focalPoint && isPoint(visual.focalPoint) ? visual.focalPoint : undefined;
  return {
    ...visual,
    shot,
    duration,
    focalPoint,
  };
};

export const resolveScene = (scene: ScriptScene): ResolvedScene => {
  if (!scene.id?.trim()) throw new Error("[script] Every scene requires a non-empty id.");
  if (!scene.visuals?.length) throw new Error(`[script] Scene "${scene.id}" has no visuals.`);
  const requestedSceneDuration = asDuration(scene.duration, 150);
  const visuals = scene.visuals.map((visual) => resolveVisual(visual, requestedSceneDuration));
  const duration = Math.max(requestedSceneDuration, visuals.reduce((sum, visual) => sum + visual.duration, 0));
  return {
    id: scene.id,
    narration: scene.narration ?? "",
    visuals,
    duration,
  };
};

export const resolveScript = (script: DocumentaryScript): ResolvedDocumentaryScript => {
  if (!script.scenes?.length) throw new Error("[script] Script requires at least one scene.");
  const scenes = script.scenes.map(resolveScene);
  const ids = new Set<string>();
  for (const scene of scenes) {
    if (ids.has(scene.id)) throw new Error(`[script] Duplicate scene id "${scene.id}".`);
    ids.add(scene.id);
  }
  return {
    fps: script.fps ?? 30,
    width: script.width ?? 1920,
    height: script.height ?? 1080,
    scenes,
  };
};

export const toRenderContract = (script: ResolvedDocumentaryScript): ScriptRenderContract => {
  let cursor = 0;
  const scenes = script.scenes.map((scene) => {
    const from = cursor;
    let local = 0;
    const visuals = scene.visuals.map((visual) => {
      const item = {
        image: visual.image,
        shot: visual.shot,
        from: local,
        durationInFrames: visual.duration,
        ...(visual.config ? {config: visual.config} : {}),
      };
      local += visual.duration;
      return item;
    });
    cursor += scene.duration;
    return {id: scene.id, from, durationInFrames: scene.duration, visuals};
  });
  return {width: script.width, height: script.height, fps: script.fps, durationInFrames: cursor, scenes};
};

export const intentToEffect = (intent: ShotIntent): EffectName => {
  const map: Record<ShotIntent, EffectName> = {
    establish: "slowDrift",
    approach: "pushIn",
    evidence: "detailReveal",
    portrait: "faceReframe",
    detail: "objectReframe",
    location: "mapPushIn",
    escalate: "rapidZoom",
    resolve: "pullOut",
  };
  return map[intent];
};

export const scriptVisualToShotSpec = (sceneId: string, visual: ResolvedVisual, index: number): DocumentaryShotSpec => ({
  id: `${sceneId}-visual-${index + 1}`,
  image: visual.image,
  durationInFrames: visual.duration,
  focalPoint: visual.focalPoint,
  camera: {effect: visual.shot, target: visual.focalPoint, intensity: 1, ...(visual.config as Record<string, unknown> ?? {})},
  overlays: [],
});
