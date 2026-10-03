import { random } from "remotion";

// Physics runs this many substeps per video frame (prevents tunneling)
const SUBSTEPS = 4;
// Contact resolution passes per substep
const CONTACT_PASSES = 3;

// --- Tokens ---
// Average token speed in px per second; each team gets a small seeded variation
const BASE_SPEED = 756;
const SPEED_VARIATION = 0.08; // ±8%
// Gentle seeded steering so paths don't repeat the same bounce pattern
const STEER_SEGMENT_SECONDS = 1.2; // a new turn rate is picked this often
const MAX_TURN_DEG_PER_SECOND = 40; // turn rates are blended, never jump
const START_CLEARANCE = 150; // min start distance from the center (ball spot)

// --- Ball ---
const BALL_START_SPEED = 60; // tiny seeded drift; real motion comes from hits
const BALL_MAX_SPEED = 1250; // px/s
const BALL_MIN_KICK_SPEED = 450; // a hit always sends the ball at least this fast
const KICK_POWER_MIN = 140; // extra seeded push along the contact normal, px/s
const KICK_POWER_MAX = 320;
const KICK_CARRY = 0.3; // share of the token's own velocity passed to the ball
const KICK_COOLDOWN_SECONDS = 0.2; // same token can't add kick power again sooner
// Aiming: home attacks the right goal, away the left goal.
// A kick's direction blends the opponent goal direction with the physical contact angle.
const AIM_WEIGHT_MIN = 0.65;
const AIM_WEIGHT_MAX = 0.8;
const AIM_ERROR_DEG = 18; // seeded ± error on every kick
// A kick never sends the ball back into the token: min share along the contact normal
const MIN_NORMAL_SHARE = 0.25;
// Velocity multiplier per second (≈0.980 per frame at 30 fps)
const BALL_FRICTION_PER_SECOND = 0.55;

// --- Goals ---
const GOAL_HOLD_SECONDS = 0.8; // everything freezes on the goal moment (clock keeps running)
const KICKOFF_COOLDOWN_SECONDS = 0.5; // no goal can be counted right after a restart

export type Vec = { x: number; y: number };
export type Side = "home" | "away";

export type MatchConfig = {
  /** Max distance of a token center from the arena center */
  tokenSafeRadius: number;
  /** Max distance of the ball center from the arena center (on the wall) */
  ballSafeRadius: number;
  tokenRadius: number;
  ballRadius: number;
  /** Radius of the boundary ring's center line (where the posts sit) */
  ringRadius: number;
  /** Half of the goal mouth height (post centers are at y = ±goalMouthHalf) */
  goalMouthHalf: number;
  /** |x| of the goal line, i.e. of the post centers */
  goalLineX: number;
  /** Collision radius of a post */
  postRadius: number;
  /** Max |x| of the ball center inside a goal (back net) */
  goalBackX: number;
  /** Max |y| of the ball center inside a goal (side nets) */
  goalSideY: number;
};

export type MatchFrame = {
  home: Vec;
  away: Vec;
  ball: Vec;
  /** Ball velocity in px per second */
  ballVelocity: Vec;
  homeScore: number;
  awayScore: number;
};

export type GoalEvent = {
  /** First frame that shows the new score */
  frame: number;
  scoringTeam: Side;
  homeScore: number;
  awayScore: number;
};

export type Match = {
  frames: MatchFrame[];
  goalEvents: GoalEvent[];
};

type Token = {
  key: string;
  side: Side;
  p: Vec;
  v: Vec; // px/s
  lastKick: number; // seconds
  kicks: number;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y;

const rotate = (v: Vec, rad: number): Vec => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
};

const reflect = (v: Vec, n: Vec): Vec => {
  // v' = v - 2 (v · n) n, only when moving into the surface
  const vn = dot(v, n);
  return vn > 0 ? { x: v.x - 2 * vn * n.x, y: v.y - 2 * vn * n.y } : v;
};

