import React from "react";
import { ARENA_RING, ringRadius } from "./config";

// Circular pitch. Children are positioned in arena coordinates (0..size).
export const Arena: React.FC<{
  size: number;
  centerY: number;
  /** Height of the goal mouths; the boundary ring is left open there */
  goalMouth: number;
  children?: React.ReactNode;
}> = ({ size, centerY, goalMouth, children }) => {
  const c = size / 2;
  const r = ringRadius(size);
  const dx = Math.sqrt(r * r - (goalMouth / 2) ** 2);
  const dy = goalMouth / 2;
  const topArc = `M ${c - dx} ${c - dy} A ${r} ${r} 0 0 1 ${c + dx} ${c - dy}`;
  const bottomArc = `M ${c + dx} ${c + dy} A ${r} ${r} 0 0 1 ${c - dx} ${c + dy}`;
  const line = "rgba(190,210,255,0.10)";

  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - size) / 2,
        top: centerY - size / 2,
        width: size,
        height: size,
      }}
    >
      {/* Floor */}
      <div
        style={{
          position: "absolute",
          inset: ARENA_RING / 2,
          borderRadius: "50%",
          background: `repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 ${size / 12}px, transparent ${size / 12}px ${size / 6}px),
            radial-gradient(circle at 50% 42%, #13213A 0%, #0B1528 55%, #070D1A 100%)`,
          boxShadow:
            "inset 0 0 90px rgba(0,0,0,0.75), inset 0 0 18px rgba(120,160,255,0.12), 0 40px 120px rgba(0,0,0,0.6)",
        }}
      />

      {/* Pitch markings */}
      <svg
        width={size}
        height={size}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <clipPath id="lf-floor-clip">
            <circle cx={c} cy={c} r={r} />
          </clipPath>
        </defs>
        <g clipPath="url(#lf-floor-clip)" fill="none" stroke={line} strokeWidth={4}>
          <line x1={c} y1={0} x2={c} y2={size} />
          <circle cx={c} cy={c} r={size * 0.16} />
          <circle cx={0} cy={c} r={size * 0.24} />
          <circle cx={size} cy={c} r={size * 0.24} />
          <circle cx={0} cy={c} r={size * 0.12} />
          <circle cx={size} cy={c} r={size * 0.12} />
        </g>
        <circle cx={c} cy={c} r={7} fill={line} />
      </svg>

      {/* Glowing boundary, open at the goal mouths */}
      <svg
        width={size}
        height={size}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <defs>
          <filter id="lf-ring-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={10} />
          </filter>
        </defs>
        <g fill="none" strokeLinecap="round">
          <g stroke="rgba(110,160,255,0.55)" strokeWidth={ARENA_RING * 3} filter="url(#lf-ring-glow)">
            <path d={topArc} />
            <path d={bottomArc} />
          </g>
          <g stroke="#E6EEFF" strokeWidth={ARENA_RING}>
            <path d={topArc} />
            <path d={bottomArc} />
          </g>
        </g>
      </svg>

      {children}
    </div>
  );
};
