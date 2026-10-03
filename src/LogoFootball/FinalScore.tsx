import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Final result after the game: just the numbers, nothing else
const ScoreCard: React.FC<{
  homeScore: number;
  awayScore: number;
  homeColor: string;
  awayColor: string;
}> = ({ homeScore, awayScore, homeColor, awayColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 180, mass: 0.8 } });
  const scale = interpolate(enter, [0, 1], [0.82, 1]);
  const dim = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  const digit: React.CSSProperties = {
    fontSize: 340,
    fontWeight: 800,
    lineHeight: 1,
    color: "#FFFFFF",
    fontVariantNumeric: "tabular-nums",
    textShadow: "0 0 50px rgba(120,165,255,0.45), 0 14px 40px rgba(0,0,0,0.6)",
  };
  // Thin team-color bar under each number (no names, no labels)
  const bar = (color: string): React.CSSProperties => ({
    height: 12,
    width: "80%",
    margin: "18px auto 0",
    borderRadius: 6,
    background: color,
    boxShadow: `0 0 24px ${color}`,
    transform: `scaleX(${enter})`,
  });

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: "rgba(3,6,14,0.8)",
          backdropFilter: `blur(${dim * 8}px)`,
          opacity: dim,
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 60% 25% at 50% 50%, rgba(90,140,255,0.22) 0%, transparent 70%)",
          opacity: dim,
        }}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 50,
            opacity: Math.min(1, enter * 1.4),
            transform: `scale(${scale})`,
          }}
        >
          <div>
            <div style={digit}>{homeScore}</div>
            <div style={bar(homeColor)} />
          </div>
          <div style={{ ...digit, fontSize: 280, color: "rgba(255,255,255,0.55)", marginTop: -50 }}>
            -
          </div>
          <div>
            <div style={digit}>{awayScore}</div>
            <div style={bar(awayColor)} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Shown from the end of the game until the end of the composition */
export const FinalScore: React.FC<{
  gameFrames: number;
  homeScore: number;
  awayScore: number;
  homeColor: string;
  awayColor: string;
}> = ({ gameFrames, ...score }) => {
  return (
    <Sequence from={gameFrames} name="Final score">
      <ScoreCard {...score} />
    </Sequence>
  );
};
