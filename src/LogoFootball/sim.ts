// Deterministic logo-football physics. Everything that happens (goals, score)
// is a pure consequence of the seeded simulation - nothing is scripted.

export const FPS = 30;
export const MATCH_SECONDS = 60;
export const MATCH_FRAMES = MATCH_SECONDS * FPS; // 1800
export const FINAL_FRAMES = 2 * FPS; // 60
export const TOTAL_FRAMES = MATCH_FRAMES + FINAL_FRAMES;
export const CELEBRATION_FRAMES = 75;

// Pitch geometry (1080x1920 canvas)
export const PITCH = { L: 60, R: 1020, T: 400, B: 1780 };
export const CX = (PITCH.L + PITCH.R) / 2;
export const CY = (PITCH.T + PITCH.B) / 2;
export const GOAL_W = 320;
export const GOAL_DEPTH = 90;
export const BALL_R = 28;
export const DISC_R = 84;

const SUB = 8;
const DT = 1 / (FPS * SUB);

export type Team = "home" | "away";

export type Frame = {
  ball: [number, number];
  home: [number, number];
  away: [number, number];
  ballAngle: number;
  homeTilt: number;
  awayTilt: number;
  score: [number, number];
};

export type GoalEvent = { frame: number; team: Team };

export type MatchSim = { frames: Frame[]; goals: GoalEvent[] };

const hashSeed = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  m: number;
};

const cache = new Map<string, MatchSim>();

