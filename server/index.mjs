// Local "Amatör Arena" match maker.
//
//   npm run app  ->  http://localhost:3001
//
// Serves the single-page UI from app/, accepts two team names + logos, and renders
// the existing LogoFootball composition with @remotion/renderer (Node side).
// Team data and a fresh gameSeed go in as inputProps; src/Root.tsx is never touched.
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP_DIR = path.join(ROOT, "app");
const RENDERS_DIR = path.join(ROOT, "renders");
const GENERATED_DIR = path.join(ROOT, "public", "generated");
const PORT = Number(process.env.PORT || 3001);
const COMPOSITION_ID = "LogoFootball";
const MAX_BODY_BYTES = 25 * 1024 * 1024; // two logos as base64
const MAX_LOGO_BYTES = 10 * 1024 * 1024;
const MAX_NAME_LENGTH = 40;
// Only for quick technical tests (e.g. APP_TEST_FRAMES=0-149); normally unset = full video
const TEST_FRAMES = process.env.APP_TEST_FRAMES?.match(/^(\d+)-(\d+)$/);

// Used when no color can be taken from a logo
const FALLBACK_COLORS = {
  home: { primaryColor: "#2F6BFF", secondaryColor: "#FFFFFF" },
  away: { primaryColor: "#E53935", secondaryColor: "#FFFFFF" },
};

fs.mkdirSync(RENDERS_DIR, { recursive: true });
fs.mkdirSync(GENERATED_DIR, { recursive: true });

const log = (...args) => console.log(`[${new Date().toLocaleTimeString("tr-TR")}]`, ...args);

// ---------- Bundle once (same settings as remotion.config.ts) ----------
let bundlePromise = null;
const getBundle = () => {
  if (!bundlePromise) {
    log("Remotion projesi hazırlanıyor (bundle)...");
    bundlePromise = bundle({
      entryPoint: path.join(ROOT, "src", "index.ts"),
      rspack: true,
      bundlerOverride: enableTailwind,
      // public/ is linked, not copied: logos saved later to public/generated are visible
      symlinkPublicDir: true,
    })
      .then((serveUrl) => {
        log("Bundle hazır.");
        return serveUrl;
      })
      .catch((error) => {
        bundlePromise = null;
        throw error;
      });
  }
  return bundlePromise;
};

// ---------- Helpers ----------
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
    .replace(/^-+|-+$/g, "") || "takim";

const timestamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};

// Detects the image type from its first bytes (never trust the file name)
const imageType = (buf) => {
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
};

const decodeLogo = (dataUrl) => {
  const match = typeof dataUrl === "string" && dataUrl.match(/^data:image\/[a-z+]+;base64,(.+)$/);
  if (!match) return null;
  const buf = Buffer.from(match[1], "base64");
  if (buf.length === 0 || buf.length > MAX_LOGO_BYTES) return null;
  const type = imageType(buf);
  return type ? { buf, type } : null;
};

const isHex = (c) => typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c);

class UserError extends Error {}

const readJson = (req) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new UserError("Logo yüklenemedi."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new UserError("Logo yüklenemedi."));
      }
    });
    req.on("error", reject);
  });

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
  res.end(JSON.stringify(body));
};

// ---------- Jobs (one at a time) ----------
const jobs = new Map();
let activeJobId = null;

const publicJob = (job) => ({
  id: job.id,
  status: job.status, // preparing | rendering | done | error
  phase: job.phase,
  progress: job.progress,
  error: job.error,
  gameSeed: job.gameSeed,
  fileName: job.status === "done" ? path.basename(job.outputPath) : null,
});

const runJob = async (job) => {
  try {
    const serveUrl = await getBundle();
    const composition = await selectComposition({ serveUrl, id: COMPOSITION_ID, inputProps: job.inputProps });
    log(`Job ${job.id}: ${composition.width}x${composition.height}, ${composition.fps} fps, ${composition.durationInFrames} frame`);

    job.status = "rendering";
    job.phase = "Video render ediliyor...";
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264", // + AAC audio
      imageFormat: "png", // same as remotion.config.ts
      outputLocation: job.outputPath,
      inputProps: job.inputProps,
      overwrite: true,
      frameRange: TEST_FRAMES ? [Number(TEST_FRAMES[1]), Number(TEST_FRAMES[2])] : null,
      onProgress: ({ progress }) => {
        job.progress = Math.min(99, Math.floor(progress * 100));
      },
    });

    job.progress = 100;
    job.status = "done";
    job.phase = "Video hazır";
    log(`Job ${job.id}: bitti -> ${path.relative(ROOT, job.outputPath)} ${job.scoreLine ?? ""}`);
  } catch (error) {
    job.status = "error";
    job.error = "Video oluşturulurken hata oluştu.";
    log(`Job ${job.id}: HATA`, error);
  } finally {
    // Temporary logos are only needed during the render
    for (const file of job.tempFiles) fs.rmSync(file, { force: true });
    activeJobId = null;
  }
};

// Score preview for the terminal log, from the same deterministic simulation
const scoreFor = async (gameSeed) => {
  try {
    const { MATCH_CONFIG, GAME_SECONDS, matchMinuteLabel } = await import("../src/LogoFootball/config.ts");
    const { getMatch } = await import("../src/LogoFootball/motion.ts");
    const fps = 30;
    const frames = GAME_SECONDS * fps;
    const match = getMatch(gameSeed, fps, frames, MATCH_CONFIG);
    const last = match.frames[match.frames.length - 1];
    const goals = match.goalEvents.map((e) => `${matchMinuteLabel(e.frame, frames)} ${e.scoringTeam}`).join(", ");
    return `(skor ${last.homeScore}-${last.awayScore}${goals ? `; goller: ${goals}` : ""})`;
  } catch {
    return null;
  }
};

