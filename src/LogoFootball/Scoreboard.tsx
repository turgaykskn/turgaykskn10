import React from "react";
import { LogoBadge } from "./TeamToken";
import type { Team } from "./types";

const NAME_WIDTH = 220;
const NAME_MAX_SIZE = 46;
const NAME_MIN_SIZE = 24;
// Approximate uppercase glyph width of Barlow Condensed, in em
const CHAR_EM = 0.6;

// Picks a font size so the name fits in at most two lines of NAME_WIDTH
const fitName = (name: string) => {
  const longestWord = Math.max(...name.trim().split(/\s+/).map((w) => w.length));
  const oneLine = NAME_WIDTH / (name.length * CHAR_EM);
  const twoLines = NAME_WIDTH / (Math.max(longestWord, Math.ceil(name.length / 2)) * CHAR_EM);
  const size = oneLine >= 34 ? oneLine : twoLines;
  return Math.max(NAME_MIN_SIZE, Math.min(NAME_MAX_SIZE, size));
};

const TeamSide: React.FC<{ team: Team; side: "left" | "right" }> = ({
  team,
  side,
}) => (
  <div
    style={{
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: side === "left" ? "row" : "row-reverse",
      alignItems: "center",
      gap: 18,
    }}
  >
    <LogoBadge team={team} size={108} />
    <div
      style={{
        maxWidth: NAME_WIDTH,
        fontSize: fitName(team.name),
        fontWeight: 700,
        lineHeight: 1.02,
        letterSpacing: 0.5,
        color: "#F2F5FB",
        textTransform: "uppercase",
        textAlign: side,
        overflow: "hidden",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflowWrap: "anywhere",
      }}
    >
      {team.name}
    </div>
  </div>
);

export const Scoreboard: React.FC<{
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  time: string;
  /** Scale of the timer capsule (used for the final-seconds pulse) */
  timerScale?: number;
}> = ({ homeTeam, awayTeam, homeScore, awayScore, time, timerScale = 1 }) => {
  const digit: React.CSSProperties = {
    fontSize: 128,
    fontWeight: 800,
    lineHeight: 1,
    color: "#FFFFFF",
    fontVariantNumeric: "tabular-nums",
    textShadow: "0 4px 24px rgba(120,165,255,0.35)",
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 170,
        left: 28,
        right: 28,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 22,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 200,
          boxSizing: "border-box",
          padding: "0 26px",
          borderRadius: 30,
          overflow: "hidden",
          background: "linear-gradient(180deg, rgba(28,40,66,0.96) 0%, rgba(12,19,36,0.96) 100%)",
          border: "1.5px solid rgba(170,195,255,0.16)",
          boxShadow:
            "0 30px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Subtle team-color accents on the outer edges */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, ${homeTeam.primaryColor}33 0%, transparent 28%, transparent 72%, ${awayTeam.primaryColor}33 100%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 4,
            background: `linear-gradient(90deg, ${homeTeam.primaryColor} 0%, transparent 40%, transparent 60%, ${awayTeam.primaryColor} 100%)`,
            opacity: 0.85,
          }}
        />
        <TeamSide team={homeTeam} side="left" />
        <div
          style={{
            position: "relative",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "0 22px",
            height: 150,
            borderRadius: 22,
            background: "rgba(4,8,18,0.55)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span style={digit}>{homeScore}</span>
          <span style={{ ...digit, fontSize: 80, color: "rgba(255,255,255,0.45)", textShadow: "none" }}>
            –
          </span>
          <span style={digit}>{awayScore}</span>
        </div>
        <TeamSide team={awayTeam} side="right" />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 44px",
          transform: `scale(${timerScale})`,
          borderRadius: 999,
          background: "linear-gradient(180deg, rgba(36,52,84,0.95), rgba(16,25,46,0.95))",
          border: "1.5px solid rgba(170,195,255,0.22)",
          boxShadow:
            "0 16px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.14), 0 0 30px rgba(100,150,255,0.15)",
          fontSize: 84,
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: 3,
          color: "#FFFFFF",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {time}
      </div>
    </div>
  );
};
