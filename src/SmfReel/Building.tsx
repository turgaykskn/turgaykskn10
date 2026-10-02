import React from "react";
import { Easing, random } from "remotion";
import { Cam, GOLD, P, gold, pathD, prog, toScreen, white } from "./theme";

// ---- World geometry (1080x1920 world, building centred at x~545) ----
const FX0 = 330;
const FX1 = 640;
const SX = 760;
const TOP = 520;
const BOT = 1390;
const NF = 15;
const FL = (BOT - TOP) / NF;
const NC = 5;
const CW = (FX1 - FX0) / NC;

export const HUB: P = { x: 545, y: 430 };

type Win = { pts: P[]; row: number; col: number; seed: number; v: number; side: boolean };

const sideP = (u: number, v: number): P => ({
  x: FX1 + (SX - FX1) * u,
  y: TOP - 30 * u + v * (BOT - TOP),
});

const WINS: Win[] = [];
for (let r = 0; r < NF; r++) {
  for (let c = 0; c < NC; c++) {
    const x = FX0 + c * CW + 9;
    const y = TOP + r * FL + 10;
    WINS.push({
      pts: [
        { x, y },
        { x: x + CW - 18, y },
        { x: x + CW - 18, y: y + FL - 20 },
        { x, y: y + FL - 20 },
      ],
      row: r,
      col: c,
      seed: random(`wf-${r}-${c}`),
      v: (r + 0.5) / NF,
      side: false,
    });
  }
  for (let c = 0; c < 2; c++) {
    const u0 = c * 0.5 + 0.09;
    const u1 = u0 + 0.32;
    const v0 = (r * FL + 10) / (BOT - TOP);
    const v1 = (r * FL + FL - 10) / (BOT - TOP);
    WINS.push({
      pts: [sideP(u0, v0), sideP(u1, v0), sideP(u1, v1), sideP(u0, v1)],
      row: r,
      col: c + 5,
      seed: random(`ws-${r}-${c}`),
      v: (r + 0.5) / NF,
      side: true,
    });
  }
}

export const winCenter = (side: boolean, r: number, c: number): P => {
  const w = WINS.find((q) => q.side === side && q.row === r && q.col === (side ? c + 5 : c))!;
  return {
    x: w.pts.reduce((a, p) => a + p.x, 0) / 4,
    y: w.pts.reduce((a, p) => a + p.y, 0) / 4,
  };
};

type Seg = { pts: P[]; start: number; dur: number; w?: number; o?: number };

const SEGS: Seg[] = [];
SEGS.push({ pts: [{ x: 90, y: 1480 }, { x: 1000, y: 1480 }], start: 0, dur: 26, w: 2, o: 0.55 });
SEGS.push({
  pts: [{ x: FX0, y: BOT }, { x: FX0, y: TOP }, { x: FX1, y: TOP }, { x: FX1, y: BOT }],
  start: 4,
  dur: 38,
  w: 3,
});
SEGS.push({
  pts: [{ x: FX1, y: TOP }, sideP(1, 0), sideP(1, 1), { x: FX1, y: BOT }],
  start: 10,
  dur: 34,
  w: 3,
});
SEGS.push({ pts: [{ x: HUB.x, y: TOP }, HUB], start: 36, dur: 14, w: 2 });
SEGS.push({
  pts: [{ x: 250, y: BOT }, { x: 250, y: 1480 }, { x: 700, y: 1480 }, { x: 700, y: BOT }, { x: 250, y: BOT }],
  start: 18,
  dur: 34,
  w: 2,
});
SEGS.push({
  pts: [{ x: 700, y: BOT }, { x: 800, y: 1360 }, { x: 800, y: 1450 }, { x: 700, y: 1480 }],
  start: 30,
  dur: 26,
  w: 2,
});
for (let r = 1; r < NF; r++) {
  const y = TOP + r * FL;
  SEGS.push({
    pts: [{ x: FX0, y }, { x: FX1, y }, { x: SX, y: y - 30 }],
    start: 22 + (NF - r) * 1.6,
    dur: 24,
    w: 1.2,
    o: 0.45,
  });
}
for (let c = 1; c < NC; c++) {
  SEGS.push({
    pts: [{ x: FX0 + c * CW, y: BOT }, { x: FX0 + c * CW, y: TOP }],
    start: 28 + c * 3,
    dur: 26,
    w: 1.2,
    o: 0.4,
  });
}

const STREAMS = Array.from({ length: 12 }, (_, i) => ({
  x: i < 6 ? 292 + (i % 3) * 14 : 790 + (i % 3) * 14,
  sp: 3.2 + random(`ss-${i}`) * 3.4,
  ph: random(`sp-${i}`) * 1100,
  len: 40 + random(`sl-${i}`) * 50,
}));

type Props = {
  f: number; // absolute frame
  cam: Cam;
  mode: "A" | "B";
  lines?: number; // line opacity multiplier
  windows?: number; // window opacity multiplier
  draw?: boolean; // animate the line-draw (scene A)
};

