import React, { useState } from "react";
import { Img } from "remotion";
import { resolvePublicFile } from "./publicFile";
import type { Team } from "./types";

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

// Shows the team logo from public/. If the file is missing,
// falls back to the team's initials on its own colors instead of crashing.
export const TeamLogo: React.FC<{ team: Team; size: number }> = ({
  team,
  size,
}) => {
  // Remember which path failed, so fixing the path in Studio retries loading
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const src = resolvePublicFile(team.logo);

  if (!src || failedLogo === team.logo) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `linear-gradient(145deg, ${team.primaryColor}, ${team.primaryColor}CC)`,
          color: team.secondaryColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: size * 0.38,
          lineHeight: 1,
        }}
      >
        {initials(team.name)}
      </div>
    );
  }

  return (
    <Img
      key={src}
      src={src}
      maxRetries={0}
      onError={() => setFailedLogo(team.logo)}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
};

// Circular light plate with the logo, a thin team-color ring and a soft shadow
export const LogoBadge: React.FC<{ team: Team; size: number }> = ({
  team,
  size,
}) => {
  const ring = Math.max(3, size * 0.035);
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "50%",
        padding: ring,
        boxSizing: "border-box",
        background: team.primaryColor,
        boxShadow: `0 0 0 ${Math.max(1.5, ring * 0.4)}px rgba(255,255,255,0.18), 0 ${size * 0.08}px ${size * 0.2}px rgba(0,0,0,0.55)`,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #EEF2F8 60%, #D9E0EC 100%)",
          boxShadow: "inset 0 2px 6px rgba(0,0,0,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <TeamLogo team={team} size={size * 0.7} />
      </div>
    </div>
  );
};

export const TeamToken: React.FC<{
  team: Team;
  x: number;
  y: number;
  size: number;
}> = ({ team, x, y, size }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
      }}
    >
      <LogoBadge team={team} size={size} />
    </div>
  );
};
