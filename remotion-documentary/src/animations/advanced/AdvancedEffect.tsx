import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { BaseEffectProps } from "../../types";
import { cinema, easeInOutSine, easeOutBack, easeOutExpo } from "../timing/easings";

type Config = Record<string, unknown>;

type Point = { x: number; y: number };

const num = (value: unknown, fallback: number): number => {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
};

const str = (value: unknown, fallback: string): string => {
  return typeof value === "string" ? value : fallback;
};

const point = (value: unknown, fallback: Point): Point => {
  if (typeof value === "object" && value !== null) {
    const v = value as Record<string, unknown>;
    return { x: num(v.x, fallback.x), y: num(v.y, fallback.y) };
  }
  return fallback;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const regionClip = (target: Point, size: number): string => {
  const left = clamp01(target.x - size / 2) * 100;
  const top = clamp01(target.y - size / 2) * 100;
  const right = clamp01(target.x + size / 2) * 100;
  const bottom = clamp01(target.y + size / 2) * 100;
  return `inset(${top}% ${100 - right}% ${100 - bottom}% ${left}%)`;
};

const imageStyle = (transform: string, extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  transform,
  transformOrigin: "center center",
  willChange: "transform, opacity, filter",
  ...extra,
});

const AdvancedText: React.FC<{ effect: string; text?: string; config: Config; t: number; intensity: number }> = ({ effect, text = "DOCUMENTARY", config, t, intensity }) => {
  const fontSize = num(config.fontSize, effect === "fullScreenStatement" ? 112 : 64) * (effect === "oversizedNumber" ? 1.35 : 1);
  const color = str(config.color, "#ffffff");
  const x = num(config.x, 0.5) * 100;
  const y = num(config.y, 0.5) * 100;
  const weight = Math.round(num(config.fontWeight, effect === "fullScreenStatement" ? 800 : 700));
  const family = str(config.fontFamily, "Inter, Arial, sans-serif");
  const words = text.split(/(\s+)/);
  const chars = Array.from(text);
  const p = cinema(clamp01(t));
  let transform = "translate(-50%, -50%)";
  let opacity = 1;
  let filter = "none";
  let letterSpacing = str(config.letterSpacing, effect === "trackingAnimation" ? "0.18em" : "-0.02em");
  let decoration: React.CSSProperties["textDecoration"] = undefined;
  let clipPath: string | undefined;

  if (["textFade"].includes(effect)) opacity = p;
  if (["textSlide"].includes(effect)) transform = `translate(${interpolate(p, [-1, 0], [-100, -50])}%, -50%)`;
  if (["textRise", "textDrop"].includes(effect)) {
    const sign = effect === "textRise" ? 1 : -1;
    transform = `translate(-50%, ${-50 - sign * interpolate(p, [0, 1], [18, 0])}%)`;
    opacity = p;
  }
  if (["textScale", "oversizedNumber"].includes(effect)) {
    const s = interpolate(easeOutBack(clamp01(p)), [0, 1], [0.72, 1]);
    transform = `translate(-50%, -50%) scale(${s})`;
    opacity = clamp01(p * 1.4);
  }
  if (effect === "textBlurSharp") filter = `blur(${interpolate(p, [0, 1], [12, 0])}px)`;
  if (effect === "splitTypography" || effect === "textCollision" || effect === "textStacking") {
    const yShift = interpolate(easeOutExpo(clamp01(p)), [0, 1], [effect === "textDrop" ? -80 : 80, 0]);
    transform = `translate(-50%, calc(-50% + ${yShift}px))`;
  }
  if (effect === "letterSpacingAnimation" || effect === "trackingAnimation") {
    letterSpacing = `${interpolate(p, [0, 1], [0.55, 0.08]) * (effect === "trackingAnimation" ? 1 : 1)}em`;
  }
  if (effect === "weightChange") weight = Math.round(interpolate(p, [0, 1], [300, num(config.fontWeight, 900)]));
  if (effect === "underlineDraw" || effect === "strikeThrough") decoration = effect === "underlineDraw" ? "underline" : "line-through";
  if (effect === "highlightSweep") {
    clipPath = `inset(0 ${100 - p * 100}% 0 0)`;
  }
  if (effect === "textDisplacement") transform = `translate(calc(-50% + ${Math.sin(t * Math.PI * 8) * intensity * 3}px), -50%)`;
  if (effect === "textSnapping") transform = `translate(calc(-50% + ${Math.round((1 - p) * 14)}px), -50%) scale(${1 + (1 - p) * 0.04})`;

  const renderChars = effect === "charByChar";
  const renderWords = effect === "wordByWord";
  const visibleCount = renderChars ? Math.ceil(chars.length * p) : renderWords ? Math.ceil(words.length * p) : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        color,
        fontFamily: family,
        fontSize,
        fontWeight: weight,
        lineHeight: 0.95,
        textAlign: (config.textAlign as React.CSSProperties["textAlign"]) ?? "center",
        letterSpacing,
        opacity,
        filter,
        transform,
        textDecoration: decoration,
        whiteSpace: "pre-wrap",
        maxWidth: "92%",
        clipPath,
        textShadow: effect === "highlightSweep" ? "0 4px 30px rgba(0,0,0,.45)" : undefined,
      }}
    >
      {renderChars ? chars.slice(0, visibleCount).join("") : renderWords ? words.slice(0, visibleCount).join("") : text}
      {effect === "highlightSweep" ? (
        <span style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", background: str(config.highlight, "rgba(255,215,64,.32)"), mixBlendMode: "screen", pointerEvents: "none" }} />
      ) : null}
    </div>
  );
};

