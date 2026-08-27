import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, Img, interpolate } from "remotion";
import { Director } from "../animations/director";
import type { EffectName } from "../types";

const EFFECTS: EffectName[] = [
  "fadeIn",
  "fadeInScale",
  "fadeInBlur",
  "slideInLeft",
  "slideInRight",
  "slideInTop",
  "slideInBottom",
  "scaleIn",
  "maskReveal",
  "wipeReveal",
  "circularReveal",
  "diagonalReveal",
  "paperReveal",
  "filmBurnReveal",
  "focusReveal",
  "pushIn",
  "pullOut",
  "panLeft",
  "panRight",
  "panUp",
  "panDown",
  "diagonalPan",
  "slowDrift",
  "staticHold",
  "microBreathing",
  "pushPanLeft",
  "pushPanRight",
  "pullPan",
  "pushTilt",
  "diagonalPush",
  "cornerToCorner",
  "subjectReframe",
  "faceReframe",
  "objectReframe",
  "detailReveal",
  "twoLayerParallax",
  "threeLayerParallax",
  "multiLayerParallax",
  "depthBasedZoom",
  "foregroundDrift",
  "backgroundDrift",
  "dolly",
  "perspectiveShift",
  "depthOfField",
  "foregroundBlur",
  "backgroundBlur",
  "rackFocus",
  "stockChart",
  "lineGraphDraw",
  "barChartGrowth",
  "barChartCollapse",
  "percentageCounter",
  "dollarCounter",
  "revenueCounter",
  "debtCounter",
  "marketCapCounter",
  "stockPriceCounter",
  "countdown",
  "upDownIndicator",
  "arrowAnimation",
  "circularPercentage",
  "progressBar",
  "timeline",
  "marketTicker",
  "priceFluctuation",
  "numberRolling",
  "decimalCounter",
  "financialDashboard",
  "portfolioVisualization",
  "balanceSheetReveal",
  "chartCrash",
  "chartExplosion",
  "numberShock",
  "screenGlitch",
  "digitalDistortion",
  "imageShake",
  "microJitter",
  "flash",
  "redWarningPulse",
  "crackReveal",
  "dramaPaperTear",
  "smoke",
  "particleBurst",
  "rapidZoom",
  "freezeFrame",
  "handheld",
  "cameraShake",
  "dollyMove",
  "dollyZoom",
  "crane",
  "cameraTilt",
  "cameraRoll",
  "orbit",
  "cameraFocusPull",
  "lensBreathing",
  "cameraVibration",
];

const DURATION_PER_EFFECT = 30;
const TOTAL_DURATION = EFFECTS.length * DURATION_PER_EFFECT;

export const PlanetFitnessEntrance: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  void width;
  void height;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {EFFECTS.map((effect, i) => (
        <Sequence key={effect} from={i * DURATION_PER_EFFECT} durationInFrames={DURATION_PER_EFFECT}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: 40,
                left: 40,
                color: "#fff",
                fontSize: 24,
                fontFamily: "ui-monospace, Menlo, monospace",
                textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                zIndex: 10,
              }}
            >
              {effect}
            </div>
            <Director
              effect={effect}
              image="/planet-fitness-entrance.jpg"
              durationInFrames={DURATION_PER_EFFECT}
              intensity={1}
            />
          </div>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};