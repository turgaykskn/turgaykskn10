import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import { Arena } from "./Arena";
import { Ball } from "./Ball";
import { Goal } from "./Goal";
import { FinalScore } from "./FinalScore";
import { GoalOverlay } from "./GoalOverlay";
import {
  ARENA_CENTER_Y,
  ARENA_SIZE,
  BALL_SIZE,
  GAME_SECONDS,
  GOAL_DEPTH,
  GOAL_MOUTH,
  MATCH_CONFIG,
  TOKEN_SIZE,
} from "./config";
import { getMatch } from "./motion";
import { Scoreboard } from "./Scoreboard";
import { Sounds } from "./Sounds";
import { TeamToken } from "./TeamToken";
import type { LogoFootballProps } from "./types";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700", "800"],
  subsets: ["latin", "latin-ext"],
});

const PULSE_SECONDS = 10;
const PULSE_SCALE = 1.06;

const formatClock = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

// Countdown derived purely from the frame number: 01:00 on the first frame,
// each second lasts exactly `fps` frames, 00:00 from the last game frame on.
const useCountdown = (gameFrames: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const framesLeft = Math.max(0, gameFrames - 1 - frame);
  const secondsLeft = Math.ceil(framesLeft / fps);

  // Frames elapsed since the displayed value last changed
  const sinceTick = (fps - (framesLeft % fps)) % fps;
  const pulse =
    secondsLeft > 0 && secondsLeft <= PULSE_SECONDS
      ? interpolate(sinceTick, [0, fps * 0.4], [PULSE_SCALE, 1], {
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.quad),
        })
      : 1;

  return { time: formatClock(secondsLeft), scale: pulse };
};

const Background: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 90% 60% at 50% 55%, #12203A 0%, #0A1428 45%, #050912 100%)`,
    }}
  >
    {/* Soft light flares */}
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 60% 22% at 50% 0%, rgba(110,160,255,0.22) 0%, transparent 70%),
          radial-gradient(circle at 12% 38%, rgba(90,140,255,0.10) 0%, transparent 28%),
          radial-gradient(circle at 88% 78%, rgba(90,140,255,0.08) 0%, transparent 30%)`,
      }}
    />
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(115deg, transparent 38%, rgba(160,195,255,0.05) 46%, transparent 54%)",
      }}
    />
    {/* Vignette */}
    <AbsoluteFill
      style={{ boxShadow: "inset 0 0 220px rgba(0,0,0,0.7)" }}
    />
  </AbsoluteFill>
);

// "Amatör Arena" signature under the arena; the two capital A's carry the emphasis
const TITLE_TOP = ARENA_CENTER_Y + ARENA_SIZE / 2 + 34;

const ArenaTitle: React.FC = () => {
  const capital: React.CSSProperties = {
    fontSize: 92,
    fontWeight: 800,
    lineHeight: 1,
    background: "linear-gradient(180deg, #FFFFFF 30%, #BFD3FF 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    textShadow: "none",
    filter: "drop-shadow(0 0 14px rgba(120,165,255,0.45))",
  };
  const rest: React.CSSProperties = {
    fontSize: 62,
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: 3,
    color: "#E9EFFA",
  };
  const rule = (dir: "left" | "right"): React.CSSProperties => ({
    width: 70,
    height: 2,
    background: `linear-gradient(${dir === "left" ? "90deg" : "270deg"}, transparent, rgba(190,210,255,0.6))`,
  });
  return (
    <div
      style={{
        position: "absolute",
        top: TITLE_TOP,
        left: 0,
        right: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 26,
        textShadow: "0 6px 18px rgba(0,0,0,0.55)",
      }}
    >
      <div style={rule("left")} />
      <div style={{ display: "flex", alignItems: "baseline" }}>
        <span style={capital}>A</span>
        <span style={rest}>matör</span>
        <span style={{ width: 26 }} />
        <span style={capital}>A</span>
        <span style={rest}>rena</span>
      </div>
      <div style={rule("right")} />
    </div>
  );
};

export const LogoFootball: React.FC<LogoFootballProps> = ({
  homeTeam,
  awayTeam,
  gameSeed,
}) => {
  const c = ARENA_SIZE / 2;
  const { fps } = useVideoConfig();
  const gameFrames = Math.round(GAME_SECONDS * fps);
  const countdown = useCountdown(gameFrames);
  const frame = useCurrentFrame();
  // Simulation covers the game only; after it the last frame stays frozen
  const match = getMatch(gameSeed, fps, gameFrames, MATCH_CONFIG);
  const { home, away, ball, homeScore, awayScore } =
    match.frames[Math.min(frame, match.frames.length - 1)];
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Background />
      <Arena size={ARENA_SIZE} centerY={ARENA_CENTER_Y} goalMouth={GOAL_MOUTH}>
        <Goal
          side="left"
          arenaSize={ARENA_SIZE}
          mouthHeight={GOAL_MOUTH}
          depth={GOAL_DEPTH}
          color={homeTeam.primaryColor}
        />
        <Goal
          side="right"
          arenaSize={ARENA_SIZE}
          mouthHeight={GOAL_MOUTH}
          depth={GOAL_DEPTH}
          color={awayTeam.primaryColor}
        />
        <TeamToken team={homeTeam} x={c + home.x} y={c + home.y} size={TOKEN_SIZE} />
        <TeamToken team={awayTeam} x={c + away.x} y={c + away.y} size={TOKEN_SIZE} />
        <Ball x={c + ball.x} y={c + ball.y} size={BALL_SIZE} />
      </Arena>
      <ArenaTitle />
      <Scoreboard
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeScore={homeScore}
        awayScore={awayScore}
        time={countdown.time}
        timerScale={countdown.scale}
      />
      <GoalOverlay
        goalEvents={match.goalEvents}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        gameFrames={gameFrames}
      />
      <FinalScore
        gameFrames={gameFrames}
        homeScore={match.frames[match.frames.length - 1].homeScore}
        awayScore={match.frames[match.frames.length - 1].awayScore}
        homeColor={homeTeam.primaryColor}
        awayColor={awayTeam.primaryColor}
      />
      <Sounds goalEvents={match.goalEvents} gameFrames={gameFrames} />
    </AbsoluteFill>
  );
};
