import React from "react";
import { Easing, random } from "remotion";
import { winCenter } from "./Building";
import {
  CX,
  CY,
  Cam,
  EASE_IN,
  EASE_OUT,
  GOLD,
  HEAD,
  MONO,
  P,
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

const WW = 400;
const C: P = { x: CX, y: CY };

type Spec = {
  label: string;
  x: number;
  y: number;
  start: number;
  side: "L" | "R";
  anchors: { side: boolean; r: number; c: number }[];
};

const SPECS: Spec[] = [
  {
    label: "MALİ KONTROL",
    x: 80,
    y: 300,
    start: 95,
    side: "L",
    anchors: [
      { side: false, r: 2, c: 0 },
      { side: false, r: 5, c: 1 },
      { side: false, r: 8, c: 0 },
    ],
  },
  {
    label: "TEKNİK TAKİP",
    x: 600,
    y: 430,
    start: 120,
    side: "R",
    anchors: [
      { side: true, r: 1, c: 1 },
      { side: true, r: 4, c: 0 },
      { side: false, r: 3, c: 4 },
    ],
  },
  {
    label: "ENERJİ YÖNETİMİ",
    x: 80,
    y: 1180,
    start: 145,
    side: "L",
    anchors: [
      { side: false, r: 11, c: 0 },
      { side: false, r: 13, c: 1 },
      { side: false, r: 9, c: 2 },
    ],
  },
  {
    label: "DÜZENLİ DENETİM",
    x: 600,
    y: 1300,
    start: 168,
    side: "R",
    anchors: [
      { side: true, r: 10, c: 1 },
      { side: true, r: 12, c: 0 },
      { side: false, r: 8, c: 4 },
    ],
  },
];

const fmt = (n: number) => Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/* ---------- widgets ---------- */

const Label: React.FC<{ spec: Spec; idx: number; r: number }> = ({ spec, idx, r }) => (
  <g>
    <clipPath id={`lbl-${idx}`}>
      <rect x={spec.x} y={spec.y - 14} width={WW * r + 4} height={64} />
    </clipPath>
    <text
      x={spec.x}
      y={spec.y + 32}
      fontFamily={HEAD}
      fontWeight={700}
      fontSize={42}
      letterSpacing={4}
      fill={GOLD}
      clipPath={`url(#lbl-${idx})`}
    >
      {spec.label}
    </text>
    <line x1={spec.x} y1={spec.y + 50} x2={spec.x + WW * r} y2={spec.y + 50} stroke={gold(0.9)} strokeWidth={2} />
    <line x1={spec.x} y1={spec.y + 50} x2={spec.x} y2={spec.y + 62} stroke={gold(0.9)} strokeWidth={2} opacity={r} />
    <line x1={spec.x + WW} y1={spec.y + 50} x2={spec.x + WW} y2={spec.y + 62} stroke={gold(0.9)} strokeWidth={2} opacity={r} />
  </g>
);

const Finance: React.FC<{ s: Spec; f: number; r: number }> = ({ s, f, r }) => {
  const t = f - s.start;
  return (
    <g opacity={r}>
      <text x={s.x} y={s.y + 128} fontFamily={MONO} fontWeight={500} fontSize={52} fill={WHITE}>
        {fmt(1482930 + t * 137 + Math.sin(t * 0.7) * 60)}
      </text>
      {Array.from({ length: 6 }, (_, i) => {
        const v = (0.28 + 0.66 * Math.abs(Math.sin(t * 0.035 * (1 + i * 0.3) + i * 1.3))) * prog(f, s.start + 10 + i * 3, 14);
        return (
          <g key={i}>
            <rect x={s.x} y={s.y + 160 + i * 17} width={WW} height={6} fill={white(0.1)} />
            <rect x={s.x} y={s.y + 160 + i * 17} width={WW * v} height={6} fill={gold(0.85)} />
          </g>
        );
      })}
    </g>
  );
};

const Technical: React.FC<{ s: Spec; f: number; r: number }> = ({ s, f, r }) => {
  const t = f - s.start;
  const cx = s.x + 120;
  const cy = s.y + 205;
  const R = 95;
  const v = 0.5 + 0.34 * Math.sin(t * 0.06) * prog(f, s.start + 6, 20);
  const th = Math.PI * (1 + v);
  const p = { x: cx + R * Math.cos(th), y: cy + R * Math.sin(th) };
  return (
    <g opacity={r}>
      <path d={`M${cx - R},${cy} A${R},${R} 0 0 1 ${cx + R},${cy}`} fill="none" stroke={white(0.14)} strokeWidth={8} />
      <path d={`M${cx - R},${cy} A${R},${R} 0 0 1 ${p.x},${p.y}`} fill="none" stroke={gold(0.95)} strokeWidth={8} />
      {Array.from({ length: 11 }, (_, i) => {
        const a = Math.PI * (1 + i / 10);
        return (
          <line
            key={i}
            x1={cx + (R - 18) * Math.cos(a)}
            y1={cy + (R - 18) * Math.sin(a)}
            x2={cx + (R - 28) * Math.cos(a)}
            y2={cy + (R - 28) * Math.sin(a)}
            stroke={white(0.35)}
            strokeWidth={2}
          />
        );
      })}
      <line x1={cx} y1={cy} x2={cx + (R - 34) * Math.cos(th)} y2={cy + (R - 34) * Math.sin(th)} stroke={WHITE} strokeWidth={3} />
      <circle cx={cx} cy={cy} r={7} fill={GOLD} />
      {Array.from({ length: 10 }, (_, i) => {
        const on = Math.sin(t * 0.14 + i * 2.1) > -0.2;
        return (
          <circle
            key={i}
            cx={s.x + 250 + (i % 5) * 34}
            cy={s.y + 130 + Math.floor(i / 5) * 34}
            r={6}
            fill={on ? gold(0.95) : "none"}
            stroke={gold(0.6)}
            strokeWidth={1.5}
          />
        );
      })}
      {Array.from({ length: 5 }, (_, i) => {
        const h = 10 + 46 * Math.abs(Math.sin(t * 0.08 + i * 0.9));
        return <rect key={i} x={s.x + 250 + i * 34 - 4} y={s.y + 205 - h} width={8} height={h} fill={white(0.55)} />;
      })}
    </g>
  );
};

const Energy: React.FC<{ s: Spec; f: number; r: number }> = ({ s, f, r }) => {
  const t = f - s.start;
  const N = 48;
  const pts: P[] = Array.from({ length: N }, (_, i) => ({
    x: s.x + (i * WW) / (N - 1),
    y: s.y + 140 + 34 * Math.sin(i * 0.33 - t * 0.12) + 14 * Math.sin(i * 0.9 + t * 0.07),
  }));
  const mi = Math.floor((t * 0.9) % N);
  return (
    <g opacity={r}>
      <clipPath id="en-clip">
        <rect x={s.x} y={s.y + 60} width={WW * r} height={200} />
      </clipPath>
      <g clipPath="url(#en-clip)">
        <path d={`${pathD(pts)} L${s.x + WW},${s.y + 190} L${s.x},${s.y + 190} Z`} fill={gold(0.08)} />
        <path d={pathD(pts)} fill="none" stroke={GOLD} strokeWidth={3} strokeLinejoin="round" />
      </g>
      <circle cx={pts[mi].x} cy={pts[mi].y} r={6} fill={WHITE} />
      <circle cx={pts[mi].x} cy={pts[mi].y} r={14} fill="none" stroke={gold(0.6)} strokeWidth={1.5} />
      <text x={s.x + WW} y={s.y + 96} textAnchor="end" fontFamily={MONO} fontWeight={500} fontSize={34} fill={WHITE}>
        {(312.4 + Math.sin(t * 0.09) * 18).toFixed(1)}
      </text>
      {Array.from({ length: 28 }, (_, i) => {
        const h = 6 + 24 * Math.abs(Math.sin(t * 0.1 + i * 0.7)) * prog(f, s.start + 8 + i * 0.6, 12);
        return <rect key={i} x={s.x + i * (WW / 28) + 1} y={s.y + 232 - h} width={7} height={h} fill={gold(0.65)} />;
      })}
    </g>
  );
};

const Audit: React.FC<{ s: Spec; f: number; r: number }> = ({ s, f, r }) => {
  const t = f - s.start;
  const cx = s.x + 100;
  const cy = s.y + 180;
  const R = 66;
  const circ = 2 * Math.PI * R;
  const v = 0.87 * prog(f, s.start + 8, 60, Easing.out(Easing.cubic));
  const scanY = s.y + 118 + ((t * 1.7) % 150);
  return (
    <g opacity={r}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={white(0.14)} strokeWidth={8} />
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke={GOLD}
        strokeWidth={8}
        strokeDasharray={`${circ * v} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy + 13} textAnchor="middle" fontFamily={MONO} fontWeight={500} fontSize={36} fill={WHITE}>
        {Math.round(v * 100)}
      </text>
      {Array.from({ length: 4 }, (_, i) => {
        const y = s.y + 124 + i * 38;
        const done = prog(f, s.start + 26 + i * 16, 10, Easing.linear);
        return (
          <g key={i}>
            <rect x={s.x + 208} y={y} width={22} height={22} fill="none" stroke={white(0.4)} strokeWidth={1.5} />
            <path
              d={`M${s.x + 213},${y + 12} L${s.x + 218},${y + 17} L${s.x + 227},${y + 5}`}
              fill="none"
              stroke={GOLD}
              strokeWidth={3}
              pathLength={1}
              strokeDasharray="1 1.01"
              strokeDashoffset={1 - done}
            />
            <rect x={s.x + 246} y={y + 8} width={110 + (i % 2) * 34} height={6} fill={white(0.2)} />
          </g>
        );
      })}
      <line x1={s.x + 200} y1={scanY} x2={s.x + WW} y2={scanY} stroke={gold(0.55)} strokeWidth={2} />
    </g>
  );
};

const WIDGETS = [Finance, Technical, Energy, Audit];

/* ---------- network ---------- */

const LINES = SPECS.flatMap((s, si) =>
  s.anchors.map((a, i) => ({
    si,
    a,
    i,
    ph: random(`ph-${si}-${i}`),
    spd: 0.011 + random(`sp-${si}-${i}`) * 0.008,
  })),
);

export const Network: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const k = prog(f, 100, 100, Easing.linear); // complexity ramp
  const e = prog(f, 210, 26, EASE_IN); // converge
  const dim = 1 - 0.68 * prog(f, 177, 12) + 0.68 * prog(f, 204, 6);
  const extra = f > 190 ? Math.pow((f - 190) / 22, 2) * 0.35 : 0;

  const ends = LINES.map((ln) => {
    const s = SPECS[ln.si];
    const a0 = winCenter(ln.a.side, ln.a.r, ln.a.c);
    const aS = toScreen(cam, a0.x, a0.y);
    const tgt: P = { x: s.side === "L" ? s.x + WW : s.x, y: s.y + 90 + ln.i * 46 };
    return { a: { x: lerp(aS.x, C.x, e), y: lerp(aS.y, C.y, e) }, b: { x: lerp(tgt.x, C.x, e), y: lerp(tgt.y, C.y, e) } };
  });

  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      {/* bus lines linking the four processes */}
      {[
        [{ x: 62, y: 330 }, { x: 62, y: 1440 }],
        [{ x: 1018, y: 470 }, { x: 1018, y: 1590 }],
      ].map((b, i) => {
        const p = prog(f, 150 + i * 14, 40, Easing.bezier(0.4, 0, 0.2, 1)) * k;
        const pts = b.map((q) => ({ x: lerp(q.x, C.x, e), y: lerp(q.y, C.y, e) }));
        const pl = pointAt(pts, (f * 0.012 + i * 0.5 + extra) % 1);
        return (
          <g key={i} opacity={dim}>
            <path d={pathD(pts)} pathLength={1} strokeDasharray="1 1.01" strokeDashoffset={1 - p} stroke={white(0.25)} strokeWidth={1.5} fill="none" />
            {p > 0.2 && <circle cx={pl.x} cy={pl.y} r={4} fill={GOLD} />}
          </g>
        );
      })}
      {LINES.map((ln, idx) => {
        const s = SPECS[ln.si];
        const { a, b } = ends[idx];
        const pts = elbow(a, b);
        const p = prog(f, s.start - 12 + ln.i * 7, 26, Easing.bezier(0.4, 0, 0.2, 1));
        if (p <= 0) return null;
        const npulse = 1 + Math.floor(k * 3);
        return (
          <g key={idx} opacity={dim}>
            <path d={pathD(pts)} pathLength={1} strokeDasharray="1 1.01" strokeDashoffset={1 - p} stroke={white(0.28)} strokeWidth={1.5} fill="none" />
            <circle cx={a.x} cy={a.y} r={5} fill={GOLD} />
            <circle cx={a.x} cy={a.y} r={10 + 8 * (((f + idx * 9) % 36) / 36)} fill="none" stroke={gold(0.5 * (1 - ((f + idx * 9) % 36) / 36))} strokeWidth={1.2} />
            {p > 0.95 &&
              Array.from({ length: npulse }, (_, j) => {
                const u = (ln.ph + j / npulse + f * ln.spd * (1 + k) + extra) % 1;
                const h = pointAt(pts, u);
                const t = pointAt(pts, Math.max(0, u - 0.05));
                return (
                  <g key={j}>
                    <line x1={t.x} y1={t.y} x2={h.x} y2={h.y} stroke={gold(0.9)} strokeWidth={3} strokeLinecap="round" />
                    <circle cx={h.x} cy={h.y} r={3.5} fill={WHITE} />
                  </g>
                );
              })}
            <rect x={b.x - 4} y={b.y - 4} width={8} height={8} fill={GOLD} opacity={p > 0.95 ? 1 : 0} />
          </g>
        );
      })}
      {SPECS.map((s, i) => {
        const r = prog(f, s.start, 22);
        if (r <= 0) return null;
        const Wd = WIDGETS[i];
        const wc = { x: s.x + WW / 2, y: s.y + 130 };
        const sc = 1 - 0.85 * e;
        const dx = (C.x - wc.x) * e;
        const dy = (C.y - wc.y) * e;
        return (
          <g
            key={i}
            opacity={dim * (1 - e * e)}
            transform={`translate(${wc.x + dx} ${wc.y + dy}) scale(${sc}) translate(${-wc.x} ${-wc.y})`}
          >
            <Label spec={s} idx={i} r={r} />
            <Wd s={s} f={f} r={r} />
          </g>
        );
      })}
    </svg>
  );
};

// Radial speed streaks racing into the centre during the converge
const STREAKS = Array.from({ length: 44 }, (_, i) => ({
  ang: random(`sa-${i}`) * Math.PI * 2,
  d: random(`sd-${i}`) * 26,
  r0: 800 + random(`sr-${i}`) * 700,
  w: 1.5 + random(`sw-${i}`) * 2.5,
  len: 180 + random(`sl-${i}`) * 260,
}));

export const ConvergeStreaks: React.FC<{ f: number }> = ({ f }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    {STREAKS.map((s, i) => {
      const t = prog(f, 206 + s.d, 34, EASE_IN);
      if (t <= 0 || t >= 1) return null;
      const head = lerp(s.r0, 0, t);
      const tail = head + s.len * Math.sin(Math.PI * t);
      const o = Math.sin(Math.PI * t);
      return (
        <line
          key={i}
          x1={CX + Math.cos(s.ang) * head}
          y1={CY + Math.sin(s.ang) * head}
          x2={CX + Math.cos(s.ang) * tail}
          y2={CY + Math.sin(s.ang) * tail}
          stroke={i % 3 === 0 ? white(0.85 * o) : gold(0.9 * o)}
          strokeWidth={s.w}
          strokeLinecap="round"
        />
      );
    })}
  </svg>
);

export { EASE_OUT };
