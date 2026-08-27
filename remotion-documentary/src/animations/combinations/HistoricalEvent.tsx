import { AbsoluteFill, Sequence } from "remotion";
import type { CombinationProps } from "./types";
import { Director } from "../director";

/**
 * HistoricalEvent — the "black-and-white archive footage" beat. Stacks:
 *  1. black-and-white desaturation (intensity 2 → full B&W)
 *  2. slow pan-left across the archive photo
 *  3. film grain (medium intensity)
 *  4. newspaper texture overlay in a corner (drifts for life)
 *  5. a date OversizedNumber
 *  6. a sublabel / archive source line
 *  7. vignette
 *
 * Default 200 frames. Pass `label` to override the date.
 */
export const HistoricalEvent: React.FC<CombinationProps> = ({
  image = "/sample-newspaper.svg",
  overlay,
  label = "1929",
  sublabel = "ARCHIVE — THE CRASH",
  durationInFrames = 200,
  intensity = 1,
  style,
  className,
}) => {
  return (
    <AbsoluteFill style={style} className={className}>
      {/* 1. B&W on the archive image */}
      <Director
        effect="blackAndWhite"
        image={image}
        durationInFrames={durationInFrames}
        intensity={2 * intensity}
      />

      {/* 2. Slow pan-left to feel like a slow archive camera scan */}
      <Director
        effect="panLeft"
        image={image}
        durationInFrames={durationInFrames}
        intensity={0.8 * intensity}
      />

      {/* 3. Film grain — medium-heavy for the archive look */}
      <Director effect="grain" intensity={0.9 * intensity} />

      {/* 4. Newspaper texture in the corner — drifts slowly */}
      {overlay ? (
        <Sequence from={20} durationInFrames={durationInFrames - 20}>
          <Director
            effect="foregroundDrift"
            config={{ bg: image, fg: overlay, amount: 2 }}
            durationInFrames={durationInFrames - 20}
            delay={0}
            intensity={intensity}
          />
        </Sequence>
      ) : null}

      {/* 5. Date — OversizedNumber */}
      <Sequence from={30} durationInFrames={70}>
        <Director
          effect="oversizedNumber"
          text={label}
          durationInFrames={70}
          delay={0}
          config={{ fontSize: 180, y: 0.55, x: 0.5 }}
        />
      </Sequence>

      {/* 6. Sublabel — archive source line */}
      <Sequence from={90} durationInFrames={50}>
        <Director
          effect="textFade"
          text={sublabel}
          durationInFrames={40}
          delay={0}
          config={{
            x: 0.5,
            y: 0.7,
            fontSize: 22,
            color: "#e5e5e5",
            fontWeight: 500,
            textAlign: "center",
            fontFamily: "Courier New, monospace",
          }}
        />
      </Sequence>

      {/* 7. Vignette to push the corners into shadow */}
      <Director effect="vignette" intensity={1.6 * intensity} />
    </AbsoluteFill>
  );
};
