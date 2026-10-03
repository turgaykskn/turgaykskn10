// Layout and match settings shared by the composition and scripts/match.mjs.
// Plain TypeScript (no JSX) so Node can load it to compute a match's result.
import type { MatchConfig } from "./motion";

/** The match itself; the composition runs a bit longer for the final score screen */
export const GAME_SECONDS = 60;

// Match clock: 0' … 90', then 90+1' … 90+3'. Every step is shown equally long,
// so the 94 steps are spread evenly over the 60 seconds of play.
export const STOPPAGE_MINUTES = 3;
export const CLOCK_STEPS = 90 + STOPPAGE_MINUTES + 1;

/** Clock step for a frame: 0 = 0', 90 = 90', 93 = 90+3' (stays there after the game) */
export const matchMinuteIndex = (frame: number, gameFrames: number) =>
  Math.min(CLOCK_STEPS - 1, Math.max(0, Math.floor((frame * CLOCK_STEPS) / gameFrames)));

/** First frame on which a clock step is shown */
export const matchMinuteStartFrame = (index: number, gameFrames: number) =>
  Math.ceil((index * gameFrames) / CLOCK_STEPS);

/** "34'", "90'", "90+2'" */
export const formatMatchMinute = (index: number) =>
  index <= 90 ? `${index}'` : `90+${index - 90}'`;

/** Match minute label for a frame, e.g. for goal times */
export const matchMinuteLabel = (frame: number, gameFrames: number) =>
  formatMatchMinute(matchMinuteIndex(frame, gameFrames));

/** Width of the glowing arena boundary line */
export const ARENA_RING = 5;

export const ringRadius = (size: number) => size / 2 - ARENA_RING / 2;

/** Distance from the arena's outer edge to the goal posts (posts sit on the ring) */
export const goalPostInset = (size: number, mouthHeight: number) => {
  const r = ringRadius(size);
  return size / 2 - Math.sqrt(r * r - (mouthHeight / 2) ** 2);
};

// Layout (1080x1920)
// Arena leaves room on both sides for goals deep enough to hold the whole ball
export const ARENA_SIZE = 920;
export const ARENA_CENTER_Y = 1130;
export const GOAL_MOUTH = 130;
export const GOAL_DEPTH = 70; // how far the goal box reaches beyond the arena edge
export const TOKEN_SIZE = 180;
// Tokens stay fully inside the ring (and clear of the goal posts) by this margin
const TOKEN_MARGIN = 14;
const TOKEN_SAFE_RADIUS = ARENA_SIZE / 2 - ARENA_RING - TOKEN_SIZE / 2 - TOKEN_MARGIN;
export const BALL_SIZE = 76;
// Drawn ball circle is r=48 of a 100 viewBox
const BALL_RADIUS = (BALL_SIZE / 2) * 0.96;
const BALL_MARGIN = 3;

// Must match Goal.tsx drawing: frame stroke 5, post r=9 + stroke 4
const GOAL_FRAME_STROKE = 5;
const POST_RADIUS = 11;
const GOAL_LINE_X = ARENA_SIZE / 2 - goalPostInset(ARENA_SIZE, GOAL_MOUTH);

export const MATCH_CONFIG: MatchConfig = {
  tokenSafeRadius: TOKEN_SAFE_RADIUS,
  ballSafeRadius: ARENA_SIZE / 2 - ARENA_RING - BALL_RADIUS - BALL_MARGIN,
  tokenRadius: TOKEN_SIZE / 2,
  ballRadius: BALL_RADIUS,
  ringRadius: ringRadius(ARENA_SIZE),
  goalMouthHalf: GOAL_MOUTH / 2,
  goalLineX: GOAL_LINE_X,
  postRadius: POST_RADIUS,
  goalBackX: ARENA_SIZE / 2 + GOAL_DEPTH - GOAL_FRAME_STROKE / 2 - BALL_RADIUS,
  goalSideY: GOAL_MOUTH / 2 - GOAL_FRAME_STROKE / 2 - BALL_RADIUS,
};
