import {AbsoluteFill, useCurrentFrame, interpolate} from "remotion";
import type {BaseEffectProps} from "../../types";
import {easeOutQuart} from "../timing/easings";

interface CounterConfig {
  from: number;
  to: number;
  durationInFrames?: number;
  prefix?: string;
  suffix?: string;
  durationInFrames?: number;
  decimals?: number;
  fontSize?: number;
  color?: string;
}

type RevenueCounterProps = BaseEffectProps & {config: CounterConfig};

export const revenueCounter: React.FC<RevenueCounterProps> = ({
  children,
  durationInFrames = 45,
  delay = 0,
  intensity = 1,
  style,
  className,
  config,
}) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - delay);
  const safeDuration = Math.max(1, durationInFrames);
  const t = Math.max(0, Math.min(1, local / safeDuration));
  const eased = easeOutQuart(t);
  const {
    from = 0,
    to = 5000000,
    prefix = "$",
    suffix = "+",
    decimals = 2,
    fontSize = 32,
    color = "#10b981",
  } = config;
  const value = interpolate(eased, [0, 1], [from, to]);
  const formatted = `${prefix}${value.toFixed(decimals)}${suffix}`;

  return (
    <AbsoluteFill style={style} className={className}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          fontSize: fontSize * intensity,
          color,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatted}
      </div>
      {children}
    </AbsoluteFill>
  );
};
