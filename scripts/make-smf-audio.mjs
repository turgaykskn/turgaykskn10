// Synthesizes the SMF Grup reel sound design (original, royalty-free) -> public/smf-sound.wav
import { writeFileSync } from "node:fs";

const SR = 44100;
const DUR = 15;
const N = SR * DUR;
const L = new Float32Array(N);
const R = new Float32Array(N);

let seed = 1337;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

const add = (t0, buf, gain = 1, pan = 0) => {
  const s0 = Math.floor(t0 * SR);
  const gl = gain * (1 - Math.max(0, pan));
  const gr = gain * (1 + Math.min(0, pan));
  for (let i = 0; i < buf.length && s0 + i < N; i++) {
    if (s0 + i < 0) continue;
    L[s0 + i] += buf[i] * gl;
    R[s0 + i] += buf[i] * gr;
  }
};

// one-pole filtered noise sweep (whoosh / riser)
const sweep = (dur, f0, f1, peak = 0.5, riseShape = 2) => {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  let lp = 0;
  let lp2 = 0;
  for (let i = 0; i < n; i++) {
    const p = i / n;
    const f = f0 * Math.pow(f1 / f0, p);
    const a = 1 - Math.exp((-2 * Math.PI * f) / SR);
    lp += a * (rnd() - lp);
    lp2 += a * (lp - lp2);
    const env = Math.pow(Math.sin(Math.PI * Math.pow(p, riseShape)), 1.5);
    out[i] = (lp - lp2) * 6 * env * peak;
  }
  return out;
};

const blip = (freq, dur = 0.12, peak = 0.25) => {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 38) * Math.min(1, i / 60);
    out[i] = (Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(2 * Math.PI * freq * 2.01 * t)) * env * peak;
  }
  return out;
};

const impact = (peak = 0.9, dur = 1.8) => {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 38 + 90 * Math.exp(-t * 9);
    const boom = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 2.4);
    lp += 0.25 * (rnd() - lp);
    const crack = lp * Math.exp(-t * 14) * 0.7;
    const tail = Math.sin(2 * Math.PI * 220 * t) * Math.exp(-t * 3) * 0.12;
    out[i] = (boom + crack + tail) * peak;
  }
  return out;
};

const chime = (freq, dur = 2.2, peak = 0.16) => {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 2.2) * Math.min(1, t * 80);
    out[i] =
      (Math.sin(2 * Math.PI * freq * t) + 0.4 * Math.sin(2 * Math.PI * freq * 2 * t) + 0.15 * Math.sin(2 * Math.PI * freq * 3.01 * t)) *
      env *
      peak;
  }
  return out;
};

// ambient drone bed with slow swell
{
  const out = new Float32Array(N);
  let lp = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const swell = 0.35 + 0.65 * Math.min(1, t / 3) * (t > 12.5 ? Math.max(0, (DUR - t) / 2.5) : 1);
    const boost = t > 7 && t < 8 ? 1 + (t - 7) * 0.8 : 1;
    lp += 0.01 * (rnd() - lp);
    out[i] =
      (Math.sin(2 * Math.PI * 55 * t) * 0.16 +
        Math.sin(2 * Math.PI * 82.4 * t + Math.sin(t * 0.7)) * 0.08 +
        Math.sin(2 * Math.PI * 110.3 * t) * 0.05 +
        lp * 1.2) *
      swell *
      boost;
  }
  add(0, out, 0.8);
}

// 0-3s: line-draw ticks, building light flickers
[0.35, 0.7, 1.05, 1.3, 1.6, 1.8, 2.05, 2.25, 2.5, 2.7, 2.9].forEach((t, i) =>
  add(t, blip(1200 + (i % 5) * 310, 0.1, 0.1), 1, (i % 2 ? 0.4 : -0.4)),
);
add(0.5, sweep(1.6, 300, 3000, 0.35), 0.5);
// title hit
add(0.55, impact(0.35, 1.0), 0.6);

// 3-7s: push-in whoosh + data pulses getting denser
add(2.8, sweep(1.4, 250, 4500, 0.6), 0.9);
const pulses = [3.2, 3.5, 3.9, 4.0, 4.4, 4.6, 4.8, 5.0, 5.2, 5.35, 5.5, 5.65, 5.8, 5.95, 6.1, 6.2, 6.3, 6.45, 6.55, 6.65, 6.8, 6.9];
pulses.forEach((t, i) => add(t, blip(700 + ((i * 7) % 9) * 260, 0.09, 0.12), 1, Math.sin(i) * 0.7));
[3.15, 4.0, 4.85, 5.6].forEach((t) => add(t, impact(0.3, 0.7), 0.5)); // four process labels
add(5.9, impact(0.4, 1.2), 0.7); // ONLARCA SÜREÇ

// 7-11s: converge riser -> impact -> impact
add(6.9, sweep(1.15, 120, 7000, 0.9, 3), 1);
add(8.0, impact(1.0, 2.2), 1);
add(8.0, sweep(0.9, 6000, 400, 0.4, 0.5), 0.6);
add(9.3, impact(1.0, 2.4), 1);
add(9.3, sweep(0.6, 8000, 500, 0.5, 0.5), 0.8);
add(9.3, chime(329.6, 2.6, 0.14), 1);
add(9.3, chime(493.9, 2.6, 0.1), 1);
add(8.0, chime(246.9, 2.0, 0.1), 1);

// 10.8-11.3: shockwave out
add(10.7, sweep(0.9, 300, 6000, 0.7, 1.2), 1);

// 11-15s: ordered, regular rhythm
for (let k = 0; k < 6; k++) add(11.5 + k * 0.5, blip(880, 0.08, 0.1), 1, k % 2 ? 0.3 : -0.3);
add(11.4, impact(0.5, 1.4), 0.7);
add(12.8, sweep(0.7, 300, 5000, 0.5), 0.7);
add(13.2, impact(0.55, 1.6), 0.8);
add(13.25, chime(392, 3, 0.12), 1);
add(13.25, chime(587.3, 3, 0.09), 1);

// master: soft limiter + fade out
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const norm = 0.85 / peak;
const pcm = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = t > 14.4 ? Math.max(0, (DUR - t) / 0.6) : Math.min(1, t / 0.05);
  const l = Math.tanh(L[i] * norm * 1.2) * fade;
  const r = Math.tanh(R[i] * norm * 1.2) * fade;
  pcm.writeInt16LE(Math.round(l * 32000), i * 4);
  pcm.writeInt16LE(Math.round(r * 32000), i * 4 + 2);
}
const hdr = Buffer.alloc(44);
hdr.write("RIFF", 0);
hdr.writeUInt32LE(36 + pcm.length, 4);
hdr.write("WAVEfmt ", 8);
hdr.writeUInt32LE(16, 16);
hdr.writeUInt16LE(1, 20);
hdr.writeUInt16LE(2, 22);
hdr.writeUInt32LE(SR, 24);
hdr.writeUInt32LE(SR * 4, 28);
hdr.writeUInt16LE(4, 32);
hdr.writeUInt16LE(16, 34);
hdr.write("data", 36);
hdr.writeUInt32LE(pcm.length, 40);
writeFileSync(new URL("../public/smf-sound.wav", import.meta.url), Buffer.concat([hdr, pcm]));
console.log("ok");