// Keeps a body inside the circle; reflects on contact
const bounceOffWall = (p: Vec, v: Vec, safeRadius: number): Vec => {
  const dist = Math.hypot(p.x, p.y);
  if (dist <= safeRadius) {
    return v;
  }
  const n: Vec = { x: p.x / dist, y: p.y / dist }; // outward wall normal
  // Mirror the overshoot back inside so the body never sticks to the wall
  const inside = Math.max(0, safeRadius - (dist - safeRadius));
  p.x = n.x * inside;
  p.y = n.y * inside;
  return reflect(v, n);
};

// Kickoff position: home starts in the left half, away in the right half
const kickoffPosition = (key: string, side: Side, safeRadius: number): Vec => {
  const half = side === "home" ? Math.PI / 2 : -Math.PI / 2;
  const angle = half + random(`${key}-start-angle`) * Math.PI;
  const dist = lerp(START_CLEARANCE, safeRadius * 0.6, Math.sqrt(random(`${key}-start-dist`)));
  return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
};

// Direction and speed for a (re)start; differs per goal index
const kickoffVelocity = (key: string, goalIndex: number): Vec => {
  const k = goalIndex === 0 ? key : `${key}-k${goalIndex}`;
  const dirAngle = random(`${k}-dir`) * Math.PI * 2;
  const speed = BASE_SPEED * (1 + (random(`${k}-speed`) * 2 - 1) * SPEED_VARIATION);
  return { x: Math.cos(dirAngle) * speed, y: Math.sin(dirAngle) * speed };
};

const ballKickoffVelocity = (seed: string, goalIndex: number): Vec => {
  const angle = random(`${seed}-ball-dir${goalIndex === 0 ? "" : `-k${goalIndex}`}`) * Math.PI * 2;
  return { x: Math.cos(angle) * BALL_START_SPEED, y: Math.sin(angle) * BALL_START_SPEED };
};

const turnRate = (key: string, seconds: number) => {
  const maxTurn = (MAX_TURN_DEG_PER_SECOND * Math.PI) / 180;
  const at = (segment: number) => (random(`${key}-turn-${segment}`) * 2 - 1) * maxTurn;
  const s = seconds / STEER_SEGMENT_SECONDS;
  const seg = Math.floor(s);
  return lerp(at(seg), at(seg + 1), smooth(s - seg));
};

const normalize = (v: Vec): Vec => {
  const len = Math.hypot(v.x, v.y);
  return len > 0 ? { x: v.x / len, y: v.y / len } : { x: 1, y: 0 };
};

// Turns a kick toward the opponent goal (with seeded aim error), keeping its speed.
// Home aims at the right goal, away at the left goal.
const aimKick = (
  v: Vec,
  n: Vec,
  ball: Vec,
  token: Token,
  config: MatchConfig,
): Vec => {
  const speed = Math.hypot(v.x, v.y);
  const goalX = token.side === "home" ? config.goalLineX : -config.goalLineX;
  const error =
    ((random(`${token.key}-aim-${token.kicks}`) * 2 - 1) * AIM_ERROR_DEG * Math.PI) / 180;
  const aim = rotate(normalize({ x: goalX - ball.x, y: -ball.y }), error);
  const weight = lerp(AIM_WEIGHT_MIN, AIM_WEIGHT_MAX, random(`${token.key}-aimw-${token.kicks}`));
  const physical = normalize(v);
  let dir = normalize({
    x: aim.x * weight + physical.x * (1 - weight),
    y: aim.y * weight + physical.y * (1 - weight),
  });
  // Hit from the "wrong" side: the ball can't go back through the token,
  // so it is pushed sideways instead (never a deliberate shot at the own goal)
  const along = dot(dir, n);
  if (along < MIN_NORMAL_SHARE) {
    dir = normalize({
      x: dir.x + (MIN_NORMAL_SHARE - along) * n.x,
      y: dir.y + (MIN_NORMAL_SHARE - along) * n.y,
    });
  }
  return { x: dir.x * speed, y: dir.y * speed };
};