const lightA = (w: Win, f: number) => {
  const appear = prog(f, 34 + w.seed * 48, 8, Easing.linear);
  const tier = w.seed < 0.35 ? 0.08 : w.seed < 0.75 ? 0.26 : 0.58;
  const flick = 0.78 + 0.22 * Math.sin(f * 0.31 + w.seed * 50);
  const act = prog(f, 90, 100, Easing.linear);
  const travel = Math.pow(Math.max(0, Math.sin(f * 0.09 - w.row * 0.55 + w.col * 1.1 + w.seed * 6)), 8);
  return appear * Math.min(1, tier * flick + travel * (0.35 + 0.45 * act));
};

const lightB = (w: Win, f: number) => {
  const t = f - 345;
  let pulse = 0;
  if (t >= 0) {
    const k = t % 15;
    const sweepV = 1 - k / 12;
    pulse = Math.max(0, 1 - Math.abs(w.v - sweepV) * 5.5);
  }
  return 0.36 + pulse * 0.55;
};

export const Building: React.FC<Props> = ({
  f,
  cam,
  mode,
  lines = 1,
  windows = 1,
  draw = true,
}) => {
  const m = (p: P) => toScreen(cam, p.x, p.y);
  const streamO = mode === "A" ? prog(f, 36, 30, Easing.linear) : 0.5;

  return (
    <svg
      width={1080}
      height={1920}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
    >
      {WINS.map((w, i) => {
        const o = (mode === "A" ? lightA(w, f) : lightB(w, f)) * windows;
        const pts = w.pts.map(m);
        return (
          <g key={i}>
            <polygon points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill={gold(o * 0.9)} />
            <polygon
              points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={gold(Math.min(0.5, 0.12 + o * 0.5) * windows * (mode === "A" ? prog(f, 34 + w.seed * 48, 8, Easing.linear) : 1))}
              strokeWidth={1}
            />
          </g>
        );
      })}
      {SEGS.map((s, i) => {
        const p = draw ? prog(f, s.start, s.dur, Easing.bezier(0.4, 0, 0.2, 1)) : 1;
        if (p <= 0) return null;
        return (
          <path
            key={i}
            d={pathD(s.pts.map(m))}
            pathLength={1}
            strokeDasharray="1 1.01"
            strokeDashoffset={1 - p}
            fill="none"
            stroke={gold((s.o ?? 0.95) * lines)}
            strokeWidth={s.w ?? 2}
            strokeLinejoin="round"
          />
        );
      })}
      {STREAMS.map((s, i) => {
        const y0 = 1480 - ((f * s.sp + s.ph) % 1100);
        const a = m({ x: s.x, y: y0 });
        const b = m({ x: s.x, y: y0 + s.len });
        const fade = Math.max(0, Math.min(1, (y0 - 380) / 200));
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={gold(0.8 * fade * streamO * lines)}
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      })}
      {mode === "A" && f > 36 && (
        <g>
          {(() => {
            const h = m(HUB);
            const p = prog(f, 44, 16);
            return (
              <>
                <circle cx={h.x} cy={h.y} r={6 * p} fill={GOLD} opacity={lines} />
                <circle cx={h.x} cy={h.y} r={14 + 10 * ((f % 40) / 40)} fill="none" stroke={gold(0.5 * (1 - (f % 40) / 40) * lines)} strokeWidth={1.5} />
              </>
            );
          })()}
        </g>
      )}
    </svg>
  );
};

// Faint architectural grid for depth (parallax with camera zoom)
export const Backdrop: React.FC<{ cam: Cam; opacity?: number }> = ({ cam, opacity = 1 }) => {
  const k = Math.pow(cam.s, 0.45);
  const lines: React.ReactNode[] = [];
  for (let i = -8; i <= 8; i++) {
    const x = 540 + i * 110 * k;
    lines.push(<line key={`v${i}`} x1={x} y1={0} x2={x} y2={1920} stroke={white(0.035 * opacity)} strokeWidth={1} />);
  }
  for (let j = -12; j <= 12; j++) {
    const y = 960 + j * 110 * k;
    lines.push(<line key={`h${j}`} x1={0} y1={y} x2={1080} y2={y} stroke={white(0.03 * opacity)} strokeWidth={1} />);
  }
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      {lines}
    </svg>
  );
};

// Out-of-focus particles in front of the camera (depth cue)
const BOKEH = Array.from({ length: 16 }, (_, i) => ({
  x: random(`bx-${i}`) * 1080,
  y: random(`by-${i}`) * 1920,
  r: 8 + random(`br-${i}`) * 26,
  o: 0.05 + random(`bo-${i}`) * 0.1,
  sp: 0.2 + random(`bs-${i}`) * 0.6,
}));

export const Bokeh: React.FC<{ f: number; cam: Cam; opacity?: number }> = ({ f, cam, opacity = 1 }) => {
  const z = Math.pow(cam.s, 1.5);
  return (
    <svg
      width={1080}
      height={1920}
      style={{ position: "absolute", left: 0, top: 0, filter: "blur(7px)" }}
    >
      {BOKEH.map((b, i) => {
        const x = 540 + (b.x - 540) * z * 0.7;
        const y = 960 + (((b.y - f * b.sp * 0.8) % 1920) + 1920) % 1920 - 960;
        return <circle key={i} cx={x} cy={y} r={b.r * (0.6 + z * 0.4)} fill={gold(b.o * opacity)} />;
      })}
    </svg>
  );
};
