import {AbsoluteFill, Img, Sequence, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import type {DocumentaryEpisodeSpec, DocumentaryShotSpec} from "./types";
import {Director} from "../animations/director";
import {AdvancedEffect} from "../animations/advanced/AdvancedEffect";

const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));

const CameraLayer: React.FC<{shot: DocumentaryShotSpec}> = ({shot}) => {
  const camera = shot.camera ?? {effect: "slowDrift" as const};
  const effect = camera.effect ?? "slowDrift";
  const target = camera.target ?? shot.focalPoint ?? {x: .5, y: .5};
  const cfg = {target, scale: camera.scale ?? 1.2, panX: camera.panX ?? 0, panY: camera.panY ?? 0, rotate: camera.rotate ?? 0};
  return <Director effect={effect} image={shot.image} durationInFrames={shot.durationInFrames} intensity={camera.intensity ?? 1} config={cfg} />;
};

const DepthLayerStack: React.FC<{shot: DocumentaryShotSpec}> = ({shot}) => {
  const frame = useCurrentFrame();
  const layers = shot.depth ?? [];
  if (layers.length < 2) return null;
  const progress = clamp(frame / Math.max(1, shot.durationInFrames));
  return <AbsoluteFill>
    {layers.map((layer, i) => {
      const depth = Math.max(.5, layer.depth);
      const drift = (depth - 1) * 24;
      const tx = interpolate(progress, [0, 1], [-drift, drift]);
      const ty = interpolate(progress, [0, 1], [drift * .25, -drift * .25]);
      const scale = 1 + (depth - 1) * .7;
      return <Img key={`${layer.src}-${i}`} src={layer.src} style={{position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", transform:`translate(${tx}px,${ty}px) scale(${scale})`, filter: layer.blur ? `blur(${layer.blur}px)` : undefined, opacity: layer.opacity ?? 1, zIndex:i}} />;
    })}
  </AbsoluteFill>;
};

export const CinematicShot: React.FC<{shot: DocumentaryShotSpec}> = ({shot}) => {
  const cameraEffect = shot.camera?.effect;
  const useDepth = Boolean(shot.depth && shot.depth.length >= 2);
  const camera = useDepth ? <DepthLayerStack shot={shot}/> : <CameraLayer shot={shot}/>;
  return <AbsoluteFill style={{backgroundColor: shot.backgroundColor ?? "#080808", ...shot.style}}>
    {camera}
    {shot.atmosphere?.vignette ? <Director effect="vignette" intensity={1.5} config={{opacity: clamp(shot.atmosphere.vignette)}} /> : null}
    {shot.atmosphere?.grain ? <Director effect="grain" intensity={1} style={{opacity: clamp(shot.atmosphere.grain)}} /> : null}
    {shot.atmosphere?.dust ? <Director effect="dust" intensity={1} style={{opacity: clamp(shot.atmosphere.dust)}} /> : null}
    {shot.atmosphere?.mist ? <Director effect="mist" intensity={1} style={{opacity: clamp(shot.atmosphere.mist)}} /> : null}
    {shot.atmosphere?.lightLeak ? <Director effect="lightLeak" intensity={1} style={{opacity: clamp(shot.atmosphere.lightLeak)}} /> : null}
    {shot.overlays?.map((overlay, i) => <Sequence key={`${overlay.effect}-${i}`} from={overlay.from ?? 0} durationInFrames={overlay.durationInFrames ?? shot.durationInFrames}>
      <AdvancedEffect effect={overlay.effect} image={overlay.image ?? shot.image} durationInFrames={overlay.durationInFrames ?? shot.durationInFrames} delay={overlay.delay} intensity={overlay.intensity ?? 1} config={{...(overlay.config ?? {}), ...(overlay.text ? {text: overlay.text} : {})}} />
    </Sequence>)}
    {cameraEffect === "staticHold" && <div style={{position:"absolute", inset:0, background:"rgba(255,255,255,.015)"}} />}
  </AbsoluteFill>;
};

export const DocumentaryEpisode: React.FC<{spec: DocumentaryEpisodeSpec}> = ({spec}) => {
  const starts: number[] = [];
  let cursor = 0;
  for (const shot of spec.shots) { starts.push(cursor); cursor += shot.durationInFrames; }
  return <AbsoluteFill style={{backgroundColor:"#000"}}>
    {spec.shots.map((shot, i) => <Sequence key={shot.id} from={starts[i]} durationInFrames={shot.durationInFrames}><CinematicShot shot={shot}/></Sequence>)}
  </AbsoluteFill>;
};

export const buildRenderContract = (spec: DocumentaryEpisodeSpec) => {
  let cursor = 0;
  const scenes = spec.shots.map((shot) => {
    const scene = {id:shot.id, from:cursor, durationInFrames:shot.durationInFrames, media:{image:shot.image, nextImage:shot.nextImage}, camera:shot.camera ?? {}, overlays:shot.overlays ?? [], depth:shot.depth ?? []};
    cursor += shot.durationInFrames;
    return scene;
  });
  return {width:spec.width, height:spec.height, fps:spec.fps, durationInFrames:cursor, scenes};
};
