import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/google-fonts/BarlowCondensed";

const { fontFamily } = loadFont("italic", {
  weights: ["600", "800"],
  subsets: ["latin", "latin-ext"],
});

const RED = "#E3001B";
const BG = "#060606";
const GREY = "#b9b9b9";
const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// Scene boundaries in frames (30fps, 15 seconds)
const S1 = 0;
const S2 = 75;
const S3 = 180;
const S4 = 270;
const S5 = 360;
const END = 450;
const SCENES = [S1, S2, S3, S4, S5, END];

const prog = (frame: number, start: number, dur: number) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

/* ---------- Logo (background removed from the supplied PNG) ---------- */

const Logo: React.FC<{ width: number }> = ({ width }) => (
  <Img
    src={staticFile("oracal-logo-cut.png")}
    style={{ width, height: (width * 170) / 440, display: "block", flexShrink: 0 }}
  />
);

/* ---------- Shared pieces ---------- */

const MaskLine: React.FC<{
  children: React.ReactNode;
  size: number;
  delay: number;
  color?: string;
  outline?: boolean;
}> = ({ children, size, delay, color = "#fff", outline }) => {
  const frame = useCurrentFrame();
  const h = size * 0.92;
  return (
    <div style={{ height: h, overflow: "hidden" }}>
      <div
        style={{
          fontFamily,
          fontStyle: "italic",
          fontWeight: 800,
          fontSize: size,
          lineHeight: `${h}px`,
          color: outline ? "transparent" : color,
          WebkitTextStroke: outline ? `4px ${color}` : undefined,
          letterSpacing: -2,
          whiteSpace: "nowrap",
          translate: `0px ${interpolate(frame, [delay, delay + 20], [h, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE,
          })}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Kicker: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily,
        fontWeight: 600,
        fontStyle: "italic",
        fontSize: 36,
        letterSpacing: 5,
        whiteSpace: "nowrap",
        color: RED,
        opacity: prog(frame, delay, 14),
        translate: `${interpolate(frame, [delay, delay + 14], [-40, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE,
        })}px 0px`,
      }}
    >
      {children}
    </div>
  );
};

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 900px at ${
            30 + Math.sin(frame / 60) * 25
          }% ${70 + Math.cos(frame / 70) * 10}%, rgba(227,0,27,0.28), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 2px, transparent 2px, transparent 90px)",
          backgroundPositionX: -frame * 2,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

const Chrome: React.FC = () => {
  const frame = useCurrentFrame();
  const segW = (1080 - 160 - 4 * 12) / 5;
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 190,
          left: 80,
          display: "flex",
          gap: 12,
        }}
      >
        {SCENES.slice(0, 5).map((s, i) => {
          const fill = interpolate(frame, [s, SCENES[i + 1]], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={s}
              style={{
                width: segW,
                height: 6,
                borderRadius: 3,
                background: "rgba(255,255,255,0.18)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${fill * 100}%`,
                  height: "100%",
                  background: i === 4 ? RED : "#fff",
                }}
              />
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          top: 222,
          left: 80,
          right: 80,
          fontFamily,
          fontStyle: "italic",
          fontWeight: 600,
          fontSize: 32,
          letterSpacing: 6,
          color: "#fff",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ color: RED, fontWeight: 800 }}>SEREL TUNING</span>
        {"  ·  YETKİLİ UYGULAMA MERKEZİ"}
      </div>
    </>
  );
};

const Wipes: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {[S2, S3, S4, S5].map((b) => {
        if (frame < b - 12 || frame > b + 12) return null;
        const q = interpolate(frame, [b - 12, b + 12], [0, 1], {
          easing: Easing.inOut(Easing.cubic),
        });
        const x = interpolate(q, [0, 1], [-135, 135]);
        const bar = (extra: number, color: string, w: number) => (
          <div
            style={{
              position: "absolute",
              top: -100,
              bottom: -100,
              left: `${x + extra}%`,
              width: `${w}%`,
              background: color,
              transform: "skewX(-14deg)",
            }}
          />
        );
        return (
          <AbsoluteFill key={b} style={{ overflow: "hidden" }}>
            {bar(-12, "#fff", 8)}
            {bar(-4, RED, 110)}
            {bar(100, BG, 10)}
          </AbsoluteFill>
        );
      })}
    </>
  );
};

