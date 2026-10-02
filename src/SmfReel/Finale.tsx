import React from "react";
import { Easing } from "remotion";
import { HUB, winCenter } from "./Building";
import {
  CX,
  CY,
  Cam,
  EASE_IO,
  EASE_OUT,
  GOLD,
  HEAD,
  P,
  T,
  WHITE,
  elbow,
  gold,
  lerp,
  pathD,
  pointAt,
  prog,
  toScreen,
  white,
} from "./theme";

/* ---------- wordmark with motion-blur resolve + light sweep ---------- */

export const Wordmark: React.FC<{ f: number; start: number; size: number }> = ({ f, start, size }) => {
  const p = prog(f, start, 24, EASE_OUT);
  const sw = prog(f, start + 6, 38, Easing.inOut(Easing.cubic));
  const pos = lerp(100, 0, sw);
  const bx = (1 - p) * 42;
  const grad = (base: string, hi: string) =>
    `linear-gradient(100deg, ${base} 0%, ${base} 40%, ${hi} 50%, ${base} 60%, ${base} 100%)`;
  const word = (t: string, base: string, hi: string) => (
    <span
      style={{
        backgroundImage: grad(base, hi),
        backgroundSize: "300% 100%",
        backgroundPosition: `${pos}% 0`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
      }}
    >
      {t}
    </span>
  );
  const base: React.CSSProperties = {
    fontFamily: HEAD,
    fontWeight: 700,
    fontSize: size,
    letterSpacing: "0.05em",
    lineHeight: 0.95,
    whiteSpace: "nowrap",
    paddingLeft: "0.05em",
  };
  return (
    <div style={{ position: "relative", transform: `scale(${lerp(1.3, 1, p)})`, opacity: p > 0 ? 1 : 0 }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={`mb-${start}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={`${bx} 0`} />
        </filter>
      </svg>
      <div
        style={{
          ...base,
          position: "absolute",
          left: 0,
          top: 0,
          color: GOLD,
          opacity: 0.32 * p,
          filter: "blur(30px)",
        }}
      >
        SMF GRUP
      </div>
      <div style={{ ...base, filter: bx > 0.4 ? `url(#mb-${start})` : undefined }}>
        {word("SMF", WHITE, GOLD)}
        {" "}
        {word("GRUP", GOLD, WHITE)}
      </div>
    </div>
  );
};

/* ---------- scene A: the centre system ---------- */

const RINGS = [150, 250, 360, 480];

export const CenterSystem: React.FC<{ f: number }> = ({ f }) => {
  if (f < T.impact - 2) return null;
  const fadeOut = 1 - prog(f, T.reveal, 24, Easing.linear);
  const calm = f >= T.smf ? 0.45 + 0.55 * (1 - prog(f, T.smf, 10, Easing.linear)) : 1;
  const flash = prog(f, T.impact, 18);
  const core = prog(f, T.impact, 10);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }} opacity={fadeOut}>
      <defs>
        <filter id="glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      {/* flash */}
      <circle cx={CX} cy={CY} r={lerp(30, 900, flash)} fill={gold(0.5 * (1 - flash) * (1 - flash))} />
      {/* shock rings */}
      {[0, 6, 12].map((d, i) => {
        const p = prog(f, T.impact + d, 44);
        return (
          <circle key={i} cx={CX} cy={CY} r={lerp(10, 1100, p)} fill="none" stroke={gold((1 - p) * 0.9)} strokeWidth={4 - i} />
        );
      })}
      {/* geometric order: concentric rings, spokes, ticks */}
      <g opacity={calm}>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2 + f * 0.0015;
          const p = prog(f, T.impact + 8, 30);
          return (
            <line
              key={i}
              x1={CX + Math.cos(a) * 60}
              y1={CY + Math.sin(a) * 60}
              x2={CX + Math.cos(a) * lerp(60, 480, p)}
              y2={CY + Math.sin(a) * lerp(60, 480, p)}
              stroke={white(0.08)}
              strokeWidth={1}
            />
          );
        })}
        {RINGS.map((r, i) => {
          const p = prog(f, T.impact + 2 + i * 5, 32);
          const circ = 2 * Math.PI * r;
          return (
            <circle
              key={i}
              cx={CX}
              cy={CY}
              r={r}
              fill="none"
              stroke={gold(i === 1 ? 0.9 : 0.55)}
              strokeWidth={i === 1 ? 2.5 : 1.5}
              strokeDasharray={`${circ * p} ${circ}`}
              transform={`rotate(${-90 + f * (i % 2 ? 0.25 : -0.18)} ${CX} ${CY})`}
            />
          );
        })}
        {Array.from({ length: 72 }, (_, i) => {
          const a = (i / 72) * Math.PI * 2 - f * 0.004;
          const major = i % 6 === 0;
          const p = prog(f, T.impact + 14 + i * 0.12, 16);
          return (
            <line
              key={i}
              x1={CX + Math.cos(a) * 360}
              y1={CY + Math.sin(a) * 360}
              x2={CX + Math.cos(a) * (360 + (major ? 26 : 12) * p)}
              y2={CY + Math.sin(a) * (360 + (major ? 26 : 12) * p)}
              stroke={major ? GOLD : gold(0.6)}
              strokeWidth={major ? 2.5 : 1.2}
            />
          );
        })}
        {RINGS.map((r, i) => {
          const a = f * (i % 2 ? -0.02 : 0.027) + i * 1.7;
          return (
            <g key={i}>
              <circle cx={CX + Math.cos(a) * r} cy={CY + Math.sin(a) * r} r={6} fill={WHITE} opacity={prog(f, T.impact + 30, 10)} />
              <circle cx={CX + Math.cos(a) * r} cy={CY + Math.sin(a) * r} r={14} fill="none" stroke={gold(0.6)} strokeWidth={1.5} opacity={prog(f, T.impact + 30, 10)} />
            </g>
          );
        })}
      </g>
      {/* the single centre point */}
      <circle cx={CX} cy={CY} r={30 * core} fill={GOLD} filter="url(#glow)" opacity={0.9 * calm} />
      <circle cx={CX} cy={CY} r={11 * core} fill={WHITE} opacity={Math.min(1, calm * 1.6)} />
    </svg>
  );
};