export const AdvancedEffect: React.FC<BaseEffectProps & { config?: Config; effect?: string }> = ({
  image,
  children,
  durationInFrames = 90,
  delay = 0,
  intensity = 1,
  style,
  className,
  config = {},
  effect = "",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const local = frame - delay;
  const t = clamp01(local / Math.max(1, durationInFrames));
  const p = cinema(t);
  const src = typeof image === "string" ? image : undefined;
  const nextImage = str(config.nextImage, "");
  const target = point(config.target, { x: num(config.x, 0.5), y: num(config.y, 0.5) });
  const targetScale = num(config.scale, 1.24 + intensity * 0.08);
  const panX = num(config.panX, 0);
  const panY = num(config.panY, 0);
  const accent = str(config.accent, "#ff3b30");

  const camera = (): React.ReactNode => {
    let x = 0;
    let y = 0;
    let scale = 1;
    let rotate = 0;
    if (effect.includes("Pan")) {
      if (effect.includes("Left")) x = interpolate(p, [0, 1], [panX || 3, -(panX || 3)]);
      else if (effect.includes("Right")) x = interpolate(p, [0, 1], [-(panX || 3), panX || 3]);
      else x = panX * (p * 2 - 1);
    }
    if (effect.includes("zoomTransition") || effect.includes("zoomThrough")) scale = interpolate(p, [0, 0.68, 1], [1, 1.42, 1.08]);
    else if (["extremeCloseUp", "detailShot", "moneyCrop", "faceCrop", "objectCrop", "documentCrop", "logoCrop", "computerCrop", "graphCrop"].includes(effect)) scale = interpolate(p, [0, 1], [1.02, targetScale]);
    else if (["wideShot"].includes(effect)) scale = interpolate(p, [0, 1], [1.12, 1]);
    else if (effect === "mediumShot") scale = interpolate(p, [0, 1], [1.06, 1.01]);
    else if (["detailReveal", "backgroundCrop"].includes(effect)) scale = interpolate(p, [0, 1], [1.02, 1.18]);
    if (effect === "paperReveal" || effect === "newspaperSlide") x = interpolate(p, [0, 1], [-18, 0]);
    if (effect === "documentStack") rotate = interpolate(p, [0, 1], [-3, 0]);
    return (
      <Img
        src={src ?? ""}
        style={imageStyle(`translate(${x}%, ${y}%) scale(${scale}) rotate(${rotate}deg)`)}
      />
    );
  };

  const transitionNames = new Set([
    "crossfade", "hardCut", "matchCut", "transitionDipToBlack", "transitionDipToWhite", "whipPan", "zoomTransition", "blurTransition", "lightFlash", "filmBurn", "paperWipe", "newspaperWipe", "documentWipe", "shapeWipe", "maskTransition", "imageMorph", "filmBurnReveal", "lightLeakReveal",
  ]);
  const textNames = new Set([
    "textFade", "textSlide", "textRise", "textDrop", "textScale", "textBlurSharp", "typewriter", "charByChar", "wordByWord", "lineByLine", "textMaskReveal", "textWipeReveal", "kinetic", "wordEmphasis", "numberEmphasis", "oversizedNumber", "fullScreenStatement", "splitTypography", "trackingAnimation", "letterSpacingAnimation", "weightChange", "highlightSweep", "underlineDraw", "strikeThrough", "textDisplacement", "textStagger", "textStacking", "textCollision", "textSnapping",
  ]);
  const focusNames = new Set(["spotlight", "circularSpotlight", "darkenSurroundings", "blurSurroundings", "brightenSubject", "colorIsolate", "outlineSubject", "glowSubject", "zoomSubject", "movingSpotlight", "magnifyingGlass", "focusPull"]);
  const docNames = new Set(["newspaperSlide", "newspaperZoom", "headlineHighlight", "articleCrop", "docTextUnderline", "redCircle", "documentStack", "paperShuffle", "paperTear", "documentReveal", "photocopyEffect", "archiveEffect", "stampAnimation", "dateStamp", "filingCard"]);
  const mapNames = new Set(["locationPin", "pinDrop", "routeDrawing", "countryHighlight", "cityHighlight", "connectionLines", "flightPath", "expansion", "marketSpread", "geographicZoom", "mapPushIn"]);

  if (textNames.has(effect)) {
    return <AbsoluteFill style={style} className={className}><AdvancedText effect={effect} text={str(config.text, (config as Config).label as string || "DOCUMENTARY")} config={config} t={t} intensity={intensity} />{children}</AbsoluteFill>;
  }

  if (transitionNames.has(effect)) {
    const wipe = clamp01(t);
    const black = effect.includes("DipToBlack") ? 1 : effect.includes("DipToWhite") ? 1 : 0;
    const nextOpacity = nextImage && effect !== "hardCut" ? wipe : 0;
    const oldStyle: React.CSSProperties = imageStyle(effect === "whipPan" ? `translateX(${interpolate(p, [0, 1], [0, -18])}%)` : effect === "zoomTransition" ? `scale(${interpolate(p, [0, .8, 1], [1, 1.48, 1])})` : "scale(1)", { opacity: nextImage ? 1 - nextOpacity : 1 });
    const reveal = effect.includes("Wipe") || effect === "maskTransition" ? `inset(0 ${100 - wipe * 100}% 0 0)` : undefined;
    return <AbsoluteFill style={style} className={className}>
      <Img src={src ?? ""} style={{ ...oldStyle, filter: effect === "blurTransition" ? `blur(${interpolate(p, [0, .5, 1], [0, 10, 0])}px)` : undefined }} />
      {nextImage ? <Img src={nextImage} style={{ ...imageStyle("scale(1)", { opacity: nextOpacity }), clipPath: reveal }} /> : null}
      {effect === "lightFlash" || effect === "filmBurn" || effect === "filmBurnReveal" || effect === "lightLeakReveal" ? <div style={{ position: "absolute", inset: 0, background: effect.startsWith("light") ? "radial-gradient(circle at 70% 30%, rgba(255,246,180,.95), rgba(255,120,30,.08) 38%, transparent 62%)" : "linear-gradient(135deg, rgba(255,180,90,.95), transparent 48%, rgba(255,230,180,.75))", opacity: interpolate(p, [0, .35, 1], [0, 1, 0]), mixBlendMode: "screen" }} /> : null}
      {black ? <div style={{ position: "absolute", inset: 0, background: effect.includes("White") ? "#fff" : "#000", opacity: interpolate(p, [0, .5, 1], [0, 1, 0]) }} /> : null}
      {effect === "hardCut" || effect === "matchCut" ? null : children}
    </AbsoluteFill>;
  }

  if (focusNames.has(effect)) {
    const blur = effect === "blurSurroundings" ? interpolate(p, [0, 1], [0, 8]) : effect === "focusPull" ? interpolate(p, [0, .5, 1], [6, 0, 6]) : 0;
    const baseFilter = effect === "darkenSurroundings" ? `brightness(${interpolate(p, [0, 1], [1, .48])})` : effect === "brightenSubject" ? `brightness(${interpolate(p, [0, 1], [1, 1.45])})` : effect === "colorIsolate" ? `grayscale(${interpolate(p, [0, 1], [0, 1])})` : blur ? `blur(${blur}px)` : undefined;
    const size = num(config.size, effect === "circularSpotlight" ? 0.34 : 0.42);
    return <AbsoluteFill style={style} className={className}>
      <Img src={src ?? ""} style={imageStyle("scale(1.04)", { filter: baseFilter })} />
      {effect !== "blurSurroundings" && effect !== "darkenSurroundings" && effect !== "colorIsolate" ? <Img src={src ?? ""} style={imageStyle("scale(1.04)", { clipPath: effect === "circularSpotlight" ? `circle(${size * 100}% at ${target.x * 100}% ${target.y * 100}%)` : regionClip(target, size), filter: effect === "glowSubject" ? "brightness(1.25) saturate(1.1)" : undefined, opacity: p })} /> : null}
      {(effect === "spotlight" || effect === "movingSpotlight" || effect === "circularSpotlight") ? <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at ${target.x * 100}% ${target.y * 100}%, transparent 0 10%, rgba(0,0,0,.60) ${Math.max(12, size * 100)}%, rgba(0,0,0,.78) 100%)`, opacity: p }} /> : null}
      {effect === "outlineSubject" ? <div style={{ position: "absolute", left: `${target.x * 100}%`, top: `${target.y * 100}%`, width: `${size * 100}%`, height: `${size * 100}%`, transform: "translate(-50%,-50%)", border: `3px solid ${accent}`, borderRadius: effect === "circularSpotlight" ? "50%" : 20, boxShadow: `0 0 28px ${accent}99`, opacity: p }} /> : null}
      {effect === "magnifyingGlass" ? <div style={{ position: "absolute", left: `${target.x * 100}%`, top: `${target.y * 100}%`, width: `${size * 60}%`, aspectRatio: "1", transform: `translate(-50%,-50%) scale(${interpolate(p, [0,1], [.75,1])})`, borderRadius: "50%", border: `4px solid ${accent}`, background: `url(${src ?? ""}) center / ${160 + p * 30}% no-repeat`, boxShadow: "0 12px 36px rgba(0,0,0,.5)" }} /> : null}
      {children}
    </AbsoluteFill>;
  }

  if (docNames.has(effect)) {
    const rotation = interpolate(p, [0, 1], [-5, 0]);
    const paperScale = interpolate(p, [0, 1], [.94, 1]);
    const highlight = num(config.highlightY, .52);
    const underline = num(config.underlineY, highlight);
    return <AbsoluteFill style={style} className={className}>
      <Img src={src ?? ""} style={imageStyle(`scale(${paperScale}) rotate(${rotation}deg)`)} />
      <div style={{ position: "absolute", left: "11%", right: "11%", top: `${highlight * 100}%`, height: 42, transform: "translateY(-50%)", background: "rgba(255,220,40,.28)", opacity: effect === "headlineHighlight" || effect === "documentReveal" ? p : 0 }} />
      <div style={{ position: "absolute", left: "12%", width: "32%", top: `${underline * 100}%`, height: 5, background: accent, transformOrigin: "left center", transform: `scaleX(${p})`, opacity: effect === "docTextUnderline" ? 1 : 0 }} />
      {effect === "redCircle" ? <div style={{ position: "absolute", left: `${target.x * 100}%`, top: `${target.y * 100}%`, width: `${num(config.size,.24) * 100}%`, height: `${num(config.size,.24) * 100}%`, transform: `translate(-50%,-50%) rotate(-6deg) scale(${interpolate(p,[0,1],[.7,1])})`, border: `5px solid ${accent}`, borderRadius: "50%", opacity: p }} /> : null}
      {effect === "stampAnimation" || effect === "dateStamp" ? <div style={{ position: "absolute", right: "11%", bottom: "12%", border: `3px solid ${accent}`, color: accent, padding: "8px 14px", fontFamily: "ui-monospace, monospace", fontWeight: 800, letterSpacing: ".16em", transform: `rotate(-6deg) scale(${interpolate(p,[0,1],[1.35,1])})`, opacity: p }}>{str(config.text, effect === "dateStamp" ? "1977" : "VERIFIED")}</div> : null}
      {effect === "paperTear" ? <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, transparent 46%, rgba(255,255,255,.95) 47% 50%, transparent 51%)", transform: `translateX(${interpolate(p,[0,1],[-100,0])}%)`, opacity: .9 }} /> : null}
      {children}
    </AbsoluteFill>;
  }

  if (mapNames.has(effect)) {
    const x = target.x * width;
    const y = target.y * height;
    const ex = num(config.endX, .78) * width;
    const ey = num(config.endY, .32) * height;
    const d = `M ${x} ${y} C ${x + (ex-x)*.35} ${y-90} ${ex - (ex-x)*.35} ${ey+90} ${ex} ${ey}`;
    return <AbsoluteFill style={style} className={className}>
      <Img src={src ?? ""} style={imageStyle(`scale(${interpolate(p,[0,1],[1.02,1.12])})`)} />
      {effect !== "countryHighlight" && effect !== "cityHighlight" ? <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path d={d} fill="none" stroke={accent} strokeWidth={4} strokeLinecap="round" strokeDasharray="12 10" strokeDashoffset={interpolate(p,[0,1],[220,0])} opacity={effect === "routeDrawing" || effect === "flightPath" || effect === "connectionLines" ? 1 : .35} />
      </svg> : null}
      <div style={{ position: "absolute", left: `${target.x*100}%`, top: `${target.y*100}%`, width: 18, height: 18, borderRadius: "50%", background: accent, boxShadow: `0 0 0 8px ${accent}33, 0 0 24px ${accent}88`, transform: `translate(-50%,-50%) scale(${interpolate(easeOutBack(p),[0,1],[.2,1])})`, opacity: p }} />
      {effect === "countryHighlight" || effect === "cityHighlight" ? <div style={{ position: "absolute", left: `${target.x*100-9}%`, top: `${target.y*100-8}%`, width: "18%", height: "24%", borderRadius: "46% 54% 52% 48% / 42% 44% 56% 58%", background: `${accent}40`, border: `3px solid ${accent}`, opacity: p }} /> : null}
      {children}
    </AbsoluteFill>;
  }

  if (effect === "faceCrop" || effect === "objectCrop" || effect === "documentCrop" || effect === "logoCrop" || effect === "moneyCrop" || effect === "computerCrop" || effect === "graphCrop" || effect === "backgroundCrop" || effect === "extremeCloseUp" || effect === "wideShot" || effect === "mediumShot" || effect === "detailShot") {
    const crop = num(config.cropScale, effect === "extremeCloseUp" ? 1.6 : targetScale);
    const tx = interpolate(p, [0, 1], [0, (0.5 - target.x) * 28]);
    const ty = interpolate(p, [0, 1], [0, (0.5 - target.y) * 28]);
    return <AbsoluteFill style={style} className={className}>
      <Img src={src ?? ""} style={imageStyle(`translate(${tx}%, ${ty}%) scale(${interpolate(p,[0,1],[1,crop])})`)} />
      {children}
    </AbsoluteFill>;
  }

  // Generic visual fallthrough: real, deterministic motion rather than a dead placeholder.
  const generic = camera();
  return <AbsoluteFill style={style} className={className}>{generic}{children}</AbsoluteFill>;
};
