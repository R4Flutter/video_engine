import { AbsoluteFill, Sequence } from "remotion";
import type { CombinationProps } from "./types";
import { Director } from "../director";

/**
 * StockMarketScene — the "trading floor" shot. Stacks:
 *  1. PushIn on the trading-room background
 *  2. a chart overlay in the top-right region (MonitorChart, scaled-in)
 *  3. a market ticker scrolling along the bottom
 *  4. a soft screen-glow over the chart region
 *  5. grain + vignette
 *
 * Default 180 frames. Pass `region` to relocate the chart, or
 * `data.series` to feed it custom Y values.
 */
export const StockMarketScene: React.FC<CombinationProps> = ({
  image = "/sample-screen.svg",
  label,
  data,
  durationInFrames = 180,
  intensity = 1,
  style,
  className,
}) => {
  const region = {
    x: 1080,
    y: 140,
    width: 760,
    height: 460,
  };
  const series = data?.series ?? [42, 51, 47, 63, 58, 72, 81, 77, 92, 88, 105, 112];

  return (
    <AbsoluteFill style={style} className={className}>
      {/* 1. PushIn on the trading-room backdrop */}
      <Director
        effect="pushIn"
        image={image}
        durationInFrames={durationInFrames}
        intensity={1.1 * intensity}
      />

      {/* 2. Chart overlay, snaps in at frame 24 */}
      <Sequence from={24} durationInFrames={90}>
        <Director
          effect="monitorChart"
          durationInFrames={90}
          delay={0}
          intensity={intensity}
          config={{
            data: series,
            x: region.x,
            y: region.y,
            width: region.width,
            height: region.height,
            color: "#22c55e",
            bgColor: "rgba(0,0,0,0.55)",
          }}
        />
      </Sequence>

      {/* 3. Screen-glow over the chart region — sells the "live monitor" feel */}
      <Sequence from={50} durationInFrames={40}>
        <Director
          effect="screenGlow"
          durationInFrames={40}
          delay={0}
          intensity={1.2 * intensity}
          config={{ x: region.x, y: region.y, width: region.width, height: region.height }}
        />
      </Sequence>

      {/* 4. Market ticker at the bottom — kicks in once the chart has settled */}
      <Sequence from={70} durationInFrames={110}>
        <Director
          effect="marketTicker"
          durationInFrames={110}
          delay={0}
          intensity={intensity}
          config={{ y: 0.92, fontSize: 32, color: "#fef3c7" }}
        />
      </Sequence>

      {/* 5. Atmosphere — grain and vignette finish the look */}
      <Director effect="grain" intensity={0.5 * intensity} />
      <Director effect="vignette" intensity={1.2 * intensity} />

      {/* Optional headline — top-left, like a network lower-third label */}
      {label ? (
        <Sequence from={10} durationInFrames={40}>
          <Director
            effect="textFade"
            text={label}
            durationInFrames={40}
            delay={0}
            config={{ x: 0.06, y: 0.08, fontSize: 22, color: "#fef3c7", fontWeight: 600 }}
          />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