/* ---------- scene B: orderly system around the building ---------- */

const beat = (f: number) => (f >= 345 ? (f - 345) % 15 : -1);

const ORBITS = [
  { rx: 520, ry: 120, n: 6, dir: 1 },
  { rx: 380, ry: 84, n: 5, dir: -1 },
];

export const Orbits: React.FC<{ f: number; cam: Cam; part: "back" | "front"; opacity: number }> = ({
  f,
  cam,
  part,
  opacity,
}) => {
  const c = toScreen(cam, 545, 1430);
  const p = prog(f, T.reveal + 6, 30);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }} opacity={opacity * p}>
      {ORBITS.map((o, i) => {
        const rx = o.rx * cam.s;
        const ry = o.ry * cam.s;
        const d =
          part === "back"
            ? `M${c.x - rx},${c.y} A${rx},${ry} 0 0 1 ${c.x + rx},${c.y}`
            : `M${c.x - rx},${c.y} A${rx},${ry} 0 0 0 ${c.x + rx},${c.y}`;
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={gold(part === "back" ? 0.3 : 0.6)} strokeWidth={1.5} />
            {Array.from({ length: o.n }, (_, j) => {
              const a = (j / o.n) * Math.PI * 2 + o.dir * f * 0.02;
              const front = Math.sin(a) > 0;
              if ((part === "front") !== front) return null;
              return (
                <g key={j}>
                  <circle cx={c.x + rx * Math.cos(a)} cy={c.y + ry * Math.sin(a)} r={5.5} fill={GOLD} />
                  <circle cx={c.x + rx * Math.cos(a)} cy={c.y + ry * Math.sin(a)} r={12} fill="none" stroke={gold(0.5)} strokeWidth={1.2} />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

const LEVELS = [4, 7, 10, 13];
const RAIL_L = 110;
const RAIL_R = 970;
const RAIL_TOP = 760;
const RAIL_BOT = 1560;

export const Systems: React.FC<{ f: number; cam: Cam; opacity: number }> = ({ f, cam, opacity }) => {
  const k = beat(f);
  const draw = prog(f, T.reveal + 14, 30, EASE_IO);
  const hub = toScreen(cam, HUB.x, HUB.y);
  const beatU = k >= 0 && k <= 12 ? k / 12 : -1;

  const branches: { pts: P[]; right: boolean }[] = [];
  LEVELS.forEach((r) => {
    const l = winCenter(false, r, 0);
    const rr = winCenter(true, r, 1);
    const lp = toScreen(cam, 330, l.y);
    const rp = toScreen(cam, 760, rr.y - 8);
    branches.push({ pts: [lp, { x: RAIL_L, y: lp.y }], right: false });
    branches.push({ pts: [rp, { x: RAIL_R, y: rp.y }], right: true });
  });
  const hubLines = [
    elbow(hub, { x: RAIL_L, y: RAIL_TOP }),
    elbow(hub, { x: RAIL_R, y: RAIL_TOP }),
  ];

  const pulse = (pts: P[]) => {
    if (beatU < 0) return null;
    const h = pointAt(pts, beatU);
    const t = pointAt(pts, Math.max(0, beatU - 0.12));
    return (
      <g>
        <line x1={t.x} y1={t.y} x2={h.x} y2={h.y} stroke={gold(0.95)} strokeWidth={3} strokeLinecap="round" />
        <circle cx={h.x} cy={h.y} r={3.5} fill={WHITE} />
      </g>
    );
  };

  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }} opacity={opacity}>
      {[RAIL_L, RAIL_R].map((x, i) => (
        <g key={i}>
          <line x1={x} y1={RAIL_BOT} x2={x} y2={lerp(RAIL_BOT, RAIL_TOP, draw)} stroke={white(0.4)} strokeWidth={2} />
          {Array.from({ length: 21 }, (_, j) => {
            const y = RAIL_BOT - j * 40;
            return <line key={j} x1={x - 8} y1={y} x2={x + 8} y2={y} stroke={white(0.25)} strokeWidth={1.2} opacity={draw} />;
          })}
          {beatU >= 0 && (
            <line
              x1={x}
              y1={lerp(RAIL_BOT, RAIL_TOP, beatU)}
              x2={x}
              y2={lerp(RAIL_BOT, RAIL_TOP, beatU) + 90}
              stroke={gold(0.9 * (1 - beatU * 0.6))}
              strokeWidth={4}
              strokeLinecap="round"
            />
          )}
        </g>
      ))}
      {branches.map((b, i) => (
        <g key={i}>
          <path d={pathD(b.pts)} pathLength={1} strokeDasharray="1 1.01" strokeDashoffset={1 - draw} stroke={white(0.3)} strokeWidth={1.5} fill="none" />
          <rect x={b.pts[1].x - 5} y={b.pts[1].y - 5} width={10} height={10} fill={GOLD} opacity={draw} />
          {draw > 0.95 && pulse(b.pts)}
        </g>
      ))}
      {hubLines.map((pts, i) => (
        <g key={i}>
          <path d={pathD(pts)} pathLength={1} strokeDasharray="1 1.01" strokeDashoffset={1 - draw} stroke={gold(0.6)} strokeWidth={1.5} fill="none" />
          {draw > 0.95 && pulse(pts)}
        </g>
      ))}
      <circle cx={hub.x} cy={hub.y} r={7} fill={GOLD} />
      {k >= 0 && (
        <circle cx={hub.x} cy={hub.y} r={10 + 34 * (k / 15)} fill="none" stroke={gold(0.7 * (1 - k / 15))} strokeWidth={2} />
      )}
      <circle cx={hub.x} cy={hub.y} r={16} fill="none" stroke={gold(0.5)} strokeWidth={1.2} />
    </svg>
  );
};

export const Emblem: React.FC<{ f: number; start: number; size: number }> = ({ f, start, size }) => {
  const p = prog(f, start, 26);
  const c1 = 2 * Math.PI * 44;
  const c2 = 2 * Math.PI * 24;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" opacity={p > 0 ? 1 : 0}>
      <circle cx={50} cy={50} r={44} fill="none" stroke={GOLD} strokeWidth={2} strokeDasharray={`${c1 * p} ${c1}`} transform="rotate(-90 50 50)" />
      <circle cx={50} cy={50} r={24} fill="none" stroke={white(0.7)} strokeWidth={1.5} strokeDasharray={`${c2 * p} ${c2}`} transform="rotate(-90 50 50)" />
      <circle cx={50} cy={50} r={6 * p} fill={GOLD} />
    </svg>
  );
};

export { CY };
