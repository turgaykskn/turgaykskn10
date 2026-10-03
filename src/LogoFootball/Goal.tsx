import React from "react";
import { goalPostInset } from "./config";

// Goal set into the arena boundary. Posts sit exactly on the ring,
// the net box extends outward beyond the circle.
export const Goal: React.FC<{
  side: "left" | "right";
  arenaSize: number;
  mouthHeight: number;
  depth: number;
  color: string;
}> = ({ side, arenaSize, mouthHeight, depth, color }) => {
  const inset = goalPostInset(arenaSize, mouthHeight);
  const w = depth + inset;
  const h = mouthHeight;
  const corner = 14;
  const id = `lf-goal-${side}`;

  // Drawn for the left side; mirrored for the right
  const frame = `M ${w} 0 H ${corner} Q 0 0 0 ${corner} V ${h - corner} Q 0 ${h} ${corner} ${h} H ${w}`;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{
        position: "absolute",
        left: side === "left" ? -depth : arenaSize - inset,
        top: arenaSize / 2 - h / 2,
        overflow: "visible",
        transform: side === "right" ? "scaleX(-1)" : undefined,
      }}
    >
      <defs>
        <pattern id={`${id}-net`} width={12} height={12} patternUnits="userSpaceOnUse">
          <path d="M 0 0 L 12 12 M 12 0 L 0 12" stroke="rgba(220,230,255,0.22)" strokeWidth={1.5} />
        </pattern>
        <linearGradient id={`${id}-fill`} x1="0" x2="1">
          <stop offset="0" stopColor={color} stopOpacity={0.35} />
          <stop offset="1" stopColor={color} stopOpacity={0.05} />
        </linearGradient>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      <path d={`${frame} Z`} fill="#050A14" />
      <path d={`${frame} Z`} fill={`url(#${id}-fill)`} />
      <path d={`${frame} Z`} fill={`url(#${id}-net)`} />
      <path d={frame} fill="none" stroke="rgba(110,160,255,0.55)" strokeWidth={12} filter={`url(#${id}-glow)`} />
      <path d={frame} fill="none" stroke="#E6EEFF" strokeWidth={5} strokeLinejoin="round" />
      {[0, h].map((y) => (
        <circle key={y} cx={w} cy={y} r={9} fill="#FFFFFF" stroke={color} strokeWidth={4} />
      ))}
    </svg>
  );
};
