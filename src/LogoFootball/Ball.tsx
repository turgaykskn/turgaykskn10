import React from "react";

// Pentagon centered at (cx, cy) with radius r
const pentagon = (cx: number, cy: number, r: number, rot: number) =>
  Array.from({ length: 5 }, (_, i) => {
    const a = ((rot + i * 72) * Math.PI) / 180;
    return `${cx + r * Math.sin(a)},${cy - r * Math.cos(a)}`;
  }).join(" ");

const OUTER = [0, 72, 144, 216, 288].map((deg) => {
  const a = (deg * Math.PI) / 180;
  return { deg, x: 50 + 44 * Math.sin(a), y: 50 - 44 * Math.cos(a) };
});

// Simple football drawn in SVG. x/y are arena coordinates of the ball center.
export const Ball: React.FC<{ x: number; y: number; size: number }> = ({
  x,
  y,
  size,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        filter:
          "drop-shadow(0 10px 14px rgba(0,0,0,0.55)) drop-shadow(0 0 18px rgba(180,205,255,0.25))",
      }}
    >
      <defs>
        <clipPath id="lf-ball-clip">
          <circle cx="50" cy="50" r="48" />
        </clipPath>
        <radialGradient id="lf-ball-shade" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.6" stopColor="#7C8AA5" stopOpacity={0.15} />
          <stop offset="1" stopColor="#0B1222" stopOpacity={0.6} />
        </radialGradient>
        <radialGradient id="lf-ball-shine" cx="34%" cy="26%" r="22%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="#F5F7FB" />
      <g clipPath="url(#lf-ball-clip)">
        <g stroke="#B8C2D4" strokeWidth={1.4}>
          {OUTER.map((p) => {
            const a = (p.deg * Math.PI) / 180;
            return (
              <line
                key={p.deg}
                x1={50 + 15 * Math.sin(a)}
                y1={50 - 15 * Math.cos(a)}
                x2={p.x}
                y2={p.y}
              />
            );
          })}
        </g>
        <g fill="#141A28">
          <polygon points={pentagon(50, 50, 15, 0)} />
          {OUTER.map((p) => (
            <polygon key={p.deg} points={pentagon(p.x, p.y, 13, p.deg + 36)} />
          ))}
        </g>
        <circle cx="50" cy="50" r="48" fill="url(#lf-ball-shade)" />
        <circle cx="50" cy="50" r="48" fill="url(#lf-ball-shine)" />
      </g>
      <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(10,16,30,0.5)" strokeWidth={1.5} />
    </svg>
  );
};
