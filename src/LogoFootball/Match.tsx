import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import {
  BALL_R,
  CELEBRATION_FRAMES,
  CX,
  CY,
  DISC_R,
  GOAL_DEPTH,
  GOAL_W,
  MATCH_FRAMES,
  PITCH,
  simulateMatch,
  type Team,
} from "./sim";

// Local font: the render sandbox has no access to Google Fonts
const fontFamily = '"DejaVu Sans", Arial, sans-serif';

export type TeamInfo = { name: string; short: string; logo: string; color: string; disc: string };

export type MatchProps = {
  gameSeed: string;
  home: TeamInfo;
  away: TeamInfo;
};

const Disc: React.FC<{ x: number; y: number; tilt: number; team: TeamInfo; r: number }> = ({
  x,
  y,
  tilt,
  team,
  r,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - r,
      top: y - r,
      width: r * 2,
      height: r * 2,
      borderRadius: "50%",
      background: team.disc,
      border: `6px solid ${team.color}`,
      boxShadow: `0 18px 28px rgba(0,0,0,0.45), 0 0 26px ${team.color}88`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transform: `rotate(${tilt}rad)`,
      boxSizing: "border-box",
    }}
  >
    <Img
      src={staticFile(team.logo)}
      style={{ width: r * 1.5, height: r * 1.5, objectFit: "contain" }}
    />
  </div>
);

const Ball: React.FC<{ x: number; y: number; angle: number }> = ({ x, y, angle }) => (
  <>
    <div
      style={{
        position: "absolute",
        left: x - BALL_R + 8,
        top: y - BALL_R + 14,
        width: BALL_R * 2,
        height: BALL_R * 2,
        borderRadius: "50%",
        background: "rgba(0,0,0,0.4)",
        filter: "blur(6px)",
      }}
    />
    <svg
      width={BALL_R * 2}
      height={BALL_R * 2}
      viewBox="-50 -50 100 100"
      style={{ position: "absolute", left: x - BALL_R, top: y - BALL_R, transform: `rotate(${angle}rad)` }}
    >
      <circle r="49" fill="#fff" stroke="#111" strokeWidth="3" />
      <polygon points="0,-18 17,-6 10,14 -10,14 -17,-6" fill="#111" />
      {[0, 72, 144, 216, 288].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <line x1="0" y1="-18" x2="0" y2="-36" stroke="#111" strokeWidth="3" />
          <polygon points="-9,-49 9,-49 14,-38 -14,-38" fill="#111" />
        </g>
      ))}
    </svg>
  </>
);

const Pitch: React.FC = () => {
  const { L, R, T, B } = PITCH;
  const stripes = 10;
  const sh = (B - T) / stripes;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 45%, #1d6b32, #0d3b1b 80%)" }} />
      {Array.from({ length: stripes }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: L,
            width: R - L,
            top: T + i * sh,
            height: sh,
            background: i % 2 ? "rgba(255,255,255,0.045)" : "rgba(0,0,0,0.05)",
          }}
        />
      ))}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <g stroke="rgba(255,255,255,0.85)" strokeWidth="6" fill="none">
          <rect x={L} y={T} width={R - L} height={B - T} />
          <line x1={L} y1={CY} x2={R} y2={CY} />
          <circle cx={CX} cy={CY} r={150} />
          <rect x={CX - 260} y={T} width={520} height={190} />
          <rect x={CX - 260} y={B - 190} width={520} height={190} />
          <path d={`M ${CX - 90} ${T + 190} A 100 100 0 0 0 ${CX + 90} ${T + 190}`} />
          <path d={`M ${CX - 90} ${B - 190} A 100 100 0 0 1 ${CX + 90} ${B - 190}`} />
        </g>
        <circle cx={CX} cy={CY} r={9} fill="rgba(255,255,255,0.85)" />
        {/* goals */}
        <g fill="rgba(0,0,0,0.55)" stroke="#fff" strokeWidth="8">
          <path d={`M ${CX - GOAL_W / 2} ${T} L ${CX - GOAL_W / 2} ${T - GOAL_DEPTH} L ${CX + GOAL_W / 2} ${T - GOAL_DEPTH} L ${CX + GOAL_W / 2} ${T}`} />
          <path d={`M ${CX - GOAL_W / 2} ${B} L ${CX - GOAL_W / 2} ${B + GOAL_DEPTH} L ${CX + GOAL_W / 2} ${B + GOAL_DEPTH} L ${CX + GOAL_W / 2} ${B}`} />
        </g>
        <g stroke="rgba(255,255,255,0.25)" strokeWidth="2">
          {Array.from({ length: 9 }).map((_, i) => (
            <React.Fragment key={i}>
              <line x1={CX - GOAL_W / 2 + (i + 1) * (GOAL_W / 10)} y1={T - GOAL_DEPTH} x2={CX - GOAL_W / 2 + (i + 1) * (GOAL_W / 10)} y2={T} />
              <line x1={CX - GOAL_W / 2 + (i + 1) * (GOAL_W / 10)} y1={B} x2={CX - GOAL_W / 2 + (i + 1) * (GOAL_W / 10)} y2={B + GOAL_DEPTH} />
            </React.Fragment>
          ))}
        </g>
        {[CX - GOAL_W / 2, CX + GOAL_W / 2].map((px) => (
          <React.Fragment key={px}>
            <circle cx={px} cy={T} r={11} fill="#fff" />
            <circle cx={px} cy={B} r={11} fill="#fff" />
          </React.Fragment>
        ))}
      </svg>
    </>
  );
};

