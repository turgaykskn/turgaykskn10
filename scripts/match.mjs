// Renders a new LogoFootball match for two teams typed in the terminal.
//
//   npm run match
//
// Asks for both team names and logo file names (files live in public/logos/),
// creates a fresh gameSeed, and renders with --props for this run only, so
// src/Root.tsx is never modified. Extra arguments are passed to `remotion render`,
// e.g. `npm run match -- --frames=0-149` for a quick test.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const logosDir = path.join(root, "public", "logos");
const LOGO_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg"];

// Neutral team colors (no color questions); home blue, away red
const HOME_COLORS = { primaryColor: "#2F6BFF", secondaryColor: "#FFFFFF" };
const AWAY_COLORS = { primaryColor: "#E53935", secondaryColor: "#FFFFFF" };

const fail = (message) => {
  console.error(`\n✖ ${message}`);
  process.exit(1);
};

// "Fenerbahçe" -> "fenerbahce", "Gülsuyu SK" -> "gulsuyu-sk"
const slugify = (text) =>
  text
    .replace(/[İIı]/g, "i")
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "team";

// Finds a logo in public/logos; accepts "x.png", "logos/x.png" or just "x"
const findLogo = (input) => {
  const wanted = path.basename(input.trim());
  const files = fs.existsSync(logosDir) ? fs.readdirSync(logosDir) : [];
  const candidates = path.extname(wanted) ? [wanted] : LOGO_EXTENSIONS.map((ext) => wanted + ext);
  for (const c of candidates) {
    const match = files.find((f) => f.toLowerCase() === c.toLowerCase());
    if (match) {
      return match;
    }
  }
  return null;
};

const timestamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
};

// ---- Questions ----
// Reads answers line by line (works when typing and when input is piped in)
const rl = readline.createInterface({ input: process.stdin, terminal: false });
const lines = rl[Symbol.asyncIterator]();
const ask = async (question) => {
  for (;;) {
    process.stdout.write(question);
    const { value, done } = await lines.next();
    if (done) {
      fail("Giriş tamamlanmadı, render başlatılmadı.");
    }
    if (value.trim()) {
      return value.trim();
    }
  }
};
const homeName = await ask("Ev sahibi takımın adı? ");
const homeLogoInput = await ask("Ev sahibi logo dosyasının adı? ");
const awayName = await ask("Konuk takımın adı? ");
const awayLogoInput = await ask("Konuk takım logo dosyasının adı? ");
rl.close();

// ---- Logo check (before rendering) ----
const missing = [];
const homeLogo = findLogo(homeLogoInput);
const awayLogo = findLogo(awayLogoInput);
if (!homeLogo) missing.push(`public/logos/${path.basename(homeLogoInput)}`);
if (!awayLogo) missing.push(`public/logos/${path.basename(awayLogoInput)}`);
if (missing.length > 0) {
  const available = fs.existsSync(logosDir) ? fs.readdirSync(logosDir).filter((f) => !f.startsWith(".")) : [];
  fail(
    `Logo bulunamadı, render başlatılmadı:\n  ${missing.join("\n  ")}\n` +
      `public/logos içindeki dosyalar: ${available.length ? available.join(", ") : "(boş)"}`,
  );
}

// ---- New match ----
const gameSeed = `match-${Date.now()}`;
const props = {
  homeTeam: { name: homeName, logo: `logos/${homeLogo}`, ...HOME_COLORS },
  awayTeam: { name: awayName, logo: `logos/${awayLogo}`, ...AWAY_COLORS },
  gameSeed,
};

fs.mkdirSync(path.join(root, "out"), { recursive: true });
const base = `${slugify(homeName)}-vs-${slugify(awayName)}-${timestamp()}`;
let outFile = path.join("out", `${base}.mp4`);
for (let n = 2; fs.existsSync(path.join(root, outFile)); n++) {
  outFile = path.join("out", `${base}-${n}.mp4`);
}

const propsFile = path.join(os.tmpdir(), `logofootball-${gameSeed}.json`);
fs.writeFileSync(propsFile, JSON.stringify(props));

console.log(`\n▶ ${homeName} vs ${awayName}  (gameSeed: ${gameSeed})`);
console.log(`  Render: ${outFile}\n`);

// ---- Render (1080x1920, 30 fps, H.264 + audio come from the composition) ----
const remotion = path.join(root, "node_modules", ".bin", "remotion");
const result = spawnSync(
  remotion,
  ["render", "src/index.ts", "LogoFootball", outFile, "--codec=h264", `--props=${propsFile}`, ...process.argv.slice(2)],
  { cwd: root, stdio: "inherit" },
);
fs.rmSync(propsFile, { force: true });
if (result.status !== 0) {
  fail(`Render başarısız oldu (çıkış kodu ${result.status}).`);
}

// ---- Result: same deterministic simulation the video used ----
let scoreLine = "hesaplanamadı";
try {
  const { MATCH_CONFIG, GAME_SECONDS } = await import("../src/LogoFootball/config.ts");
  const { getMatch } = await import("../src/LogoFootball/motion.ts");
  const fps = 30; // LogoFootball composition fps (src/Root.tsx)
  const match = getMatch(gameSeed, fps, GAME_SECONDS * fps, MATCH_CONFIG);
  const last = match.frames[match.frames.length - 1];
  const goals = match.goalEvents
    .map((e) => {
      const s = e.frame / fps;
      const time = `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
      return `${time} ${e.scoringTeam === "home" ? homeName : awayName} (${e.homeScore}-${e.awayScore})`;
    })
    .join(", ");
  scoreLine = `${homeName} ${last.homeScore} - ${last.awayScore} ${awayName}` + (goals ? `\n  Goller: ${goals}` : "");
} catch (error) {
  console.warn(`(Final skor hesaplanamadı: ${error.message})`);
}

console.log("\n✔ Maç hazır");
console.log(`  Takımlar : ${homeName} (logos/${homeLogo}) vs ${awayName} (logos/${awayLogo})`);
console.log(`  gameSeed : ${gameSeed}`);
console.log(`  Skor     : ${scoreLine}`);
console.log(`  Video    : ${outFile}`);

if (process.platform === "darwin") {
  spawnSync("open", [path.join(root, outFile)]);
}
