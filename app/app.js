// Amatör Arena – match maker UI. Talks to server/index.mjs.
const MAX_LOGO_SIDE = 1024; // larger logos are scaled down (aspect ratio kept)
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
const FALLBACK = {
  home: { primaryColor: "#2F6BFF", secondaryColor: "#FFFFFF" },
  away: { primaryColor: "#E53935", secondaryColor: "#FFFFFF" },
};

const $ = (sel) => document.querySelector(sel);
const logos = { home: null, away: null }; // { dataUrl, color }
let jobId = null;
let pollTimer = null;

const showMessage = (text) => {
  $("#message").textContent = text || "";
};

// ---------- Logo processing (in the browser) ----------
const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };
    img.src = url;
  });

const toHex = (r, g, b) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();

// Most common saturated color of the logo (ignores transparent, white, black and grey pixels)
const dominantColor = (img) => {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  const { data } = ctx.getImageData(0, 0, size, size);
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 200) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    if (sat < 0.35 || max < 60) continue;
    const key = (r >> 5) * 64 + (g >> 5) * 8 + (b >> 5);
    const bucket = buckets.get(key) || { w: 0, r: 0, g: 0, b: 0 };
    bucket.w += sat;
    bucket.r += r * sat;
    bucket.g += g * sat;
    bucket.b += b * sat;
    buckets.set(key, bucket);
  }
  let best = null;
  for (const bucket of buckets.values()) if (!best || bucket.w > best.w) best = bucket;
  if (!best || best.w < 20) return null; // too few colored pixels
  return [best.r / best.w, best.g / best.w, best.b / best.w];
};

const hue = ([r, g, b]) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};

const teamColors = (rgb, fallback) => {
  if (!rgb) return fallback;
  const [r, g, b] = rgb;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return { primaryColor: toHex(r, g, b), secondaryColor: lum > 0.6 ? "#111111" : "#FFFFFF" };
};

// Keeps both teams distinguishable on screen
const resolveColors = () => {
  const home = teamColors(logos.home?.rgb, FALLBACK.home);
  let away = teamColors(logos.away?.rgb, FALLBACK.away);
  if (logos.home?.rgb && logos.away?.rgb) {
    const diff = Math.abs(hue(logos.home.rgb) - hue(logos.away.rgb));
    if (Math.min(diff, 360 - diff) < 30) {
      const homeIsRed = Math.min(hue(logos.home.rgb), 360 - hue(logos.home.rgb)) < 40;
      away = homeIsRed ? FALLBACK.home : FALLBACK.away;
    }
  }
  return { home, away };
};

const processLogo = async (file) => {
  if (!file || !ACCEPTED.includes(file.type)) throw new Error("type");
  const { img, url } = await loadImage(file);
  try {
    const scale = Math.min(1, MAX_LOGO_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL("image/png"), rgb: dominantColor(img) };
  } finally {
    URL.revokeObjectURL(url);
  }
};

const setLogo = async (side, file) => {
  showMessage("");
  try {
    logos[side] = await processLogo(file);
    const preview = document.querySelector(`[data-preview="${side}"]`);
    preview.src = logos[side].dataUrl;
    document.querySelector(`[data-drop="${side}"]`).classList.add("has-image");
    const colors = resolveColors();
    for (const s of ["home", "away"]) {
      document.querySelector(`[data-preview="${s}"]`).style.setProperty("--ring", colors[s].primaryColor);
    }
  } catch {
    logos[side] = null;
    showMessage("Logo yüklenemedi.");
  }
};

for (const side of ["home", "away"]) {
  const input = document.querySelector(`[data-file="${side}"]`);
  const drop = document.querySelector(`[data-drop="${side}"]`);
  input.addEventListener("change", () => input.files[0] && setLogo(side, input.files[0]));
  drop.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (!$("#fields").disabled) drop.classList.add("dragover");
  });
  drop.addEventListener("dragleave", () => drop.classList.remove("dragover"));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("dragover");
    if (!$("#fields").disabled && e.dataTransfer.files[0]) setLogo(side, e.dataTransfer.files[0]);
  });
}

// ---------- Render job ----------
const setLocked = (locked) => {
  $("#fields").disabled = locked;
  $("#createBtn").disabled = locked;
};

const showProgress = (job) => {
  $("#status").classList.add("visible");
  $("#progressView").classList.remove("hidden");
  $("#doneView").classList.add("hidden");
  $("#phase").textContent = job.phase || "Maç hazırlanıyor...";
  $("#percent").textContent = `%${job.progress}`;
  $("#bar").style.width = `${job.progress}%`;
  $("#seed").textContent = job.gameSeed ? `gameSeed: ${job.gameSeed}` : "";
};

const showDone = (job) => {
  $("#progressView").classList.add("hidden");
  $("#doneView").classList.remove("hidden");
  $("#createActions").classList.add("hidden");
  $("#fileName").textContent = `renders/${job.fileName}`;
  $("#downloadBtn").href = `/api/jobs/${job.id}/download`;
  $("#downloadBtn").setAttribute("download", job.fileName);
};

const poll = async () => {
  try {
    const res = await fetch(`/api/jobs/${jobId}`);
    const job = await res.json();
    if (!res.ok) throw new Error(job.error);
    showProgress(job);
    if (job.status === "done") return showDone(job);
    if (job.status === "error") {
      $("#status").classList.remove("visible");
      setLocked(false);
      return showMessage(job.error || "Video oluşturulurken hata oluştu.");
    }
  } catch (error) {
    console.error(error);
  }
  pollTimer = setTimeout(poll, 700);
};

$("#form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if ($("#createBtn").disabled) return;
  const homeName = $("#homeName").value.trim();
  const awayName = $("#awayName").value.trim();
  if (!homeName || !awayName) return showMessage("Takım adı eksik.");
  if (!logos.home) return showMessage("Ev sahibi logosunu seçin.");
  if (!logos.away) return showMessage("Konuk takım logosunu seçin.");

  showMessage("");
  setLocked(true);
  showProgress({ phase: "Maç hazırlanıyor...", progress: 0 });
  const colors = resolveColors();
  try {
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        homeName,
        awayName,
        homeLogo: logos.home.dataUrl,
        awayLogo: logos.away.dataUrl,
        homeColors: colors.home,
        awayColors: colors.away,
      }),
    });
    const job = await res.json();
    if (!res.ok) throw new Error(job.error || "Video oluşturulurken hata oluştu.");
    jobId = job.id;
    poll();
  } catch (error) {
    $("#status").classList.remove("visible");
    setLocked(false);
    showMessage(error.message);
  }
});

// A render that is already running (e.g. after a page reload) keeps the form locked
fetch("/api/active")
  .then((res) => res.json())
  .then((job) => {
    if (job && !jobId) {
      jobId = job.id;
      setLocked(true);
      poll();
    }
  })
  .catch(() => {});

$("#openBtn").addEventListener("click", () => {
  if (jobId) fetch(`/api/jobs/${jobId}/open`, { method: "POST" });
});

$("#newBtn").addEventListener("click", () => {
  clearTimeout(pollTimer);
  jobId = null;
  for (const side of ["home", "away"]) {
    logos[side] = null;
    document.querySelector(`[data-drop="${side}"]`).classList.remove("has-image");
    document.querySelector(`[data-preview="${side}"]`).removeAttribute("src");
    document.querySelector(`[data-file="${side}"]`).value = "";
  }
  $("#homeName").value = "";
  $("#awayName").value = "";
  $("#status").classList.remove("visible");
  $("#createActions").classList.remove("hidden");
  setLocked(false);
  showMessage("");
});