const Header: React.FC<{
  home: TeamInfo;
  away: TeamInfo;
  score: [number, number];
  frame: number;
  fps: number;
}> = ({ home, away, score, frame, fps }) => {
  const remaining = Math.max(0, 60 - Math.floor(Math.min(frame, MATCH_FRAMES) / fps));
  const timer = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const side = (t: TeamInfo, align: "left" | "right") => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 250 }}>
      <div
        style={{
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: t.disc,
          border: `5px solid ${t.color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        <Img src={staticFile(t.logo)} style={{ width: 80, height: 80, objectFit: "contain" }} />
      </div>
      <div style={{ fontFamily, fontWeight: 800, fontStyle: "italic", fontSize: 30, color: "#fff", marginTop: 6, textAlign: align === "left" ? "center" : "center" }}>
        {t.name.toUpperCase()}
      </div>
    </div>
  );
  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 380 }}>
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontStyle: "italic",
          fontSize: 52,
          letterSpacing: 8,
          color: "#ffd23a",
          textAlign: "center",
          paddingTop: 34,
          textShadow: "0 4px 18px rgba(0,0,0,0.6)",
        }}
      >
        AMATÖR ARENA
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 60px" }}>
        {side(home, "left")}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily, fontWeight: 800, fontStyle: "italic", fontSize: 100, color: "#fff", lineHeight: 1, textShadow: "0 6px 20px rgba(0,0,0,0.6)" }}>
            {score[0]} - {score[1]}
          </div>
          <div
            style={{
              display: "inline-block",
              marginTop: 6,
              padding: "2px 26px",
              borderRadius: 14,
              background: remaining <= 10 ? "#e3001b" : "rgba(0,0,0,0.55)",
              fontFamily,
              fontWeight: 800,
              fontStyle: "italic",
              fontSize: 46,
              color: "#fff",
              letterSpacing: 3,
            }}
          >
            {timer}
          </div>
        </div>
        {side(away, "right")}
      </div>
    </div>
  );
};

const GoalOverlay: React.FC<{ team: TeamInfo; t: number; fps: number }> = ({ team, t, fps }) => {
  const sc = spring({ frame: t, fps, config: { damping: 9, stiffness: 120 } });
  const flash = interpolate(t, [0, 10], [0.7, 0], { extrapolateRight: "clamp" });
  const out = interpolate(t, [CELEBRATION_FRAMES - 10, CELEBRATION_FRAMES], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const wob = Math.sin(t / 3) * 2;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${team.color}55, rgba(0,0,0,0.55) 75%)` }} />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1080,
          height: 1920,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${sc}) rotate(${wob}deg)`,
        }}
      >
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: team.disc,
            border: `10px solid ${team.color}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 80px ${team.color}`,
            boxSizing: "border-box",
          }}
        >
          <Img src={staticFile(team.logo)} style={{ width: 220, height: 220, objectFit: "contain" }} />
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontStyle: "italic",
            fontSize: 185,
            lineHeight: 1,
            color: "#ffd23a",
            WebkitTextStroke: "10px #7a1200",
            paintOrder: "stroke fill",
            textShadow: "0 14px 0 #7a1200, 0 30px 50px rgba(0,0,0,0.6)",
            letterSpacing: 2,
          }}
        >
          GOOOL!
        </div>
        <div style={{ fontFamily, fontWeight: 800, fontStyle: "italic", fontSize: 56, color: "#fff", letterSpacing: 4 }}>
          {team.name.toUpperCase()}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FinalScreen: React.FC<{ home: TeamInfo; away: TeamInfo; score: [number, number]; t: number }> = ({
  home,
  away,
  score,
  t,
}) => {
  const a = interpolate(t, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const verdict =
    score[0] === score[1]
      ? "BERABERE"
      : `${(score[0] > score[1] ? home : away).name.toUpperCase()} KAZANDI`;
  const big = (txt: string, size: number, color = "#fff") => (
    <div style={{ fontFamily, fontWeight: 800, fontStyle: "italic", fontSize: size, color, lineHeight: 1, letterSpacing: 4 }}>{txt}</div>
  );
  const logo = (tm: TeamInfo) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, width: 300 }}>
      <div
        style={{
          width: 230,
          height: 230,
          borderRadius: "50%",
          background: tm.disc,
          border: `9px solid ${tm.color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        <Img src={staticFile(tm.logo)} style={{ width: 170, height: 170, objectFit: "contain" }} />
      </div>
      {big(tm.name.toUpperCase(), 38)}
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: a, background: "linear-gradient(180deg, #050a07, #0d3b1b 60%, #050a07)", alignItems: "center", justifyContent: "center", gap: 44 }}>
      {big("AMATÖR ARENA", 62, "#ffd23a")}
      {big("MAÇ SONU", 96)}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
        {logo(home)}
        <div style={{ width: 300, textAlign: "center", whiteSpace: "nowrap" }}>{big(`${score[0]}-${score[1]}`, 110)}</div>
        {logo(away)}
      </div>
      {big(verdict, 56, "#ffd23a")}
    </AbsoluteFill>
  );
};

