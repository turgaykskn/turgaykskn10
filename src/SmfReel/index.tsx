import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { Backdrop, Bokeh, Building } from "./Building";
import { CenterSystem, Emblem, Orbits, Systems, Wordmark } from "./Finale";
import { ConvergeStreaks, Network } from "./Network";
import { KLine, TextBlock } from "./Typography";
import {
  CX,
  CY,
  EASE_IO,
  HEAD,

  GOLD,
  NAVY,
  NAVY_DEEP,
  T,
  WHITE,
  camA,
  camB,
  gold,
  lerp,
  prog,
  white,
} from "./theme";

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 50%, rgba(11,21,34,0) 45%, ${NAVY_DEEP} 125%)`,
      pointerEvents: "none",
    }}
  />
);

const shakeAt = (f: number) => {
  const a = (t0: number, amp: number) => {
    const t = f - t0;
    return t < 0 || t > 16 ? 0 : amp * Math.exp(-t / 4) * Math.sin(t * 2.6);
  };
  return { x: a(T.impact, 12) + a(T.smf, 16), y: a(T.impact, 8) - a(T.smf, 10) };
};

const SceneA: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camA(f);
  const sh = shakeAt(f);
  const lin = prog(f, 100, 110, Easing.linear);
  const sink = prog(f, 224, 22, Easing.linear);
  const lines = (1 - 0.72 * lin) * (1 - 0.7 * sink);
  const wins = (1 - 0.5 * lin) * (1 - 0.8 * sink);
  const smfOut = prog(f, 316, 16, Easing.in(Easing.cubic));

  return (
    <AbsoluteFill style={{ backgroundColor: NAVY, transform: `translate(${sh.x}px, ${sh.y}px)` }}>
      <Backdrop cam={cam} />
      <Building f={f} cam={cam} mode="A" lines={lines} windows={wins} />
      <Network f={f} cam={cam} />
      <ConvergeStreaks f={f} />
      <CenterSystem f={f} />
      <Bokeh f={f} cam={cam} opacity={1 - sink} />

      <TextBlock y={400} gap={4}>
        <KLine parts={[{ t: "BİR BİNA" }]} f={f} start={15} end={80} size={158} />
        <KLine parts={[{ t: "HİÇ " }, { t: "DURMAZ.", c: GOLD }]} f={f} start={21} end={82} size={158} />
      </TextBlock>

      <TextBlock y={CY} gap={4}>
        <KLine parts={[{ t: "ONLARCA" }]} f={f} start={177} end={202} size={200} exitDir="in" />
        <KLine parts={[{ t: "SÜREÇ.", c: GOLD }]} f={f} start={183} end={204} size={200} exitDir="in" />
      </TextBlock>

      <TextBlock y={CY}>
        <KLine parts={[{ t: "TEK MERKEZ." }]} f={f} start={243} end={274} size={158} />
      </TextBlock>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: CY,
          display: "flex",
          justifyContent: "center",
          transform: `translateY(-50%) scale(${1 + smfOut * 0.35})`,
          opacity: 1 - smfOut,
          filter: smfOut > 0 ? `blur(${smfOut * 18}px)` : undefined,
        }}
      >
        {f >= T.smf && <Wordmark f={f} start={T.smf} size={200} />}
      </div>
      <Vignette />
    </AbsoluteFill>
  );
};

const SceneB: React.FC = () => {
  const local = useCurrentFrame();
  const f = local + T.reveal;
  const cam = camB(f);
  const rp = prog(f, T.reveal, 44, Easing.bezier(0.5, 0, 0.2, 1));
  const R = lerp(40, 1700, rp);
  const fin = prog(f, T.card, 22, Easing.inOut(Easing.cubic));
  const dimL = 1 - 0.62 * fin;
  const dimW = 1 - 0.55 * fin;
  const heroEnd = 392;
  const tag = prog(f, 414, 22);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: NAVY, clipPath: `circle(${R}px at ${CX}px ${CY}px)` }}>
        <Backdrop cam={cam} opacity={dimL} />
        <Orbits f={f} cam={cam} part="back" opacity={dimL} />
        <Building f={f} cam={cam} mode="B" lines={dimL} windows={dimW} draw={false} />
        <Orbits f={f} cam={cam} part="front" opacity={dimL} />
        <Systems f={f} cam={cam} opacity={dimL} />
        <Bokeh f={f} cam={cam} opacity={0.7} />

        <TextBlock y={450} gap={6}>
          <KLine parts={[{ t: "YÖNETİMİN" }]} f={f} start={T.finalHead} end={heroEnd} size={146} />
          <KLine parts={[{ t: "YÜKÜ TEK" }]} f={f} start={T.finalHead + 5} end={heroEnd + 3} size={146} />
          <KLine parts={[{ t: "MERKEZDE.", c: GOLD }]} f={f} start={T.finalHead + 10} end={heroEnd + 6} size={146} />
        </TextBlock>

        {f >= T.card && (
          <>
            <div style={{ position: "absolute", left: 0, right: 0, top: 735, display: "flex", justifyContent: "center" }}>
              <Emblem f={f} start={T.card} size={104} />
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 930, display: "flex", justifyContent: "center", transform: "translateY(-50%)" }}>
              <Wordmark f={f} start={T.card + 4} size={190} />
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 1055, display: "flex", justifyContent: "center" }}>
              <div style={{ width: 380 * prog(f, T.card + 12, 26, EASE_IO), height: 2, background: GOLD }} />
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 1120,
                textAlign: "center",
                fontFamily: "inherit",
                opacity: tag,
                transform: `translateY(${(1 - tag) * 22}px)`,
                filter: tag < 1 ? `blur(${(1 - tag) * 6}px)` : undefined,
              }}
            >
              <TagLine />
            </div>
          </>
        )}
        <Vignette />
      </AbsoluteFill>
      {rp < 1 && (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke={gold(0.28 * (1 - rp))} strokeWidth={26} style={{ filter: "blur(12px)" }} />
          <circle cx={CX} cy={CY} r={R} fill="none" stroke={gold(1 - rp * 0.9)} strokeWidth={4} />
          <circle cx={CX} cy={CY} r={Math.max(0, R - 34)} fill="none" stroke={white(0.35 * (1 - rp))} strokeWidth={1.5} />
        </svg>
      )}
    </AbsoluteFill>
  );
};

const TagLine: React.FC = () => (
  <span
    style={{
      fontFamily: HEAD,
      fontWeight: 600,
      fontSize: 50,
      letterSpacing: "0.05em",
      color: WHITE,
    }}
  >
    Detaylı bilgi için bize ulaşabilirsiniz.
  </span>
);

export const SmfReel: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: NAVY }}>
      <Audio src={staticFile("smf-sound.wav")} premountFor={fps} volume={0.9} />
      <Sequence name="Sahne A: Görünmeyen ritim" durationInFrames={T.reveal + 46} premountFor={fps}>
        <SceneA />
      </Sequence>
      <Sequence name="Sahne B: Tek merkez final" from={T.reveal} durationInFrames={450 - T.reveal} premountFor={fps}>
        <SceneB />
      </Sequence>
    </AbsoluteFill>
  );
};