const createJob = async (body) => {
  const homeName = String(body.homeName ?? "").trim().slice(0, MAX_NAME_LENGTH);
  const awayName = String(body.awayName ?? "").trim().slice(0, MAX_NAME_LENGTH);
  if (!homeName || !awayName) throw new UserError("Takım adı eksik.");
  if (!body.homeLogo) throw new UserError("Ev sahibi logosunu seçin.");
  if (!body.awayLogo) throw new UserError("Konuk takım logosunu seçin.");
  const homeLogo = decodeLogo(body.homeLogo);
  const awayLogo = decodeLogo(body.awayLogo);
  if (!homeLogo || !awayLogo) throw new UserError("Logo yüklenemedi.");

  const id = crypto.randomUUID().slice(0, 8);
  const gameSeed = `match-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const homeFile = `${id}-home.${homeLogo.type}`;
  const awayFile = `${id}-away.${awayLogo.type}`;
  fs.writeFileSync(path.join(GENERATED_DIR, homeFile), homeLogo.buf);
  fs.writeFileSync(path.join(GENERATED_DIR, awayFile), awayLogo.buf);

  const colors = (side) => {
    const c = body[`${side}Colors`];
    return c && isHex(c.primaryColor) && isHex(c.secondaryColor)
      ? { primaryColor: c.primaryColor, secondaryColor: c.secondaryColor }
      : FALLBACK_COLORS[side];
  };

  const inputProps = {
    homeTeam: { name: homeName, logo: `generated/${homeFile}`, ...colors("home") },
    awayTeam: { name: awayName, logo: `generated/${awayFile}`, ...colors("away") },
    gameSeed,
  };

  let outputPath = path.join(RENDERS_DIR, `${slugify(homeName)}-vs-${slugify(awayName)}-${timestamp()}.mp4`);
  for (let n = 2; fs.existsSync(outputPath); n++) {
    outputPath = outputPath.replace(/(-\d+)?\.mp4$/, `-${n}.mp4`);
  }

  const job = {
    id,
    status: "preparing",
    phase: "Maç hazırlanıyor...",
    progress: 0,
    error: null,
    gameSeed,
    inputProps,
    outputPath,
    tempFiles: [path.join(GENERATED_DIR, homeFile), path.join(GENERATED_DIR, awayFile)],
    scoreLine: await scoreFor(gameSeed),
  };
  jobs.set(id, job);
  activeJobId = id;
  log(`Job ${id}: ${homeName} vs ${awayName}, gameSeed ${gameSeed}`);
  log(`Job ${id}: inputProps ${JSON.stringify(inputProps)}`);
  runJob(job);
  return job;
};

// ---------- HTTP ----------
const STATIC_TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" };

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const parts = url.pathname.split("/").filter(Boolean);

    if (req.method === "POST" && url.pathname === "/api/matches") {
      if (activeJobId) return send(res, 409, { error: "Şu anda başka bir video oluşturuluyor." });
      const job = await createJob(await readJson(req));
      return send(res, 201, publicJob(job));
    }

    // Lets a reloaded page pick up the running job
    if (req.method === "GET" && url.pathname === "/api/active") {
      return send(res, 200, activeJobId ? publicJob(jobs.get(activeJobId)) : null);
    }

    if (parts[0] === "api" && parts[1] === "jobs" && parts[2]) {
      const job = jobs.get(parts[2]);
      if (!job) return send(res, 404, { error: "Bulunamadı." });

      if (req.method === "GET" && parts.length === 3) return send(res, 200, publicJob(job));

      if (req.method === "GET" && parts[3] === "download" && job.status === "done") {
        const stat = fs.statSync(job.outputPath);
        res.writeHead(200, {
          "Content-Type": "video/mp4",
          "Content-Length": stat.size,
          "Content-Disposition": `attachment; filename="${path.basename(job.outputPath)}"`,
        });
        return fs.createReadStream(job.outputPath).pipe(res);
      }

      if (req.method === "POST" && parts[3] === "open" && job.status === "done") {
        if (process.platform === "darwin") spawn("open", [job.outputPath], { stdio: "ignore", detached: true }).unref();
        return send(res, 200, { ok: true });
      }
      return send(res, 400, { error: "Geçersiz istek." });
    }

    if (req.method === "GET") {
      const rel = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
      const file = path.join(APP_DIR, path.normalize(rel));
      if (file.startsWith(APP_DIR) && fs.existsSync(file) && fs.statSync(file).isFile()) {
        res.writeHead(200, { "Content-Type": STATIC_TYPES[path.extname(file)] ?? "application/octet-stream" });
        return fs.createReadStream(file).pipe(res);
      }
    }
    send(res, 404, { error: "Bulunamadı." });
  } catch (error) {
    if (error instanceof UserError) return send(res, 400, { error: error.message });
    log("İstek hatası:", error);
    send(res, 500, { error: "Video oluşturulurken hata oluştu." });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  log(`Amatör Arena hazır: http://localhost:${PORT}`);
  if (TEST_FRAMES) log(`TEST MODU: sadece ${TEST_FRAMES[0]} frame render edilecek`);
  getBundle().catch((error) => log("Bundle hatası:", error));
});
