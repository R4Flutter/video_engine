import type { EffectName } from "../types";

/**
 * All 270 EffectName entries, in registry order, grouped into 18 categories
 * for the master Showcase. The order is the canonical order from the
 * `EffectName` union in `src/types.ts` — keep these slices in sync if
 * you ever reorder the union.
 *
 * Used by `Showcase.tsx` to lay out a 2×4 grid that pages through every
 * effect with a 15-frame section divider between categories.
 */
export const CATEGORIES: ReadonlyArray<{
  readonly name: string;
  readonly effects: ReadonlyArray<EffectName>;
}> = [
  { name: "CAMERA", effects: [
    "pushIn", "pullOut", "panLeft", "panRight", "panUp", "panDown",
    "diagonalPan", "slowDrift", "staticHold", "microBreathing",
    "pushPanLeft", "pushPanRight", "pullPan", "pushTilt", "diagonalPush",
    "cornerToCorner", "subjectReframe", "faceReframe", "objectReframe",
    "detailReveal",
  ]},
  { name: "PARALLAX", effects: [
    "twoLayerParallax", "threeLayerParallax", "multiLayerParallax",
    "depthBasedZoom", "foregroundDrift", "backgroundDrift", "dolly",
    "perspectiveShift", "depthOfField", "foregroundBlur", "backgroundBlur",
    "rackFocus",
  ]},
  { name: "IMAGE-ENTRANCE", effects: [
    "fadeIn", "fadeInScale", "fadeInBlur", "slideInLeft", "slideInRight",
    "slideInTop", "slideInBottom", "scaleIn", "maskReveal", "wipeReveal",
    "circularReveal", "diagonalReveal", "paperReveal", "filmBurnReveal",
    "lightLeakReveal", "focusReveal",
  ]},
  { name: "IMAGE-EXIT", effects: [
    "fadeOut", "scaleOut", "blurOut", "slideOutLeft", "slideOutRight",
    "slideOutUp", "slideOutDown", "maskClose", "zoomThrough", "pullAway",
    "dipToBlack", "dipToWhite",
  ]},
  { name: "TRANSITIONS", effects: [
    "crossfade", "hardCut", "matchCut", "transitionDipToBlack",
    "transitionDipToWhite", "whipPan", "zoomTransition", "blurTransition",
    "lightFlash", "filmBurn", "paperWipe", "newspaperWipe", "documentWipe",
    "shapeWipe", "maskTransition", "imageMorph",
  ]},
  { name: "TYPOGRAPHY", effects: [
    "textFade", "textSlide", "textRise", "textDrop", "textScale",
    "textBlurSharp", "typewriter", "charByChar", "wordByWord", "lineByLine",
    "textMaskReveal", "textWipeReveal", "kinetic", "wordEmphasis",
    "numberEmphasis", "oversizedNumber", "fullScreenStatement",
    "splitTypography", "trackingAnimation", "letterSpacingAnimation",
    "weightChange", "highlightSweep", "underlineDraw", "strikeThrough",
    "textDisplacement", "textStagger", "textStacking", "textCollision",
    "textSnapping",
  ]},
  { name: "FINANCE", effects: [
    "stockChart", "lineGraphDraw", "barChartGrowth", "barChartCollapse",
    "percentageCounter", "dollarCounter", "revenueCounter", "debtCounter",
    "marketCapCounter", "stockPriceCounter", "countdown", "upDownIndicator",
    "arrowAnimation", "circularPercentage", "progressBar", "timeline",
    "marketTicker", "priceFluctuation", "numberRolling", "decimalCounter",
    "financialDashboard", "portfolioVisualization", "balanceSheetReveal",
  ]},
  { name: "SCREEN", effects: [
    "computerScreen", "monitorChart", "monitorTicker", "monitorNumbers",
    "tvScreen", "phoneScreen", "phoneNotification", "laptopScreen",
    "atmDisplay", "billboard", "digitalSign", "calculatorNumbers",
    "digitalClock", "newsHeadline", "newspaperHighlight", "documentHighlight",
    "mapRoute", "gpsMovement", "cursorMovement", "typingSimulation",
    "scrollingWebpage",
  ]},
  { name: "DRAW", effects: [
    "handDrawnCircle", "arrowDraw", "drawUnderline", "graphDraw",
    "mapRouteDraw", "connectionLine", "boxOutline", "scribble", "bracket",
    "timelineLine", "signatureDraw",
  ]},
  { name: "REFRAMING", effects: [
    "faceCrop", "objectCrop", "documentCrop", "logoCrop", "moneyCrop",
    "computerCrop", "graphCrop", "backgroundCrop", "extremeCloseUp",
    "wideShot", "mediumShot", "detailShot",
  ]},
  { name: "FOCUS", effects: [
    "spotlight", "circularSpotlight", "darkenSurroundings",
    "blurSurroundings", "brightenSubject", "colorIsolate", "outlineSubject",
    "glowSubject", "zoomSubject", "movingSpotlight", "magnifyingGlass",
    "focusPull",
  ]},
  { name: "ATMOSPHERE", effects: [
    "vignette", "grain", "dust", "lightSweep", "lightLeak", "screenGlow",
    "flicker", "exposurePulse", "shadowMovement", "fog", "mist",
    "reflection", "lensFlare", "filmTexture", "brightnessBreathing",
  ]},
  { name: "DOCUMENT", effects: [
    "newspaperSlide", "newspaperZoom", "headlineHighlight", "articleCrop",
    "docTextUnderline", "redCircle", "documentStack", "paperShuffle",
    "paperTear", "documentReveal", "photocopyEffect", "archiveEffect",
    "stampAnimation", "dateStamp", "filingCard",
  ]},
  { name: "MAP", effects: [
    "locationPin", "pinDrop", "routeDrawing", "countryHighlight",
    "cityHighlight", "connectionLines", "flightPath", "expansion",
    "marketSpread", "geographicZoom", "mapPushIn",
  ]},
  { name: "DRAMA", effects: [
    "chartCrash", "chartExplosion", "numberShock", "screenGlitch",
    "digitalDistortion", "imageShake", "microJitter", "flash",
    "redWarningPulse", "crackReveal", "dramaPaperTear", "smoke",
    "particleBurst", "rapidZoom", "freezeFrame",
  ]},
  { name: "COLOR", effects: [
    "blackAndWhite", "toColor", "desaturation", "saturationPulse",
    "warmToCold", "coldToWarm", "darkToBright", "brightToDark",
    "blurToSharp", "sharpToBlur", "contrastPulse", "exposureChange",
    "filmLook", "archiveLook",
  ]},
  { name: "CAMERA-EFFECTS", effects: [
    "handheld", "cameraShake", "dollyMove", "dollyZoom", "crane",
    "cameraTilt", "cameraRoll", "orbit", "cameraFocusPull", "lensBreathing",
    "cameraVibration",
  ]},
  { name: "COMBINATIONS", effects: [
    "financePortrait", "stockMarketScene", "financialCollapse",
    "historicalEvent", "billionDollarReveal",
  ]},
];

export const TOTAL_EFFECTS = CATEGORIES.reduce((s, c) => s + c.effects.length, 0);
