import { continueRender, delayRender, staticFile } from "remotion";

// Fonts are bundled locally (public/fonts) so rendering never needs the network.
const FACES = [
  {
    "fam": "Barlow Condensed",
    "w": "600",
    "file": "BarlowCondensed-600-latin-ext.woff2",
    "ur": "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF"
  },
  {
    "fam": "Barlow Condensed",
    "w": "600",
    "file": "BarlowCondensed-600-latin.woff2",
    "ur": "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD"
  },
  {
    "fam": "Barlow Condensed",
    "w": "700",
    "file": "BarlowCondensed-700-latin-ext.woff2",
    "ur": "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF"
  },
  {
    "fam": "Barlow Condensed",
    "w": "700",
    "file": "BarlowCondensed-700-latin.woff2",
    "ur": "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD"
  },
  {
    "fam": "IBM Plex Mono",
    "w": "400",
    "file": "IBMPlexMono-400-latin-ext.woff2",
    "ur": "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF"
  },
  {
    "fam": "IBM Plex Mono",
    "w": "400",
    "file": "IBMPlexMono-400-latin.woff2",
    "ur": "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD"
  },
  {
    "fam": "IBM Plex Mono",
    "w": "500",
    "file": "IBMPlexMono-500-latin-ext.woff2",
    "ur": "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF"
  },
  {
    "fam": "IBM Plex Mono",
    "w": "500",
    "file": "IBMPlexMono-500-latin.woff2",
    "ur": "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD"
  }
] as const;

let started = false;
export const loadLocalFonts = () => {
  if (started || typeof document === "undefined") return;
  started = true;
  const handle = delayRender("smf-fonts");
  Promise.all(
    FACES.map((f) => {
      const face = new FontFace(f.fam, `url(${staticFile("fonts/" + f.file)}) format("woff2")`, {
        weight: f.w,
        unicodeRange: f.ur,
      });
      return face.load().then((l) => document.fonts.add(l));
    }),
  )
    .catch((e) => console.error("font load failed", e))
    .finally(() => continueRender(handle));
};