// Token (kinematic, unaffected by the ball) hits the ball
const hitBall = (
  token: Token,
  ball: Vec,
  ballV: Vec,
  config: MatchConfig,
  seconds: number,
): Vec => {
  const d: Vec = { x: ball.x - token.p.x, y: ball.y - token.p.y };
  const dist = Math.hypot(d.x, d.y);
  const minDist = config.tokenRadius + config.ballRadius;
  if (dist > minDist) {
    return ballV;
  }
  // Collision normal from token center to ball center
  const n: Vec = dist > 0 ? { x: d.x / dist, y: d.y / dist } : { x: 1, y: 0 };

  // Push the ball out of the token so it never passes through
  ball.x = token.p.x + n.x * minDist;
  ball.y = token.p.y + n.y * minDist;

  // Velocity of the ball relative to the token along the normal
  const vn = dot({ x: ballV.x - token.v.x, y: ballV.y - token.v.y }, n);
  if (vn >= 0) {
    return ballV; // already moving away
  }

  // Bounce off the moving token (token treated as infinitely heavy)
  let v: Vec = { x: ballV.x - 2 * vn * n.x, y: ballV.y - 2 * vn * n.y };

  // Kick: seeded extra power along the normal + part of the token's direction
  if (seconds - token.lastKick >= KICK_COOLDOWN_SECONDS) {
    const power = lerp(KICK_POWER_MIN, KICK_POWER_MAX, random(`${token.key}-kick-${token.kicks}`));
    v = {
      x: v.x + n.x * power + token.v.x * KICK_CARRY,
      y: v.y + n.y * power + token.v.y * KICK_CARRY,
    };
    v = aimKick(v, n, ball, token, config);
    token.lastKick = seconds;
    token.kicks++;
  }

  // A hit is always lively: enforce a minimum speed along the outgoing direction
  const speed = Math.hypot(v.x, v.y);
  if (speed < BALL_MIN_KICK_SPEED) {
    const dir = speed > 0 ? { x: v.x / speed, y: v.y / speed } : n;
    v = { x: dir.x * BALL_MIN_KICK_SPEED, y: dir.y * BALL_MIN_KICK_SPEED };
  }
  return v;
};

// Is the wall point in direction of `p` part of a goal mouth (no wall there)?
const inGoalMouth = (p: Vec, config: MatchConfig) => {
  const len = Math.hypot(p.x, p.y);
  return len > 0 && Math.abs((p.y / len) * config.ringRadius) < config.goalMouthHalf;
};

// Arena wall for the ball: open at the goal mouths
const ballWall = (ball: Vec, ballV: Vec, config: MatchConfig): Vec => {
  if (Math.hypot(ball.x, ball.y) <= config.ballSafeRadius || inGoalMouth(ball, config)) {
    return ballV;
  }
  return bounceOffWall(ball, ballV, config.ballSafeRadius);
};

// Goal posts are small round obstacles at the ends of the mouth
const ballPosts = (ball: Vec, ballV: Vec, config: MatchConfig): Vec => {
  const minDist = config.postRadius + config.ballRadius;
  let v = ballV;
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const post = { x: sx * config.goalLineX, y: sy * config.goalMouthHalf };
      const d = { x: ball.x - post.x, y: ball.y - post.y };
      const dist = Math.hypot(d.x, d.y);
      if (dist < minDist && dist > 0) {
        const n = { x: d.x / dist, y: d.y / dist }; // from post to ball
        ball.x = post.x + n.x * minDist;
        ball.y = post.y + n.y * minDist;
        v = reflect(v, { x: -n.x, y: -n.y });
      }
    }
  }
  return v;
};

