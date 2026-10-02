import { Easing, interpolate } from "remotion";
import { loadLocalFonts } from "./fonts";

export const NAVY = "#152335";
export const NAVY_DEEP = "#0B1522";
export const GOLD = "#C2A794";
export const WHITE = "#FFFFFF";

export const W = 1080;
export const H = 1920;
export const CX = W / 2;
export const CY = H / 2;

// Safe area for Instagram Reels UI (caption / buttons overlays)
export const SAFE = { left: 70, right: 1010, top: 230, bottom: 1580 };

export const FPS = 30;
export const DURATION = 450;

// Key moments (frames @30fps)
export const T = {
  converge: 210,
  impact: 240,
  smf: 279,
  reveal: 322,
  finalHead: 342,
  card: 396,
};

loadLocalFonts();
export const HEAD = "'Barlow Condensed', sans-serif";
export const MONO = "'IBM Plex Mono', monospace";

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

export const prog = (
  f: number,
  start: number,
  dur: number,
  easing: (t: number) => number = EASE_OUT,
) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const gold = (a: number) => `rgba(194,167,148,${a})`;
export const white = (a: number) => `rgba(255,255,255,${a})`;

export type P = { x: number; y: number };

export const pathD = (pts: P[]) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

export const polyLen = (pts: P[]) => {
  let l = 0;
  for (let i = 1; i < pts.length; i++) {
    l += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return l;
};

export const pointAt = (pts: P[], u: number): P => {
  const total = polyLen(pts);
  let d = Math.max(0, Math.min(1, u)) * total;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (d <= seg || i === pts.length - 1) {
      const t = seg === 0 ? 0 : Math.min(1, d / seg);
      return {
        x: lerp(pts[i - 1].x, pts[i].x, t),
        y: lerp(pts[i - 1].y, pts[i].y, t),
      };
    }
    d -= seg;
  }
  return pts[pts.length - 1];
};

// Circuit-style trace: horizontal run, then a 45 degree chamfer into the target
export const elbow = (a: P, b: P): P[] => {
  const dir = Math.sign(b.x - a.x) || 1;
  const dy = Math.abs(b.y - a.y);
  let xm = b.x - dir * dy;
  if ((xm - a.x) * dir < 0) xm = a.x;
  return [a, { x: xm, y: a.y }, b];
};

export type Cam = { s: number; fx: number; fy: number; cx: number; cy: number };

export const toScreen = (c: Cam, x: number, y: number): P => ({
  x: c.cx + (x - c.fx) * c.s,
  y: c.cy + (y - c.fy) * c.s,
});

// Scene A camera: gentle approach, then travelling "into" the building
export const camA = (f: number): Cam => {
  const a = prog(f, 0, 110, Easing.out(Easing.quad));
  const b = prog(f, 92, 125, EASE_IO);
  const c = prog(f, 210, 60, Easing.out(Easing.quad));
  return {
    s: 0.88 + 0.12 * a + 1.15 * b + 0.3 * c,
    fx: 545,
    fy: lerp(985, 900, b),
    cx: CX,
    cy: lerp(1080, 960, b),
  };
};

// Scene B camera: pull back to see the whole building (f = absolute frame)
export const camB = (f: number): Cam => {
  const p = prog(f, T.reveal, 70, EASE_IO);
  const drift = prog(f, 392, 58, Easing.linear);
  return {
    s: lerp(1.35, 0.8, p) + 0.02 * drift,
    fx: 545,
    fy: 985,
    cx: CX,
    cy: lerp(1000, 1150, p),
  };
};
