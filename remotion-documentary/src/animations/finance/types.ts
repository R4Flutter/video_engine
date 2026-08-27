export interface CounterConfig {
  from: number;
  to: number;
  durationInFrames?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  fontSize?: number;
  color?: string;
}

export interface ChartConfig {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  bgColor?: string;
}