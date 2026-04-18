import React, { useMemo, useState } from 'react';
import type { AnalysisResult } from '../types';
import { generatePersonalizedFAQ, type FAQCategory } from '../services/personalizedFaq';

type Props = {
  chartData: AnalysisResult | null;
  onQuestionClick: (question: string) => void;
};

const ChartPersonalizedFAQ: React.FC<Props> = ({ chartData, onQuestionClick }) => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const faqs: FAQCategory[] = useMemo(
    () => (chartData ? generatePersonalizedFAQ(chartData) : []),
    [chartData],
  );

  if (!chartData || faqs.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-[#1a1638]/90 to-[#0f0c29]/95 p-4 sm:p-5 shadow-[0_0_30px_rgba(99,102,241,0.12)]">
      <h3 className="text-center font-serif text-lg font-bold text-amber-100 mb-1">
        ✨ Questions Written in Your Chart
      </h3>
      <p className="text-center text-xs text-indigo-300/80 mb-4">
        Tap any question to ask the Oracle
      </p>

      <div className="space-y-2 max-h-[min(70vh,520px)] overflow-y-auto custom-scrollbar pr-1">
        {faqs.map((faq) => {
          const open = openCategory === faq.category;
          return (
            <div
              key={faq.category}
              className="rounded-xl border border-indigo-600/30 bg-[#120f26]/80 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenCategory(open ? null : faq.category)}
                className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left text-sm font-semibold text-indigo-100 hover:bg-indigo-950/50 transition-colors"
              >
                <span className="min-w-0">{faq.category}</span>
                <span className="shrink-0 text-indigo-400 text-xs">{open ? '▲' : '▼'}</span>
              </button>

              {open && (
                <div className="border-t border-indigo-800/40 px-3 pb-3 pt-1 flex flex-col gap-2">
                  {faq.questions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => onQuestionClick(q)}
                      className="text-left rounded-lg border border-amber-900/25 bg-[#0B0c15]/90 px-3 py-2.5 text-xs sm:text-sm text-indigo-100/95 leading-snug hover:border-amber-500/40 hover:bg-indigo-950/40 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChartPersonalizedFAQ;