export const LogoFootballMatch: React.FC<MatchProps> = ({ gameSeed, home, away }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sim = useMemo(() => simulateMatch(gameSeed), [gameSeed]);
  const f = sim.frames[Math.min(frame, MATCH_FRAMES - 1)];
  const finished = frame >= MATCH_FRAMES;
  const finalScore = sim.frames[MATCH_FRAMES - 1].score;
  const teams: Record<Team, TeamInfo> = { home, away };
  const active = sim.goals.find((g) => frame >= g.frame && frame < g.frame + CELEBRATION_FRAMES);
  // Sound ducks while the goal jingle plays
  const musicVol = active ? 0.12 : 0.4;

  return (
    <AbsoluteFill style={{ background: "#0d3b1b", overflow: "hidden" }}>
      <Pitch />
      <Disc x={f.home[0]} y={f.home[1]} tilt={f.homeTilt} team={home} r={DISC_R} />
      <Disc x={f.away[0]} y={f.away[1]} tilt={f.awayTilt} team={away} r={DISC_R} />
      <Ball x={f.ball[0]} y={f.ball[1]} angle={f.ballAngle} />
      <Header home={home} away={away} score={f.score} frame={frame} fps={fps} />
      {active && !finished ? <GoalOverlay team={teams[active.team]} t={frame - active.frame} fps={fps} /> : null}
      {finished ? <FinalScreen home={home} away={away} score={finalScore} t={frame - MATCH_FRAMES} /> : null}

      <Audio src={staticFile("audio/bg-music.mp3")} volume={musicVol} />
      <Sequence from={0} durationInFrames={45}>
        <Audio src={staticFile("audio/whistle.wav")} volume={0.7} />
      </Sequence>
      {sim.goals.map((g) => (
        <Sequence key={g.frame} from={g.frame} durationInFrames={110}>
          <Audio src={staticFile("audio/goal.wav")} volume={0.9} />
        </Sequence>
      ))}
      <Sequence from={MATCH_FRAMES} durationInFrames={60}>
        <Audio src={staticFile("audio/whistle.wav")} volume={0.9} />
      </Sequence>
    </AbsoluteFill>
  );
};
