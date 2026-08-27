import type {DocumentaryEpisodeSpec, DocumentaryShotSpec, RenderContract} from "../engine/types";

export type ValidationIssue = {severity:"fatal"|"warning"; code:string; message:string; shotId?:string};

const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const exists = (s: string) => typeof s === "string" && s.trim().length > 0;

export const validateShot = (shot: DocumentaryShotSpec): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  if (!exists(shot.id)) issues.push({severity:"fatal",code:"SHOT_ID_EMPTY",message:"Shot id is required."});
  if (!exists(shot.image)) issues.push({severity:"fatal",code:"IMAGE_MISSING",message:"Shot image is required.",shotId:shot.id});
  if (!finite(shot.durationInFrames) || shot.durationInFrames < 1) issues.push({severity:"fatal",code:"DURATION_INVALID",message:"durationInFrames must be >= 1.",shotId:shot.id});
  const f = shot.focalPoint;
  if (f && (!finite(f.x) || !finite(f.y) || f.x < 0 || f.x > 1 || f.y < 0 || f.y > 1)) issues.push({severity:"fatal",code:"FOCAL_POINT_INVALID",message:"focalPoint must be normalized 0..1.",shotId:shot.id});
  if ((shot.depth?.length ?? 0) === 1) issues.push({severity:"warning",code:"DEPTH_STACK_WEAK",message:"A depth stack with one layer adds no parallax benefit.",shotId:shot.id});
  for (const overlay of shot.overlays ?? []) {
    if (!exists(overlay.effect)) issues.push({severity:"fatal",code:"OVERLAY_EFFECT_EMPTY",message:"Overlay effect is required.",shotId:shot.id});
    if (overlay.from !== undefined && (!finite(overlay.from) || overlay.from < 0)) issues.push({severity:"fatal",code:"OVERLAY_START_INVALID",message:"Overlay start frame is invalid.",shotId:shot.id});
    if (overlay.durationInFrames !== undefined && (!finite(overlay.durationInFrames) || overlay.durationInFrames < 1)) issues.push({severity:"fatal",code:"OVERLAY_DURATION_INVALID",message:"Overlay duration is invalid.",shotId:shot.id});
  }
  return issues;
};

export const validateEpisode = (spec: DocumentaryEpisodeSpec): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  if (![24,25,30,60].includes(spec.fps)) issues.push({severity:"fatal",code:"FPS_INVALID",message:"fps must be 24, 25, 30 or 60."});
  if (!finite(spec.width) || spec.width < 640 || !finite(spec.height) || spec.height < 360) issues.push({severity:"fatal",code:"DIMENSIONS_INVALID",message:"Output dimensions are too small or invalid."});
  if (spec.shots.length === 0) issues.push({severity:"fatal",code:"NO_SHOTS",message:"At least one shot is required."});
  const ids = new Set<string>();
  for (const shot of spec.shots) {
    if (ids.has(shot.id)) issues.push({severity:"fatal",code:"DUPLICATE_SHOT_ID",message:`Duplicate shot id: ${shot.id}`,shotId:shot.id});
    ids.add(shot.id);
    issues.push(...validateShot(shot));
  }
  return issues;
};

export const validateRenderContract = (contract: RenderContract): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  if (!finite(contract.durationInFrames) || contract.durationInFrames <= 0) issues.push({severity:"fatal",code:"CONTRACT_DURATION_INVALID",message:"Render contract has no positive duration."});
  let previousEnd = 0;
  for (const scene of contract.scenes) {
    if (scene.from < previousEnd) issues.push({severity:"fatal",code:"SCENE_OVERLAP",message:`Scene ${scene.id} overlaps a previous scene.`,shotId:scene.id});
    previousEnd = scene.from + scene.durationInFrames;
    if (!exists(scene.media.image)) issues.push({severity:"fatal",code:"SCENE_IMAGE_MISSING",message:`Scene ${scene.id} has no image.`,shotId:scene.id});
  }
  if (previousEnd !== contract.durationInFrames) issues.push({severity:"fatal",code:"CONTRACT_TIMELINE_MISMATCH",message:"Scene timeline does not equal contract duration."});
  return issues;
};
