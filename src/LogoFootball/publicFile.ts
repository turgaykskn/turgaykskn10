import { getStaticFiles, staticFile } from "remotion";

// Cleans a path typed in the props panel.
// Tolerates "./", "/" and "public/" prefixes.
const normalize = (path: string) =>
  path
    .trim()
    .replace(/^\.?\/+/, "")
    .replace(/^public\//, "");

/** Turns a path relative to public/ into a URL; null if unusable. */
export const resolvePublicFile = (path: string): string | null => {
  const clean = normalize(path);
  if (!clean) {
    return null;
  }
  try {
    return staticFile(clean);
  } catch {
    return null;
  }
};

/**
 * Like resolvePublicFile, but also null if the file is not in public/.
 * Used for audio, where a missing file would otherwise fail the render.
 */
export const resolveExistingPublicFile = (path: string): string | null => {
  const src = resolvePublicFile(path);
  if (!src) {
    return null;
  }
  const files = getStaticFiles();
  // An empty list means the file list is unavailable; don't block in that case
  if (files.length === 0) {
    return src;
  }
  const clean = normalize(path);
  return files.some((f) => f.name === clean) ? src : null;
};
