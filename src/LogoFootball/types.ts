import { z } from "zod";
import { zColor } from "@remotion/zod-types";

// Editable in Remotion Studio's props panel
export const teamSchema = z.object({
  /** Display name, e.g. "Konyaspor" */
  name: z.string(),
  /** Path relative to the public/ folder, e.g. "logos/konyaspor.png" */
  logo: z.string(),
  /** Main team color (hex) */
  primaryColor: zColor(),
  /** Accent team color (hex) */
  secondaryColor: zColor(),
});

export const logoFootballSchema = z.object({
  homeTeam: teamSchema,
  awayTeam: teamSchema,
  /** Same seed = same token paths on every render; change it for a new match */
  gameSeed: z.string(),
});

export type Team = z.infer<typeof teamSchema>;

export type LogoFootballProps = z.infer<typeof logoFootballSchema>;
