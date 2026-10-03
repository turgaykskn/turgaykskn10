// Starts a new LogoFootball match by writing a fresh gameSeed into src/Root.tsx.
// The seed is created once here; the match itself stays fully deterministic,
// so Studio, preview and the rendered MP4 all show the same game.
//
//   npm run new-match              -> new random match
//   npm run new-match -- match-001 -> replay a specific match
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "src", "Root.tsx");

const seed = process.argv[2]?.trim() || `match-${Date.now()}`;
if (!/^[\w.-]+$/.test(seed)) {
  console.error(`Invalid seed "${seed}". Use letters, numbers, "-", "_" or ".".`);
  process.exit(1);
}

const source = fs.readFileSync(file, "utf8");
const pattern = /(gameSeed:\s*)"[^"]*"/g;
const matches = source.match(pattern) ?? [];
if (matches.length !== 1) {
  console.error(`Expected exactly one gameSeed in src/Root.tsx, found ${matches.length}.`);
  process.exit(1);
}

fs.writeFileSync(file, source.replace(pattern, `$1"${seed}"`));
console.log(`New match: ${seed}`);
