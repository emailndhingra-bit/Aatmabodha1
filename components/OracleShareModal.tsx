import React, { useCallback, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { X } from "lucide-react";
import OracleShareCard from "./OracleShareCard";
import { oracleTextForShare, shareImageFileName } from "../services/oracleShareUtils";

const SHARE_SITE = "https://aatmabodha.com";

export type OracleShareModalProps = {
  open: boolean;
  onClose: () => void;
  rawMarkdown: string;
  userName: string;
  dashaLine: string;
  onToast: (message: string) => void;
};

const OracleShareModal: React.FC<OracleShareModalProps> = ({
  open,
  onClose,
  rawMarkdown,
  userName,
  dashaLine,
  onToast,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const plain = oracleTextForShare(rawMarkdown);
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const runCapture = useCallback(async (): Promise<Blob | null> => {
    const el = cardRef.current;
    if (!el) return null;
    setGenerating(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#0a0a0f",
        logging: false,
      });
      return new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/png", 0.95);
      });
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const handleSaveImage = async () => {
    const blob = await runCapture();
    if (!blob) {
      onToast("Could not create image");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = shareImageFileName(plain);
    a.click();
    URL.revokeObjectURL(url);
    onToast("Saved to your device");
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(plain);
      onToast("Copied to clipboard ✅");
    } catch {
      onToast("Copy failed — try another browser");
    }
  };

  const handleNativeShare = async () => {
    const blob = await runCapture();
    const url = typeof window !== "undefined" ? window.location.href : SHARE_SITE;
    const text = `${plain.slice(0, 1800)}${plain.length > 1800 ? "…" : ""}\n\n${SHARE_SITE}`;
    try {
      if (!navigator.share) {
        onToast("Share not available — try Save as Image");
        return;
      }
      if (blob) {
        const file = new File([blob], shareImageFileName(plain), { type: "image/png" });
        const withFiles: ShareData = {
          title: "Aatmabodha — Divine Intelligence",
          text: plain.slice(0, 500),
          url,
          files: [file],
        };
        if (typeof navigator.canShare === "function" && navigator.canShare(withFiles)) {
          await navigator.share(withFiles);
          onToast("Shared");
          return;
        }
      }
      await navigator.share({
        title: "Aatmabodha",
        text,
        url,
      });
      onToast("Shared");
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      console.warn(e);
      onToast("Share not available — try Save as Image");
    }
  };

  const tweetUrl = () => {
    const url = typeof window !== "undefined" ? window.location.href : SHARE_SITE;
    const snippet = plain.slice(0, 220).replace(/\s+/g, " ");
    const text = `${snippet}${plain.length > 220 ? "…" : ""}\n\n${url}`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  };

  const whatsappUrl = () => {
    const url = typeof window !== "undefined" ? window.location.href : SHARE_SITE;
    const text = `${plain.slice(0, 3000)}\n\n${url}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="oracle-share-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-label="Close share"
        onClick={onClose}
      />
      <div className="relative z-[1] max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-amber-600/25 bg-[#0f0c29] p-5 shadow-[0_0_60px_rgba(201,169,110,0.12)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="oracle-share-title" className="font-serif text-lg font-bold tracking-wide text-amber-100">
              Share insight
            </h2>
            <p className="mt-0.5 text-xs text-indigo-300/80">Luxury card · image · social</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-indigo-700/50 p-2 text-indigo-300 hover:bg-indigo-900/50 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mx-auto flex max-w-[400px] justify-center">
          <div
            className={`relative rounded-2xl ${generating ? "oracle-share-shimmer" : ""}`}
            style={{ boxShadow: "0 0 0 1px rgba(201,169,110,0.15)" }}
          >
            <OracleShareCard
              ref={cardRef}
              userName={userName}
              dashaLine={dashaLine}
              bodyText={plain}
              dateLabel={dateLabel}
            />
            {generating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#0a0a0f]/75 backdrop-blur-[2px]">
                <p className="animate-pulse px-6 text-center font-serif text-sm italic text-amber-200/95">
                  Generating your divine insight…
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={generating}
            onClick={() => void handleSaveImage()}
            className="flex items-center justify-center gap-2 rounded-xl border border-amber-600/40 bg-[#1a1a2e] py-3 text-sm font-semibold text-amber-100 transition hover:border-amber-400/60 hover:shadow-[0_0_20px_rgba(201,169,110,0.2)] disabled:opacity-50"
          >
            <span aria-hidden>📥</span> Save as Image
          </button>
          <button
            type="button"
            onClick={() => void handleCopyText()}
            className="flex items-center justify-center gap-2 rounded-xl border border-indigo-600/40 bg-[#15122b] py-3 text-sm font-semibold text-indigo-100 transition hover:border-amber-500/40 hover:text-amber-100"
          >
            <span aria-hidden>📋</span> Copy Text
          </button>
          <button
            type="button"
            disabled={generating}
            onClick={() => void handleNativeShare()}
            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-700/35 bg-[#13221a] py-3 text-sm font-semibold text-emerald-100/95 transition hover:border-emerald-500/50 disabled:opacity-50"
          >
            <span aria-hidden>📱</span> Share
          </button>
          <a
            href={tweetUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-sky-700/35 bg-[#121c28] py-3 text-center text-sm font-semibold text-sky-100 transition hover:border-sky-400/50"
          >
            <span aria-hidden>🐦</span> Tweet
          </a>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl border border-green-700/35 bg-[#142118] py-3 text-center text-sm font-semibold text-green-100/95 transition hover:border-green-500/45"
          >
            <span aria-hidden>💚</span> WhatsApp
          </a>
        </div>
      </div>
      <style>{`
        @keyframes oracle-share-shimmer {
          0% { opacity: 1; filter: brightness(1); }
          50% { opacity: 0.92; filter: brightness(1.08); }
          100% { opacity: 1; filter: brightness(1); }
        }
        .oracle-share-shimmer {
          animation: oracle-share-shimmer 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default OracleShareModal;
