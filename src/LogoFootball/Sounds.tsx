import React from "react";
import { Sequence, interpolate, prefetch, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import type { GoalEvent } from "./motion";
import { resolveExistingPublicFile } from "./publicFile";

// Fixed audio files in public/audio
const BACKGROUND_MUSIC = "audio/background.wav";
const GOAL_SOUND = "audio/goal.wav"; // same stinger for home and away goals
const FINAL_WHISTLE = "audio/final-whistle.wav"; // once, at the end of the game
/** Length of final-whistle.wav */
const FINAL_WHISTLE_SECONDS = 1.3;

// Load the audio into memory as soon as Studio/Player opens, so pressing play
// at frame 0 doesn't wait for a network fetch (prefetch is a no-op when rendering)
if (typeof window !== "undefined") {
  for (const path of [BACKGROUND_MUSIC, GOAL_SOUND, FINAL_WHISTLE]) {
    const src = resolveExistingPublicFile(path);
    if (src) {
      prefetch(src, { method: "blob-url", contentType: "audio/wav" });
    }
  }
}

export const BACKGROUND_VOLUME = 0.3;
export const BACKGROUND_DUCKED_VOLUME = 0.11;
/** Length of goal.wav */
export const GOAL_SOUND_SECONDS = 2.3;
const DUCK_IN_SECONDS = 0.05; // practically instant, on the goal frame
const DUCK_OUT_SECONDS = 0.5;

/** How long a goal sound plays: the whole file, or until the next goal starts */
const goalSoundFrames = (events: GoalEvent[], index: number, fps: number) => {
  const full = Math.round(GOAL_SOUND_SECONDS * fps);
  const next = events[index + 1];
  return next ? Math.min(full, next.frame - events[index].frame) : full;
};

// Background volume for a frame: ducked while a goal sound plays
const backgroundVolume = (frame: number, events: GoalEvent[], fps: number) => {
  const duckIn = Math.max(1, Math.round(DUCK_IN_SECONDS * fps));
  const duckOut = Math.max(1, Math.round(DUCK_OUT_SECONDS * fps));
  let duck = 0;
  events.forEach((e, i) => {
    const end = e.frame + goalSoundFrames(events, i, fps);
    const amount = interpolate(
      frame,
      [e.frame, e.frame + duckIn, end, end + duckOut],
      [0, 1, 1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
    duck = Math.max(duck, amount);
  });
  return interpolate(duck, [0, 1], [BACKGROUND_VOLUME, BACKGROUND_DUCKED_VOLUME]);
};

export const Sounds: React.FC<{ goalEvents: GoalEvent[]; gameFrames: number }> = ({
  goalEvents,
  gameFrames,
}) => {
  const { fps } = useVideoConfig();
  // Missing files are skipped instead of failing the render
  const background = resolveExistingPublicFile(BACKGROUND_MUSIC);
  const goal = resolveExistingPublicFile(GOAL_SOUND);
  const whistle = resolveExistingPublicFile(FINAL_WHISTLE);

  return (
    <>
      {background ? (
        // Starts at frame 0 (no offset) and stops when the game ends
        <Sequence durationInFrames={gameFrames} name="Background music">
          <Audio
            src={background}
            loop
            loopVolumeCurveBehavior="extend"
            volume={(f) => backgroundVolume(f, goalEvents, fps)}
          />
        </Sequence>
      ) : null}
      {goal
        ? goalEvents.map((e, i) => (
            <Sequence
              key={e.frame}
              from={e.frame}
              durationInFrames={goalSoundFrames(goalEvents, i, fps)}
              premountFor={fps}
              name={`Goal sound ${e.homeScore}-${e.awayScore}`}
            >
              <Audio src={goal} />
            </Sequence>
          ))
        : null}
      {whistle ? (
        <Sequence
          from={gameFrames}
          durationInFrames={Math.round(FINAL_WHISTLE_SECONDS * fps)}
          premountFor={fps}
          name="Final whistle"
        >
          <Audio src={whistle} />
        </Sequence>
      ) : null}
    </>
  );
};
