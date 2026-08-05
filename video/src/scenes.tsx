// One module per beat. The director (script.json) picks which one runs when;
// each owns its staging, so no scene needs to know about its neighbours.
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  Backdrop,
  Badge,
  Character,
  Coin,
  CoinPile,
  GrowthChart,
  Ground,
  Jar,
  Sparkles,
} from "./elements";
import { POP, theme } from "./theme";

const { color, stage } = theme;
const GROUND = stage.groundY;

export type SceneProps = { dur: number };

const ease = (frame: number, a: number, b: number, out: readonly [number, number] = [0, 1]) =>
  interpolate(frame, [a, b], out, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

/** Beat 1 — a coin falls into an empty jar. */
export const CoinDrop: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const land = 20;
  const drop = spring({ frame, fps, config: { damping: 11, mass: 0.9, stiffness: 110 }, durationInFrames: land });
  const y = interpolate(drop, [0, 1], [-120, 1362]);
  const ring = frame - land;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: theme.font,
          fontWeight: 900,
          fontSize: 900,
          color: color.gold,
          opacity: ease(frame, 0, 30, [0, 0.07]),
          transform: `translateY(-60px) scale(${ease(frame, 0, 40, [1.15, 1])})`,
        }}
      >
        ₹
      </div>
      <Character x={840} y={GROUND} h={560} face="left" />
      <Jar x={470} bottom={GROUND} h={360} fill={frame > land ? 0.12 : 0} />
      <Coin x={470} y={y} size={104} rot={interpolate(drop, [0, 1], [-160, 0])} />
      {ring > 0 && ring < 22 ? (
        <div
          style={{
            position: "absolute",
            left: 470 - 60,
            top: 1362 - 60,
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: `5px solid ${color.gold}`,
            transform: `scale(${interpolate(ring, [0, 22], [0.4, 2.6])})`,
            opacity: interpolate(ring, [0, 22], [0.8, 0]),
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

/** Beat 2 — ₹100 a day stacks into a month. Calendar ticks alongside. */
export const CoinStack: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const days = 30;
  const per = 3.4;
  const cell = 62;
  const gap = 14;
  const gridX = 626;
  const gridY = 720;
  return (
    <AbsoluteFill>
      <Character x={220} y={GROUND} h={470} face="right" />
      <Ground x={452} y={GROUND + 4} w={230} />
      {Array.from({ length: days }, (_, i) => {
        const t = frame - i * per;
        if (t < 0) return null;
        const s = interpolate(t, [0, 7], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
        return (
          <Coin
            key={i}
            x={452}
            y={GROUND - 34 - i * 26 - interpolate(s, [0, 1], [220, 0])}
            size={116}
            tilt={interpolate(s, [0, 1], [0.7, 1])}
            rot={(random(`st${i}`) - 0.5) * 8}
          />
        );
      })}
      {Array.from({ length: days }, (_, i) => {
        const t = frame - i * per;
        const on = interpolate(t, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: gridX + (i % 5) * (cell + gap),
              top: gridY + Math.floor(i / 5) * (cell + gap),
              width: cell,
              height: cell,
              borderRadius: 12,
              border: `3px solid ${color.dim}`,
              opacity: 0.35 + on * 0.65,
              background: on > 0.5 ? color.gold : "transparent",
              transform: `scale(${1 + Math.max(0, 1 - Math.abs(t) / 6) * 0.18})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Beat 3 — the money leaves the jar and starts compounding. */
export const InvestChart: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const cx = 300;
  const cy = 760;
  const cw = 640;
  const ch = 470;
  const progress = ease(frame, 26, dur - 18);
  return (
    <AbsoluteFill>
      <Character x={175} y={GROUND} h={420} face="right" />
      <GrowthChart x={cx} y={cy} w={cw} h={ch} progress={progress} />
      {Array.from({ length: 6 }, (_, i) => {
        const t = ease(frame, 4 + i * 6, 34 + i * 6);
        if (t <= 0 || t >= 1) return null;
        const fromX = 250;
        const fromY = GROUND - 120;
        const toX = cx + 30;
        const toY = cy + ch;
        return (
          <Coin
            key={i}
            x={interpolate(t, [0, 1], [fromX, toX])}
            y={interpolate(t, [0, 1], [fromY, toY]) - Math.sin(t * Math.PI) * 340}
            size={74}
            rot={t * 420}
            opacity={interpolate(t, [0.75, 1], [1, 0], { extrapolateLeft: "clamp" })}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: cx,
          top: cy + ch + 18,
          width: cw,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: theme.font,
          fontSize: 34,
          fontWeight: 700,
          color: color.dim,
          opacity: progress > 0.1 ? 1 : 0,
        }}
      >
        <span>YEAR 0</span>
        <span style={{ color: color.green }}>12% / YEAR</span>
      </div>
    </AbsoluteFill>
  );
};

/** Beat 4 — ten years. The jar fills and overflows; the badge stamps. */
export const JarFill: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const fill = ease(frame, 10, dur * 0.55, [0, 1]);
  const spill = Math.max(0, fill - 0.94) * 16;
  return (
    <AbsoluteFill>
      <Character x={880} y={GROUND} h={420} face="left" />
      <Badge x={800} y={800} size={250} label="10 YEARS" enter={frame - 58} />
      <Ground x={430} y={GROUND + 4} w={420} />
      <Jar x={430} bottom={GROUND} h={520} fill={fill} />
      {/* overflow: coins tip over the rim and land outside the jar */}
      {Array.from({ length: 10 }, (_, i) => {
        const t = interpolate(frame - (dur * 0.5 + i * 3), [0, 30], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        if (t <= 0 || spill <= 0) return null;
        const dir = i % 2 ? 1 : -1;
        const away = 230 + random(`sp${i}`) * 90;
        return (
          <Coin
            key={i}
            x={430 + dir * away * Math.sqrt(t)}
            y={GROUND - 480 + t * t * 470}
            size={62}
            rot={t * 300 * dir}
            opacity={1 - t * 0.2}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Beat 5 — twenty years. The pile becomes a mountain. */
export const Mountain: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grow = ease(frame, 8, dur - 24);
  const beat = frame % Math.round(fps * 0.8);
  const hop = spring({ frame: beat, fps, config: POP, durationInFrames: 12 });
  return (
    <AbsoluteFill>
      <CoinPile x={640} baseY={GROUND} w={620} h={430 * grow} grow={grow} count={120} />
      {/* coin rain, faded in below the headline so it never fights the text */}
      {Array.from({ length: 14 }, (_, i) => {
        const life = 34;
        const t = ((frame + random(`rn${i}`) * life * 2) % life) / life;
        const y = 520 + t * (GROUND - 430 * grow - 460);
        return (
          <Coin
            key={i}
            x={370 + random(`rx${i}`) * 540}
            y={y}
            size={54}
            rot={t * 260}
            opacity={grow > 0.15 ? 0.9 * Math.sin(t * Math.PI) : 0}
          />
        );
      })}
      <Character x={160} y={GROUND} h={420} face="right" hop={Math.max(0, hop) * 42} />
    </AbsoluteFill>
  );
};

/** Beat 6 — thirty years. He climbs it and holds up the same coin. */
export const Payoff: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const peakH = 560;
  const climb = ease(frame, 6, dur * 0.62);
  const cx = interpolate(climb, [0, 1], [250, 640]);
  const cy = interpolate(climb, [0, 1], [GROUND, GROUND - peakH + 15]);
  const ch = interpolate(climb, [0, 1], [420, 290]);
  const flash = interpolate(frame, [dur * 0.62, dur * 0.62 + 8, dur * 0.62 + 26], [0, 0.28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const raise = ease(frame, dur * 0.62, dur * 0.62 + 16);
  return (
    <AbsoluteFill>
      <CoinPile x={640} baseY={GROUND} w={840} h={peakH} grow={1} count={190} seed="peak" />
      <Character x={cx} y={cy} h={ch} face="right" lean={interpolate(climb, [0, 0.8, 1], [-6, -3, 0])} />
      <Coin
        x={cx + 96 * raise}
        y={cy - ch + 84 - 30 * raise}
        size={80 + 30 * raise}
        opacity={raise}
        rot={interpolate(raise, [0, 1], [-40, 0])}
      />
      {raise > 0.4 ? <Sparkles x={cx} y={cy - ch} spread={340} frame={frame} seed="pk" /> : null}
      <AbsoluteFill style={{ backgroundColor: color.goldLight, opacity: flash, mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};

/** Beat 7 — it settles back to one full jar, and he looks at you. */
export const Outro: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const calm = ease(frame, 0, dur * 0.5);
  return (
    <AbsoluteFill>
      <CoinPile
        x={640}
        baseY={GROUND}
        w={interpolate(calm, [0, 1], [840, 300])}
        h={interpolate(calm, [0, 1], [560, 80])}
        grow={interpolate(calm, [0, 1], [1, 0.26])}
        count={190}
        seed="peak"
      />
      <Jar x={400} bottom={GROUND} h={interpolate(calm, [0, 1], [0, 420])} fill={calm} />
      <Character x={760} y={GROUND} h={interpolate(calm, [0, 1], [420, 520])} face="left" />
    </AbsoluteFill>
  );
};

export const MODULES: Record<string, React.FC<SceneProps>> = {
  coinDrop: CoinDrop,
  coinStack: CoinStack,
  investChart: InvestChart,
  jarFill: JarFill,
  mountain: Mountain,
  payoff: Payoff,
  outro: Outro,
};

export { Backdrop };
