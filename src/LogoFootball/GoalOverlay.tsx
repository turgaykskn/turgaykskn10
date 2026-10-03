import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import type { GoalEvent } from "./motion";
import type { Team } from "./types";

// Italic cut for the title (same family as the rest of the composition)
loadFont("italic", { weights: ["800"], subsets: ["latin", "latin-ext"] });

export const GOAL_OVERLAY_SECONDS = 1.5;
const FADE_OUT_SECONDS = 0.25;

const GoalCard: React.FC<{ event: GoalEvent; team: Team; length: number }> = ({
  event,
  team,
  length,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const color = team.primaryColor;

  // Entrance: quick scale-down "punch" with a slight settle
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 220, mass: 0.7 } });
  const scale = interpolate(enter, [0, 1], [1.45, 1]);
  const fadeOut = Math.round(FADE_OUT_SECONDS * fps);
  const exit = interpolate(frame, [length - fadeOut, length], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });
  const opacity = Math.min(interpolate(frame, [0, 2], [0.6, 1], { extrapolateRight: "clamp" }), exit);
  // Short impact flash
  const flash = interpolate(frame, [0, 6], [0.28, 0], { extrapolateRight: "clamp" });
  // Details slide in a moment later
  const details = spring({ frame: frame - 5, fps, config: { damping: 18, stiffness: 160 } });

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Light dark overlay; the game stays visible */}
      <AbsoluteFill style={{ background: "rgba(3,6,14,0.42)" }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 22% at 50% 50%, ${color}55 0%, transparent 70%)`,
        }}
      />
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash }} />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        {/* Team-color light band behind the title */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: 430,
            marginTop: -285,
            background: `linear-gradient(90deg, transparent 0%, ${color}66 30%, ${color}66 70%, transparent 100%)`,
            borderTop: "2px solid rgba(255,255,255,0.18)",
            borderBottom: "2px solid rgba(255,255,255,0.18)",
            transform: `scaleX(${enter})`,
          }}
        />
        <div
          style={{
            position: "relative",
            fontSize: 250,
            fontWeight: 800,
            fontStyle: "italic",
            lineHeight: 1,
            letterSpacing: 4,
            color: "#FFFFFF",
            transform: `scale(${scale})`,
            textShadow: `0 0 30px ${color}, 0 0 80px ${color}AA, 0 10px 30px rgba(0,0,0,0.6)`,
            marginTop: -60,
          }}
        >
          GOOOL!
        </div>
        <div
          style={{
            position: "relative",
            marginTop: 70,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
            opacity: details,
            transform: `translateY(${(1 - details) * 30}px)`,
          }}
        >
          <div
            style={{
              maxWidth: 900,
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: 6,
              color: "#FFFFFF",
              textTransform: "uppercase",
              textAlign: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              paddingBottom: 8,
              borderBottom: `5px solid ${color}`,
            }}
          >
            {team.name}
          </div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 800,
              color: "#FFFFFF",
              fontVariantNumeric: "tabular-nums",
              padding: "2px 34px",
              borderRadius: 18,
              background: "rgba(10,16,30,0.75)",
              border: "1.5px solid rgba(170,195,255,0.2)",
            }}
          >
            {event.homeScore} - {event.awayScore}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** One "GOOOL!" card per goal event, starting exactly on the goal frame */
export const GoalOverlay: React.FC<{
  goalEvents: GoalEvent[];
  homeTeam: Team;
  awayTeam: Team;
  /** The overlay never runs into the final score screen */
  gameFrames: number;
}> = ({ goalEvents, homeTeam, awayTeam, gameFrames }) => {
  const { fps } = useVideoConfig();
  const full = Math.round(GOAL_OVERLAY_SECONDS * fps);
  return (
    <>
      {goalEvents.map((e, i) => {
        const next = goalEvents[i + 1];
        const length = Math.min(full, (next?.frame ?? gameFrames) - e.frame);
        return (
          <Sequence
            key={e.frame}
            from={e.frame}
            durationInFrames={length}
            name={`GOOOL ${e.homeScore}-${e.awayScore}`}
          >
            <GoalCard
              event={e}
              team={e.scoringTeam === "home" ? homeTeam : awayTeam}
              length={length}
            />
          </Sequence>
        );
      })}
    </>
  );
};