export const simulateMatch = (gameSeed: string): MatchSim => {
  const hit = cache.get(gameSeed);
  if (hit) return hit;

  const rnd = mulberry32(hashSeed(gameSeed));
  const ball: Body = { x: CX, y: CY, vx: 0, vy: 0, r: BALL_R, m: 1 };
  const home: Body = { x: CX, y: CY + 330, vx: 0, vy: 0, r: DISC_R, m: 9 };
  const away: Body = { x: CX, y: CY - 330, vx: 0, vy: 0, r: DISC_R, m: 9 };

  // Per-team "character", drawn from the seed
  const style = {
    home: { accel: 4300 + rnd() * 1300, wander: 0.35 + rnd() * 0.5, boost: 0.6 + rnd() * 0.8 },
    away: { accel: 4300 + rnd() * 1300, wander: 0.35 + rnd() * 0.5, boost: 0.6 + rnd() * 0.8 },
  };
  const wanderAngle = { home: 0, away: 0 };
  const wanderTarget = { home: 0, away: 0 };
  const dash = { home: 0, away: 0 };

  const kickoff = () => {
    ball.x = CX;
    ball.y = CY;
    const a = rnd() * Math.PI * 2;
    const s = 80 + rnd() * 220;
    ball.vx = Math.cos(a) * s;
    ball.vy = Math.sin(a) * s;
    home.x = CX + (rnd() - 0.5) * 260;
    home.y = CY + 330;
    away.x = CX + (rnd() - 0.5) * 260;
    away.y = CY - 330;
    home.vx = home.vy = away.vx = away.vy = 0;
  };
  kickoff();

  const score: [number, number] = [0, 0];
  const frames: Frame[] = [];
  const goals: GoalEvent[] = [];
  let celebrating = 0;
  let ballAngle = 0;
  let stalled = 0; // frames the ball has stayed within 40px of the anchor
  let anchorX = CX;
  let anchorY = CY;
  const postR = 11;
  const posts = [
    { x: CX - GOAL_W / 2, y: PITCH.T },
    { x: CX + GOAL_W / 2, y: PITCH.T },
    { x: CX - GOAL_W / 2, y: PITCH.B },
    { x: CX + GOAL_W / 2, y: PITCH.B },
  ];

  const collide = (a: Body, b: Body, e: number) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy);
    const min = a.r + b.r;
    if (d >= min || d === 0) return;
    const nx = dx / d;
    const ny = dy / d;
    const im = 1 / a.m + 1 / b.m;
    const pen = min - d;
    a.x -= (nx * pen * (1 / a.m)) / im;
    a.y -= (ny * pen * (1 / a.m)) / im;
    b.x += (nx * pen * (1 / b.m)) / im;
    b.y += (ny * pen * (1 / b.m)) / im;
    const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (rv > 0) return;
    const j = (-(1 + e) * rv) / im;
    a.vx -= (j * nx) / a.m;
    a.vy -= (j * ny) / a.m;
    b.vx += (j * nx) / b.m;
    b.vy += (j * ny) / b.m;
  };

  const hitPost = (b: Body, p: { x: number; y: number }) => {
    const dx = b.x - p.x;
    const dy = b.y - p.y;
    const d = Math.hypot(dx, dy);
    const min = b.r + postR;
    if (d >= min || d === 0) return;
    const nx = dx / d;
    const ny = dy / d;
    b.x = p.x + nx * min;
    b.y = p.y + ny * min;
    const vn = b.vx * nx + b.vy * ny;
    if (vn < 0) {
      b.vx -= 1.8 * vn * nx;
      b.vy -= 1.8 * vn * ny;
    }
  };

  const walls = (b: Body, isBall: boolean) => {
    const e = isBall ? 0.86 : 0.6;
    const inMouth = isBall && Math.abs(b.x - CX) < GOAL_W / 2;
    if (b.x < PITCH.L + b.r) {
      b.x = PITCH.L + b.r;
      b.vx = Math.abs(b.vx) * e;
    }
    if (b.x > PITCH.R - b.r) {
      b.x = PITCH.R - b.r;
      b.vx = -Math.abs(b.vx) * e;
    }
    // top / bottom with goal openings for the ball
    for (const side of [0, 1]) {
      const line = side === 0 ? PITCH.T : PITCH.B;
      const dir = side === 0 ? 1 : -1; // inward
      const beyond = (b.y - line) * dir; // <0 when outside pitch
      if (inMouth || (isBall && beyond < 0 && Math.abs(b.x - CX) < GOAL_W / 2 + b.r)) {
        if (beyond < 0) {
          // inside goal box: side + back walls
          if (b.x < CX - GOAL_W / 2 + b.r) {
            b.x = CX - GOAL_W / 2 + b.r;
            b.vx = Math.abs(b.vx) * 0.4;
          }
          if (b.x > CX + GOAL_W / 2 - b.r) {
            b.x = CX + GOAL_W / 2 - b.r;
            b.vx = -Math.abs(b.vx) * 0.4;
          }
          const back = line - dir * GOAL_DEPTH + dir * b.r;
          if ((b.y - back) * dir < 0) {
            b.y = back;
            b.vy = -b.vy * 0.2;
          }
          b.vx *= 0.985;
          b.vy *= 0.985;
        }
        continue;
      }
      if ((b.y - line) * dir < b.r) {
        b.y = line + dir * b.r;
        b.vy = dir * Math.abs(b.vy) * e;
      }
    }
  };

  const steer = (me: Body, team: Team) => {
    const st = style[team];
    const targetY = team === "home" ? PITCH.T : PITCH.B;
    const ownY = team === "home" ? PITCH.B : PITCH.T;
    // direction ball -> opponent goal
    let ux = CX - ball.x;
    let uy = targetY - ball.y;
    const ul = Math.hypot(ux, uy) || 1;
    ux /= ul;
    uy /= ul;
    // point just behind the ball (from the goal's perspective)
    const gap = ball.r + me.r + 6;
    let px = ball.x - ux * gap;
    let py = ball.y - uy * gap;
    const toBallX = ball.x - me.x;
    const toBallY = ball.y - me.y;
    const behind = (me.x - ball.x) * ux + (me.y - ball.y) * uy; // <0 => already behind ball
    const lateral = Math.abs((me.x - ball.x) * uy - (me.y - ball.y) * ux);
    // the disc cannot stand inside a wall: clamp the approach point to the pitch
    px = Math.min(PITCH.R - me.r, Math.max(PITCH.L + me.r, px));
    py = Math.min(PITCH.B - me.r, Math.max(PITCH.T + me.r, py));
    let tx = px;
    let ty = py;
    const nearSide = ball.x < PITCH.L + 170 || ball.x > PITCH.R - 170;
    if (nearSide && behind < -10 && lateral < me.r * 1.4) {
      // ball hugging the touchline: scoop it back toward the middle first
      tx = ball.x + (CX - ball.x) * 0.4;
      ty = ball.y + uy * 100;
    } else if (behind < -10 && lateral < me.r * 0.9) {
      // lined up: charge through the ball toward goal
      tx = ball.x + ux * 120;
      ty = ball.y + uy * 120;
    } else if (behind > -10) {
      // in front of ball: swing around it instead of knocking it backwards
      const side = (me.x - ball.x) * uy - (me.y - ball.y) * ux >= 0 ? 1 : -1;
      tx = px + -uy * side * 60;
      ty = py + ux * side * 60;
    }
    // protect own goal a little when the ball is very close to it and we are far
    const ownDist = Math.abs(ball.y - ownY);
    if (ownDist < 260 && Math.abs(toBallX) + Math.abs(toBallY) > 500) {
      tx = ball.x;
      ty = ball.y;
    }
    // improvisation: slowly drifting steering noise + random dashes
    wanderAngle[team] += (wanderTarget[team] - wanderAngle[team]) * 0.04;
    let dx = tx - me.x;
    let dy = ty - me.y;
    const dl = Math.hypot(dx, dy) || 1;
    dx /= dl;
    dy /= dl;
    const ca = Math.cos(wanderAngle[team]);
    const sa = Math.sin(wanderAngle[team]);
    const rx = dx * ca - dy * sa;
    const ry = dx * sa + dy * ca;
    const k = dash[team] > 0 ? 1 + st.boost : 1;
    me.vx += rx * st.accel * k * DT;
    me.vy += ry * st.accel * k * DT;
  };

  for (let f = 0; f < MATCH_FRAMES; f++) {
    // once per frame: refresh improvisation
    for (const t of ["home", "away"] as Team[]) {
      if (f % 18 === 0) {
        wanderTarget[t] = (rnd() - 0.5) * 2 * style[t].wander;
      }
      if (dash[t] > 0) dash[t]--;
      else if (rnd() < 0.012) dash[t] = 8 + Math.floor(rnd() * 8);
    }

    for (let s = 0; s < SUB; s++) {
      if (celebrating === 0) {
        steer(home, "home");
        steer(away, "away");
      }
      for (const b of [home, away]) {
        b.vx *= 1 - 2.4 * DT;
        b.vy *= 1 - 2.4 * DT;
        const sp = Math.hypot(b.vx, b.vy);
        const max = 1050;
        if (sp > max) {
          b.vx *= max / sp;
          b.vy *= max / sp;
        }
      }
      ball.vx *= 1 - 0.55 * DT;
      ball.vy *= 1 - 0.55 * DT;
      const bs = Math.hypot(ball.vx, ball.vy);
      if (bs > 2300) {
        ball.vx *= 2300 / bs;
        ball.vy *= 2300 / bs;
      }
      for (const b of [ball, home, away]) {
        b.x += b.vx * DT;
        b.y += b.vy * DT;
      }
      collide(home, away, 0.8);
      collide(home, ball, 0.95);
      collide(away, ball, 0.95);
      for (const p of posts) hitPost(ball, p);
      walls(home, false);
      walls(away, false);
      walls(ball, true);
      // keep discs out of goal boxes (they are clamped by walls) and re-separate
      collide(home, away, 0.5);
      // anti-squash: ball pinned against wall by a disc gets nudged out
      for (const d of [home, away]) {
        const dist = Math.hypot(ball.x - d.x, ball.y - d.y);
        if (dist < ball.r + d.r - 0.5) {
          const nx = (ball.x - d.x) / (dist || 1);
          const ny = (ball.y - d.y) / (dist || 1);
          ball.x = d.x + nx * (ball.r + d.r);
          ball.y = d.y + ny * (ball.r + d.r);
          walls(ball, true);
        }
      }
    }

    ballAngle += (ball.vx / ball.r) * (1 / FPS) * 0.9;

    // dead ball (e.g. jammed in a corner for 2s): referee restarts from the middle
    if (celebrating === 0) {
      if (Math.hypot(ball.x - anchorX, ball.y - anchorY) > 40) {
        anchorX = ball.x;
        anchorY = ball.y;
        stalled = 0;
      } else if (++stalled >= 2 * FPS) {
        stalled = 0;
        kickoff();
        anchorX = ball.x;
        anchorY = ball.y;
      }
    } else {
      stalled = 0;
    }

    if (celebrating === 0) {
      let scorer: Team | null = null;
      if (ball.y < PITCH.T - 4 && Math.abs(ball.x - CX) < GOAL_W / 2) scorer = "home";
      else if (ball.y > PITCH.B + 4 && Math.abs(ball.x - CX) < GOAL_W / 2) scorer = "away";
      if (scorer) {
        score[scorer === "home" ? 0 : 1]++;
        goals.push({ frame: f, team: scorer });
        celebrating = CELEBRATION_FRAMES;
      }
    } else {
      celebrating--;
      if (celebrating === 0) kickoff();
    }

    frames.push({
      ball: [ball.x, ball.y],
      home: [home.x, home.y],
      away: [away.x, away.y],
      ballAngle,
      homeTilt: Math.max(-0.35, Math.min(0.35, home.vx * 0.0005)),
      awayTilt: Math.max(-0.35, Math.min(0.35, away.vx * 0.0005)),
      score: [score[0], score[1]],
    });
  }

  const result = { frames, goals };
  cache.set(gameSeed, result);
  return result;
};
