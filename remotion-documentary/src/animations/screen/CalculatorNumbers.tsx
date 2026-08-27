import { AbsoluteFill } from "remotion";
import type { BaseEffectProps } from "../../types";

export interface CalculatorNumbersProps extends BaseEffectProps {
  region?: { x?: number; y?: number; width?: number; height?: number };
  value?: number;
  intensity?: number;
}

export const CalculatorNumbers: React.FC<CalculatorNumbersProps> = ({
  image,
  children,
  region = { x: 0, y: 0, width: 100, height: 100 },
  value = 123456789,
  intensity = 1,
  style,
  className,
}) => {
  const { x = 0, y = 0, width = 100, height = 100 } = region;
  const left = (x / 100) * 100;
  const top = (y / 100) * 100;
  const w = (width / 100) * 100;
  const h = (height / 100) * 100;

  const digits = String(Math.abs(value || 0)).split("");
  const digitW = w / digits.length / 2;
  const digitH = h * 0.6;

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          left: `${left}%`,
          top: `${top}%`,
          width: `${w}%`,
          height: `${h}%`,
          overflow: "hidden",
          background: "rgba(0, 0, 0, 0.8)",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {digits.map((digit, i) => {
            const segments = {
              0: { top: true, topR: true, bottomR: true, bottom: true, bottomL: true, topL: true },
              1: { topR: true, bottomR: true },
              2: { top: true, topR: true, middle: true, bottomL: true, bottom: true },
              3: { top: true, topR: true, middle: true, bottomR: true, bottom: true },
              4: { topL: true, middle: true, topR: true, bottomR: true },
              5: { top: true, topL: true, middle: true, bottomR: true, bottom: true },
              6: { top: true, topL: true, middle: true, bottomL: true, bottom: true, bottomR: true },
              7: { top: true, topR: true, bottomR: true },
              8: { top: true, topL: true, topR: true, middle: true, bottomL: true, bottom: true, bottomR: true },
              9: { top: true, topL: true, topR: true, middle: true, bottomR: true, bottom: true },
            }[digit as keyof typeof segments] || {};

            return (
              <div
                key={digit}
                style={{
                  position: "absolute",
                  width: `${digitW}%`,
                  height: `${digitH}%`,
                  left: `${i * (digitW * 2 + 2)}%`,
                  top: 0,
                  background: "currentColor",
                }}
              >
                {/* Top segment */}
                {segments.top && (
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "3%",
                      top: 0,
                      left: 0,
                      background: "currentColor",
                    }}
                  />
                )}
                {/* Top-Right */}
                {segments.topR && (
                  <div
                    style={{
                      position: "absolute",
                      width: "3%",
                      height: "40%",
                      top: "30%",
                      right: 0,
                      background: "currentColor",
                    }}
                  />
                )}
                {/* Bottom-Right */}
                {segments.bottomR && (
                  <div
                    style={{
                      position: "absolute",
                      width: "3%",
                      height: "40%",
                      bottom: "30%",
                      right: 0,
                      background: "currentColor",
                    }}
                  />
                )}
                {/* Bottom */}
                {segments.bottom && (
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "3%",
                      bottom: 0,
                      left: 0,
                      background: "currentColor",
                    }}
                  />
                )}
                {/* Bottom-Left */}
                {segments.bottomL && (
                  <div
                    style={{
                      position: "absolute",
                      width: "3%",
                      height: "40%",
                      bottom: "30%",
                      left: 0,
                      background: "currentColor",
                    }}
                  />
                )}
                {/* Top-Left */}
                {segments.topL && (
                  <div
                    style={{
                      position: "absolute",
                      width: "3%",
                      height: "40%",
                      top: "30%",
                      left: 0,
                      background: "currentColor",
                    }}
                  />
                )}
                {/* Middle */}
                {segments.middle && (
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "3%",
                      top: "50%",
                      left: 0,
                      transform: "translateY(-50%)",
                      background: "currentColor",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};