// Side and back nets: keep the ball inside the goal box once past the line
const ballNets = (ball: Vec, ballV: Vec, config: MatchConfig): Vec => {
  if (Math.abs(ball.x) <= config.goalLineX) {
    return ballV;
  }
  let v = ballV;
  if (Math.abs(ball.y) > config.goalSideY) {
    const sy = Math.sign(ball.y);
    ball.y = sy * config.goalSideY;
    v = reflect(v, { x: 0, y: sy });
  }
  if (Math.abs(ball.x) > config.goalBackX) {
    const sx = Math.sign(ball.x);
    ball.x = sx * config.goalBackX;
    v = reflect(v, { x: sx, y: 0 });
  }
  return v;
};

// Ball pushed out of a token but past the wall (squeezed between the two):
// place it where it touches both the wall and the token, then let it slide.
const resolvePinch = (
  ball: Vec,
  ballV: Vec,
  token: Token,
  config: MatchConfig,
): Vec => {
  const R = config.ballSafeRadius;
  if (Math.hypot(ball.x, ball.y) <= R + 1e-6 || inGoalMouth(ball, config)) {
    return ballV;
  }
  const r = config.tokenRadius + config.ballRadius;
  const t = token.p;
  const touching = Math.hypot(ball.x - t.x, ball.y - t.y) <= r + 0.5;
  const d = Math.hypot(t.x, t.y);
  const a = d > 0 ? (R * R - r * r + d * d) / (2 * d) : 0;
  const h2 = R * R - a * a;
  if (touching && d > 0 && h2 >= 0) {
    // Two points on the wall at exactly touching distance; take the nearer one
    const h = Math.sqrt(h2);
    const base = { x: (t.x / d) * a, y: (t.y / d) * a };
    const perp = { x: (-t.y / d) * h, y: (t.x / d) * h };
    const p1 = { x: base.x + perp.x, y: base.y + perp.y };
    const p2 = { x: base.x - perp.x, y: base.y - perp.y };
    const pick =
      Math.hypot(p1.x - ball.x, p1.y - ball.y) <= Math.hypot(p2.x - ball.x, p2.y - ball.y)
        ? p1
        : p2;
    ball.x = pick.x;
    ball.y = pick.y;
  } else {
    const len = Math.hypot(ball.x, ball.y);
    ball.x = (ball.x / len) * R;
    ball.y = (ball.y / len) * R;
  }
  const len = Math.hypot(ball.x, ball.y);
  return reflect(ballV, { x: ball.x / len, y: ball.y / len });
};

const clampSpeed = (v: Vec, max: number): Vec => {
  const speed = Math.hypot(v.x, v.y);
  return speed > max ? { x: (v.x / speed) * max, y: (v.y / speed) * max } : v;
};

// Goal only when the whole ball is past the goal line.
// Right goal = home scores (home attacks right), left goal = away scores.
const goalScoredBy = (ball: Vec, config: MatchConfig): Side | null => {
  const line = config.goalLineX + config.ballRadius;
  if (Math.abs(ball.y) >= config.goalMouthHalf) {
    return null;
  }
  if (ball.x > line) {
    return "home";
  }
  if (ball.x < -line) {
    return "away";
  }
  return null;
};

