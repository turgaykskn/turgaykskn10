import React from "react";
import { HEAD, EASE_IN, EASE_OUT, GOLD, WHITE, prog } from "./theme";

export type Part = { t: string; c?: string };

type LineProps = {
  parts: Part[];
  f: number; // frame (local to the caller's timeline)
  start: number;
  end?: number; // exit start; omit to stay
  size: number;
  tracking?: number;
  stagger?: number;
  exitDir?: "up" | "in"; // "in" = collapse towards the centre
};

// Masked kinetic line: characters rise out of a clip box with horizontal
// motion blur, and leave upward (or collapse inward).
export const KLine: React.FC<LineProps> = ({
  parts,
  f,
  start,
  end,
  size,
  tracking = 0.01,
  stagger = 1.1,
  exitDir = "up",
}) => {
  const chars: { ch: string; c: string }[] = [];
  parts.forEach((p) =>
    Array.from(p.t).forEach((ch) => chars.push({ ch, c: p.c ?? WHITE })),
  );
  const n = chars.length;
  const inEnd = start + 20 + n * stagger;
  const entering = prog(f, start, inEnd - start, EASE_OUT);
  const exitP = end === undefined ? 0 : prog(f, end, 16, EASE_IN);
  const blur = (1 - entering) * 16 + exitP * 14;

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        padding: `${size * 0.26}px ${size * 0.06}px ${size * 0.1}px`,
        margin: `${-size * 0.26}px ${-size * 0.06}px ${-size * 0.1}px`,
        whiteSpace: "nowrap",
        lineHeight: 0.92,
        height: size * 0.92,
        boxSizing: "content-box",
        filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
        opacity: 1 - exitP * 0.9,
        transform:
          exitDir === "in"
            ? `scale(${1 - exitP * 0.85})`
            : `translateY(${-exitP * size * 0.5}px)`,
      }}
    >
      {chars.map((c, i) => {
        const p = prog(f, start + i * stagger, 20, EASE_OUT);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontFamily: HEAD,
              fontWeight: 700,
              fontSize: size,
              letterSpacing: `${tracking}em`,
              color: c.c,
              transform: `translateY(${(1 - p) * 115}%)`,
              opacity: p > 0 ? 1 : 0,
            }}
          >
            {c.ch === " " ? " " : c.ch}
          </span>
        );
      })}
    </div>
  );
};

export const TextBlock: React.FC<{
  children: React.ReactNode;
  y: number; // vertical centre (px)
  gap?: number;
}> = ({ children, y, gap = 6 }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: y,
      transform: "translateY(-50%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap,
    }}
  >
    {children}
  </div>
);

export const Gold = GOLD;