/* ---------- Scene 1: hook ---------- */

const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        padding: "340px 80px 340px",
        justifyContent: "center",
        gap: 40,
      }}
    >
      <div
        style={{
          opacity: prog(frame, 0, 18),
          scale: interpolate(frame, [0, 24], [0.85, 1], {
            extrapolateRight: "clamp",
            easing: EASE,
          }),
          transformOrigin: "left center",
          marginBottom: 20,
        }}
      >
        <Logo width={460} />
      </div>
      <div>
        <MaskLine size={270} delay={10}>
          ARACINA
        </MaskLine>
        <MaskLine size={270} delay={18} color={RED}>
          YENİ
        </MaskLine>
        <MaskLine size={270} delay={26} outline color="#fff">
          KİMLİK.
        </MaskLine>
      </div>
      <div
        style={{
          fontFamily,
          fontWeight: 600,
          fontStyle: "italic",
          fontSize: 56,
          letterSpacing: 4,
          color: GREY,
          opacity: prog(frame, 40, 18),
          translate: `0px ${interpolate(frame, [40, 58], [30, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE,
          })}px`,
        }}
      >
        ORACAL® ile profesyonel araç kaplama
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Scene 2: colour changing car ---------- */

const WRAP_COLORS = [
  "#E3001B",
  "#1F5BFF",
  "#12B76A",
  "#FFB400",
  "#8B2DE0",
  "#D5D9E0",
];
const SLOT = 15;

const BODY =
  "M60 290 L60 250 Q60 235 82 230 L220 205 Q300 120 420 108 L600 108 Q720 112 790 200 L900 222 Q945 232 945 262 L945 290 Q945 305 930 305 L75 305 Q60 305 60 290 Z";
const GLASS =
  "M262 200 Q322 135 425 128 L505 128 L505 200 Z M530 128 L600 128 Q690 132 745 200 L530 200 Z";