/** Runs the whole match from frame 0 to the last frame. */
const simulate = (
  seed: string,
  frames: number,
  fps: number,
  config: MatchConfig,
): Match => {
  const tokens: Token[] = (["home", "away"] as const).map((side) => {
    const key = `${seed}-${side}`;
    return {
      key,
      side,
      p: kickoffPosition(key, side, config.tokenSafeRadius),
      v: kickoffVelocity(key, 0),
      lastKick: -Infinity,
      kicks: 0,
    };
  });
  const ball: Vec = { x: 0, y: 0 };
  let ballV = ballKickoffVelocity(seed, 0);

  let homeScore = 0;
  let awayScore = 0;
  const goalEvents: GoalEvent[] = [];
  // Goal state: while > 0 the game is frozen on the goal moment
  let holdFrames = 0;
  // No goal can be counted before this frame (after a restart)
  let goalsAllowedFrom = 0;

  const holdLength = Math.max(1, Math.round(GOAL_HOLD_SECONDS * fps));
  const kickoffCooldown = Math.round(KICKOFF_COOLDOWN_SECONDS * fps);
  const dt = 1 / (fps * SUBSTEPS);
  const friction = Math.pow(BALL_FRICTION_PER_SECOND, dt);

  const restart = (frame: number) => {
    const goalIndex = goalEvents.length;
    for (const t of tokens) {
      t.p = kickoffPosition(t.key, t.side, config.tokenSafeRadius);
      t.v = kickoffVelocity(t.key, goalIndex);
      t.lastKick = -Infinity;
    }
    ball.x = 0;
    ball.y = 0;
    ballV = ballKickoffVelocity(seed, goalIndex);
    goalsAllowedFrom = frame + kickoffCooldown;
  };

  const out: MatchFrame[] = [];
  for (let f = 0; f < frames; f++) {
    out.push({
      home: { ...tokens[0].p },
      away: { ...tokens[1].p },
      ball: { ...ball },
      ballVelocity: { ...ballV },
      homeScore,
      awayScore,
    });

    if (f === frames - 1) {
      break; // game over: the last frame is final
    }

    if (holdFrames > 0) {
      holdFrames--;
      if (holdFrames === 0) {
        restart(f + 1);
      }
      continue;
    }

    for (let s = 0; s < SUBSTEPS; s++) {
      const seconds = (f * SUBSTEPS + s) * dt;

      for (const t of tokens) {
        t.v = rotate(t.v, turnRate(t.key, seconds) * dt);
        t.p.x += t.v.x * dt;
        t.p.y += t.v.y * dt;
        t.v = bounceOffWall(t.p, t.v, config.tokenSafeRadius);
      }

      ballV = { x: ballV.x * friction, y: ballV.y * friction };
      ball.x += ballV.x * dt;
      ball.y += ballV.y * dt;

      ballV = ballWall(ball, ballV, config);

      // A few passes so a ball trapped between both tokens settles too
      for (let pass = 0; pass < CONTACT_PASSES; pass++) {
        for (const t of tokens) {
          ballV = hitBall(t, ball, ballV, config, seconds);
          ballV = resolvePinch(ball, ballV, t, config);
        }
      }
      ballV = clampSpeed(ballV, BALL_MAX_SPEED);
      ballV = ballPosts(ball, ballV, config);
      ballV = ballNets(ball, ballV, config);

      const scorer = f + 1 >= goalsAllowedFrom ? goalScoredBy(ball, config) : null;
      if (scorer) {
        if (scorer === "home") {
          homeScore++;
        } else {
          awayScore++;
        }
        goalEvents.push({ frame: f + 1, scoringTeam: scorer, homeScore, awayScore });
        holdFrames = holdLength;
        break; // freeze right at the goal moment
      }
    }
  }
  return { frames: out, goalEvents };
};

// Whole matches are cached, so any frame can be rendered directly
// without re-simulating everything before it.
const cache = new Map<string, Match>();

/** Full deterministic match for a seed: every frame plus the goal events. */
export const getMatch = (
  seed: string,
  fps: number,
  durationInFrames: number,
  config: MatchConfig,
): Match => {
  const key = [seed, fps, durationInFrames, ...Object.values(config)].join("|");
  let match = cache.get(key);
  if (!match) {
    match = simulate(seed, durationInFrames, fps, config);
    cache.set(key, match);
  }
  return match;
};

/**
 * Deterministic match state (positions, ball velocity, score) for a frame.
 * Same seed + same frame always gives the same result; no state, no Math.random().
 * Positions are offsets from the arena center.
 */
export const matchStateAt = (
  seed: string,
  frame: number,
  fps: number,
  durationInFrames: number,
  config: MatchConfig,
): MatchFrame => {
  const { frames } = getMatch(seed, fps, durationInFrames, config);
  const i = Math.min(Math.max(0, Math.floor(frame)), frames.length - 1);
  return frames[i];
};
