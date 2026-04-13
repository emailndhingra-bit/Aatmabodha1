import React, { forwardRef } from "react";

const BG = "#0a0a0f";
const GOLD = "#c9a96e";
const TEXT = "#e8e0d0";
const ACCENT = "#1a1a2e";

type Props = {
  userName: string;
  dashaLine: string;
  bodyText: string;
  dateLabel: string;
};

/** Mandala-style radial watermark (low opacity). */
function MandalaWatermark() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 400 520"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="shareMandalaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.14" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#shareMandalaGrad)" strokeWidth="0.35" opacity="0.85">
        {Array.from({ length: 16 }, (_, i) => (
          <ellipse
            key={`e-${i}`}
            cx="200"
            cy="240"
            rx={28 + i * 11}
            ry={36 + i * 9}
            transform={`rotate(${i * 11.25} 200 240)`}
          />
        ))}
        {[6, 14, 22, 30, 38, 46, 54].map((r) => (
          <circle key={`c-${r}`} cx="200" cy="240" r={r * 3.2} />
        ))}
      </g>
    </svg>
  );
}

/** Subtle corner nakshatra / star motif. */
function StarBorder() {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.22]"
      style={{
        boxShadow: `inset 0 0 0 1px ${GOLD}33, inset 0 0 40px ${ACCENT}`,
        backgroundImage: `
          radial-gradient(circle at 12% 18%, ${GOLD} 0.5px, transparent 1.2px),
          radial-gradient(circle at 88% 22%, ${GOLD} 0.45px, transparent 1px),
          radial-gradient(circle at 20% 82%, ${GOLD} 0.4px, transparent 1px),
          radial-gradient(circle at 78% 78%, ${GOLD} 0.5px, transparent 1.1px),
          radial-gradient(circle at 50% 8%, ${GOLD} 0.35px, transparent 0.9px),
          radial-gradient(circle at 6% 50%, ${GOLD} 0.35px, transparent 0.9px),
          radial-gradient(circle at 94% 55%, ${GOLD} 0.35px, transparent 0.9px)
        `,
        backgroundSize: "100% 100%",
      }}
    />
  );
}

const OracleShareCard = forwardRef<HTMLDivElement, Props>(function OracleShareCard(
  { userName, dashaLine, bodyText, dateLabel },
  ref
) {
  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-2xl shadow-2xl"
      style={{
        width: 380,
        minHeight: 280,
        backgroundColor: BG,
        color: TEXT,
        fontFamily: "'Cormorant Garamond', 'Cinzel', Georgia, serif",
      }}
    >
      <MandalaWatermark />
      <StarBorder />

      <div className="relative z-[1] px-7 pb-6 pt-7">
        <div className="mb-5 flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-lg font-semibold tracking-tight"
            style={{
              borderColor: `${GOLD}66`,
              color: GOLD,
              background: `linear-gradient(145deg, ${ACCENT}, #0f0f18)`,
              fontFamily: "'Cinzel', serif",
              boxShadow: `0 0 20px ${GOLD}22`,
            }}
          >
            ॐ
          </div>
          <div>
            <div
              className="text-lg font-semibold tracking-[0.2em] uppercase"
              style={{ color: GOLD, fontFamily: "'Cinzel', serif" }}
            >
              Aatmabodha
            </div>
            <div className="text-[11px] tracking-[0.35em] uppercase opacity-80" style={{ color: `${TEXT}cc` }}>
              Divine Intelligence
            </div>
          </div>
        </div>

        <div
          className="mb-4 border-b pb-4"
          style={{ borderColor: `${GOLD}28` }}
        >
          <div className="text-base font-semibold" style={{ color: TEXT }}>
            {userName || "Seeker"}
          </div>
          <div className="mt-1 text-sm italic opacity-90" style={{ color: GOLD }}>
            {dashaLine}
          </div>
        </div>

        <div
          className="text-[15px] leading-[1.55] whitespace-pre-wrap"
          style={{
            color: TEXT,
            fontFamily: "'Cormorant Garamond', Georgia, serif",
          }}
        >
          {bodyText}
        </div>

        <div
          className="mt-6 rounded-lg px-4 py-3"
          style={{
            background: `linear-gradient(90deg, ${ACCENT} 0%, #12122a 45%, ${BG} 100%)`,
            borderTop: `1px solid ${GOLD}33`,
          }}
        >
          <div className="flex items-end justify-between gap-2">
            <span className="text-[11px] tracking-widest opacity-75" style={{ color: `${TEXT}aa` }}>
              {dateLabel}
            </span>
            <span
              className="text-xs font-semibold tracking-[0.25em]"
              style={{ color: GOLD, fontFamily: "'Cinzel', serif" }}
            >
              aatmabodha.com
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default OracleShareCard;