const CarLayer: React.FC<{ fill: string; reveal: number }> = ({
  fill,
  reveal,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`,
    }}
  >
    <svg viewBox="0 0 1000 400" width="100%" height="100%">
      <path d={BODY} fill={fill} />
    </svg>
  </div>
);

const SceneColors: React.FC = () => {
  const frame = useCurrentFrame();
  const count = Math.round(
    interpolate(frame, [8, 90], [1, 108], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
  );
  const swatches = Array.from({ length: 12 }, (_, i) => `hsl(${i * 30}, 85%, 52%)`);

  return (
    <AbsoluteFill
      style={{
        padding: "340px 80px 340px",
        justifyContent: "center",
        gap: 10,
      }}
    >
      <Kicker>ORACAL® 970RA · PREMIUM WRAPPING CAST</Kicker>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
        <div
          style={{
            fontFamily,
            fontStyle: "italic",
            fontWeight: 800,
            fontSize: 420,
            lineHeight: 1,
            color: "#fff",
            minWidth: 500,
          }}
        >
          {count}
        </div>
        <div
          style={{
            fontFamily,
            fontStyle: "italic",
            fontWeight: 800,
            fontSize: 96,
            lineHeight: 0.95,
            color: RED,
            opacity: prog(frame, 6, 16),
          }}
        >
          RENK
          <br />
          SEÇENEĞİ
        </div>
      </div>

      <div
        style={{
          position: "relative",
          width: 920,
          height: 368,
          marginTop: 10,
          alignSelf: "center",
          translate: `${interpolate(frame, [0, 24], [-300, 0], {
            extrapolateRight: "clamp",
            easing: EASE,
          })}px 0px`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 60,
            right: 40,
            bottom: 6,
            height: 40,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.9)",
            filter: "blur(18px)",
          }}
        />
        <CarLayer fill="#2a2a2a" reveal={1} />
        {WRAP_COLORS.map((c, k) => (
          <CarLayer
            key={c}
            fill={c}
            reveal={interpolate(frame, [4 + k * SLOT, 14 + k * SLOT], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.inOut(Easing.quad),
            })}
          />
        ))}
        <svg
          viewBox="0 0 1000 400"
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0 }}
        >
          <defs>
            <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1b2631" />
              <stop offset="1" stopColor="#05080b" />
            </linearGradient>
          </defs>
          <path d={GLASS} fill="url(#glass)" />
          {[238, 818].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy={305} r={70} fill={BG} />
              <circle cx={cx} cy={305} r={54} fill="#111" />
              <circle cx={cx} cy={305} r={34} fill="#8f949b" />
              <circle cx={cx} cy={305} r={10} fill="#222" />
            </g>
          ))}
          <rect x={900} y={236} width={34} height={14} rx={5} fill="#fff6c9" />
          <rect x={64} y={240} width={26} height={12} rx={5} fill="#ff3b3b" />
        </svg>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          justifyContent: "center",
          marginTop: 10,
        }}
      >
        {swatches.map((c, i) => (
          <div
            key={c}
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: c,
              scale: interpolate(frame, [30 + i * 2, 42 + i * 2], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.back(2)),
              }),
            }}
          />
        ))}
        <div
          style={{
            fontFamily,
            fontStyle: "italic",
            fontWeight: 800,
            fontSize: 56,
            color: "#fff",
            marginLeft: 6,
            opacity: prog(frame, 58, 12),
          }}
        >
          +96
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Scene 3: why Oracal ---------- */

const FEATURES = [
  {
    n: "01",
    title: "RapidAir® Teknolojisi",
    text: "Kabarcıksız, hızlı ve kolay uygulama",
  },
  {
    n: "02",
    title: "Kıvrımlı Yüzeylere Uyum",
    text: "Düzensiz yüzeylerde, kıvrım ve perçin üzerinde mükemmel yapışma",
  },
  {
    n: "03",
    title: "Lamine Gerektirmez",
    text: "Ek laminasyon olmadan tam ya da kısmi araç kaplama",
  },
];

const SceneFeatures: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        padding: "340px 80px 340px",
        justifyContent: "center",
        gap: 36,
      }}
    >
      <div>
        <Kicker>FARKI HİSSET</Kicker>
        <MaskLine size={170} delay={4}>
          NEDEN
        </MaskLine>
        <MaskLine size={170} delay={10} color={RED}>
          ORACAL®?
        </MaskLine>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {FEATURES.map((f, i) => {
          const d = 22 + i * 12;
          return (
            <div
              key={f.n}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 36,
                padding: "30px 40px",
                borderRadius: 28,
                background: "rgba(255,255,255,0.06)",
                border: "2px solid rgba(255,255,255,0.12)",
                borderLeft: `10px solid ${RED}`,
                opacity: prog(frame, d, 16),
                translate: `${interpolate(frame, [d, d + 20], [400, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: EASE,
                })}px 0px`,
              }}
            >
              <div
                style={{
                  fontFamily,
                  fontStyle: "italic",
                  fontWeight: 800,
                  fontSize: 120,
                  color: RED,
                  lineHeight: 1,
                }}
              >
                {f.n}
              </div>
              <div>
                <div
                  style={{
                    fontFamily,
                    fontStyle: "italic",
                    fontWeight: 800,
                    fontSize: 70,
                    color: "#fff",
                    lineHeight: 1,
                  }}
                >
                  {f.title}
                </div>
                <div
                  style={{
                    fontFamily,
                    fontStyle: "italic",
                    fontWeight: 600,
                    fontSize: 42,
                    color: GREY,
                    lineHeight: 1.1,
                    marginTop: 8,
                  }}
                >
                  {f.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Scene 4: special effects ---------- */

const Stat: React.FC<{ value: number; label: string; delay: number }> = ({
  value,
  label,
  delay,
}) => {
  const frame = useCurrentFrame();
  const n = Math.round(
    interpolate(frame, [delay, delay + 30], [0, value], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
  );
  return (
    <div
      style={{
        flex: 1,
        padding: "20px 34px",
        borderRadius: 28,
        background: "rgba(255,255,255,0.06)",
        border: "2px solid rgba(255,255,255,0.12)",
        opacity: prog(frame, delay, 14),
        translate: `0px ${interpolate(frame, [delay, delay + 16], [60, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE,
        })}px`,
      }}
    >
      <div
        style={{
          fontFamily,
          fontStyle: "italic",
          fontWeight: 800,
          fontSize: 150,
          lineHeight: 1,
          color: RED,
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontFamily,
          fontStyle: "italic",
          fontWeight: 600,
          fontSize: 48,
          color: "#fff",
          letterSpacing: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
};

const SceneEffects: React.FC = () => {
  const frame = useCurrentFrame();
  const angle = frame * 5;
  const sweep = interpolate(frame, [10, 70], [-40, 140], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        padding: "340px 80px 340px",
        justifyContent: "center",
        gap: 34,
      }}
    >
      <div>
        <Kicker>SHIFT & SPECIAL EFFECT</Kicker>
        <MaskLine size={130} delay={4}>
          IŞIĞA GÖRE
        </MaskLine>
        <MaskLine size={130} delay={10} color={RED}>
          DEĞİŞEN RENK
        </MaskLine>
      </div>
      <div
        style={{
          height: 520,
          borderRadius: 44,
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(${angle}deg, #6a00f4, #00d4ff, #00ff9d, #ffb300, #ff0080, #6a00f4)`,
          scale: interpolate(frame, [0, 22], [0.92, 1], {
            extrapolateRight: "clamp",
            easing: EASE,
          }),
          opacity: prog(frame, 0, 12),
          boxShadow: "0 40px 120px rgba(227,0,27,0.25)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -50,
            bottom: -50,
            left: `${sweep}%`,
            width: "22%",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
            transform: "skewX(-18deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 44,
            bottom: 36,
            fontFamily,
            fontStyle: "italic",
            fontWeight: 800,
            fontSize: 120,
            lineHeight: 0.92,
            color: "#fff",
            textShadow: "0 6px 30px rgba(0,0,0,0.5)",
          }}
        >
          PREMIUM
          <br />
          SHIFT EFFECT
        </div>
      </div>
      <div style={{ display: "flex", gap: 28 }}>
        <Stat value={16} label="Shift Effect Rengi" delay={26} />
        <Stat value={9} label="Special Effect Rengi" delay={34} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Scene 5: CTA ---------- */

