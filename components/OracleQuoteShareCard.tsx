import React, { forwardRef } from "react";

const BG = "#0a0a0f";
const GOLD = "#c9a96e";
const TEXT = "#e8e0d0";
const ACCENT = "#1a1a2e";

export type QuoteAspect = "1:1" | "9:16" | "16:9";

const LAYOUT: Record<QuoteAspect, { w: number; h: number; quotePx: number; pad: number; lead: number }> = {
  "1:1": { w: 400, h: 400, quotePx: 21, pad: 26, lead: 1.45 },
  "9:16": { w: 360, h: 640, quotePx: 24, pad: 28, lead: 1.5 },
  "16:9": { w: 640, h: 360, quotePx: 19, pad: 22, lead: 1.42 },
};

function MandalaBg() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <radialGradient id="qMand" cx="50%" cy="45%" r="70%">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.5" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="none" stroke="url(#qMand)" strokeWidth="0.2" />
      {[18, 28, 38, 48].map((r) => (
        <circle key={r} cx="50" cy="50" r={r} fill="none" stroke={GOLD} strokeWidth="0.08" opacity="0.4" />
      ))}
    </svg>
  );
}

type Props = {
  userName: string;
  dashaLine: string;
  quoteText: string;
  aspect: QuoteAspect;
};

const OracleQuoteShareCard = forwardRef<HTMLDivElement, Props>(function OracleQuoteShareCard(
  { userName, dashaLine, quoteText, aspect },
  ref
) {
  const { w, h, quotePx, pad, lead } = LAYOUT[aspect];

  return (
    <div
      ref={ref}
      className="relative flex flex-col overflow-hidden rounded-2xl shadow-2xl"
      style={{
        width: w,
        height: h,
        minWidth: w,
        minHeight: h,
        backgroundColor: BG,
        color: TEXT,
        boxShadow: `inset 0 0 0 1px ${GOLD}33`,
      }}
    >
      <MandalaBg />
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.2]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 10% 12%, ${GOLD} 0.4px, transparent 1px),
            radial-gradient(circle at 90% 18%, ${GOLD} 0.35px, transparent 0.9px),
            radial-gradient(circle at 14% 88%, ${GOLD} 0.35px, transparent 0.9px),
            radial-gradient(circle at 88% 86%, ${GOLD} 0.4px, transparent 1px)
          `,
        }}
      />

      <div className="relative z-[1] flex h-full min-h-0 flex-col" style={{ padding: pad }}>
        <div className="flex shrink-0 items-center gap-2 border-b pb-3" style={{ borderColor: `${GOLD}30` }}>
          <span className="text-lg" aria-hidden>
            🔮
          </span>
          <div className="min-w-0">
            <div className="truncate font-serif text-xs font-semibold tracking-[0.2em] text-amber-100/95">
              Aatmabodha
            </div>
            <div className="truncate text-[11px]" style={{ color: "rgba(232,224,208,0.78)" }}>
              {userName || "Seeker"}
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-3 text-center">
          <span
            className="mb-1 block font-serif opacity-55"
            style={{ color: GOLD, fontSize: Math.max(quotePx + 8, 28), lineHeight: 1 }}
            aria-hidden
          >
            “
          </span>
          <p
            className="max-h-full min-h-0 overflow-hidden px-1 font-medium"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: quotePx,
              lineHeight: lead,
              color: TEXT,
            }}
          >
            {quoteText}
          </p>
          <span
            className="mt-1 block font-serif opacity-55"
            style={{ color: GOLD, fontSize: Math.max(quotePx + 8, 28), lineHeight: 1 }}
            aria-hidden
          >
            ”
          </span>
        </div>

        <div
          className="mt-auto flex shrink-0 flex-col gap-1 rounded-lg px-3 py-2.5"
          style={{
            background: `linear-gradient(90deg, ${ACCENT}, #101018)`,
            borderTop: `1px solid ${GOLD}35`,
          }}
        >
          <div className="text-center font-serif text-[11px] italic leading-snug" style={{ color: GOLD }}>
            {dashaLine}
          </div>
          <div className="text-center font-serif text-[10px] font-semibold tracking-[0.28em]" style={{ color: "rgba(232,224,208,0.65)" }}>
            aatmabodha.com
          </div>
        </div>
      </div>
    </div>
  );
});

export default OracleQuoteShareCard;