const SceneCta: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        padding: "340px 80px 340px",
        justifyContent: "center",
        alignItems: "center",
        gap: 34,
      }}
    >
      <div
        style={{
          opacity: prog(frame, 0, 14),
          scale: interpolate(frame, [0, 30], [0.6, 1], {
            extrapolateRight: "clamp",
            easing: EASE,
          }),
          filter: `drop-shadow(0 0 ${
            30 + Math.sin(frame / 8) * 14
          }px rgba(227,0,27,0.6))`,
        }}
      >
        <Logo width={820} />
      </div>
      <div style={{ textAlign: "center" }}>
        <MaskLine size={175} delay={14}>
          SEREL TUNING
        </MaskLine>
      </div>
      <div
        style={{
          background: RED,
          padding: "14px 44px",
          transform: "skewX(-12deg)",
          scale: interpolate(frame, [26, 42], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE,
          }),
        }}
      >
        <div
          style={{
            fontFamily,
            fontStyle: "italic",
            fontWeight: 800,
            fontSize: 80,
            letterSpacing: 4,
            color: "#fff",
            transform: "skewX(12deg)",
            whiteSpace: "nowrap",
          }}
        >
          YETKİLİ UYGULAMA MERKEZİ
        </div>
      </div>
      <div
        style={{
          fontFamily,
          fontStyle: "italic",
          fontWeight: 600,
          fontSize: 46,
          letterSpacing: 2,
          color: GREY,
          whiteSpace: "nowrap",
          opacity: prog(frame, 44, 16),
        }}
      >
        Profesyonel araç kaplama · Randevu için DM
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Composition ---------- */

export const OracalReel: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Audio
        src={staticFile("music.wav")}
        premountFor={fps}
        volume={0.8}
      />
      <Background />
      <Sequence name="Hook" from={S1} durationInFrames={S2 - S1} premountFor={fps}>
        <SceneHook />
      </Sequence>
      <Sequence name="Renkler" from={S2} durationInFrames={S3 - S2} premountFor={fps}>
        <SceneColors />
      </Sequence>
      <Sequence name="Özellikler" from={S3} durationInFrames={S4 - S3} premountFor={fps}>
        <SceneFeatures />
      </Sequence>
      <Sequence name="Efektler" from={S4} durationInFrames={S5 - S4} premountFor={fps}>
        <SceneEffects />
      </Sequence>
      <Sequence name="CTA" from={S5} durationInFrames={END - S5} premountFor={fps}>
        <SceneCta />
      </Sequence>
      <Chrome />
      <Wipes />
    </AbsoluteFill>
  );
};
