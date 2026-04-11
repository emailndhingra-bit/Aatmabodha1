
import React, { useState, useEffect } from 'react';
import { Target, CheckCircle, AlertTriangle, X, Loader2, User, Hand } from 'lucide-react'; // Scan removed
import { RectificationResult } from '../types';
import { generateBirthTimeRectification } from '../services/geminiService';

interface Props {
  db: any;
  userPhoto?: string | null;
  userPalm?: string | null;
  onClose: () => void;
  profileName?: string;
  language?: string;
}

const TimeRectification: React.FC<Props> = ({ db, userPhoto, userPalm, onClose, profileName = 'Profile', language = 'EN' }) => {
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'result'>('idle');
  const [result, setResult] = useState<RectificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // REMOVED CHECK: Previously required userPhoto or userPalm. Now proceeds without them.
    handleAnalyze();
  }, []);

  const handleAnalyze = async () => {
      setStatus('analyzing');
      setError(null);
      try {
          const res = await generateBirthTimeRectification(db, userPhoto, userPalm, profileName, language);
          if (res) {
              setResult(res);
              setStatus('result');
          } else {
              setError("Analysis failed. Please try again.");
              setStatus('idle');
          }
      } catch (e) {
          setError("Connection error.");
          setStatus('idle');
      }
  };

  const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-emerald-400';
      if (score >= 60) return 'text-amber-400';
      return 'text-rose-400';
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0c15]/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-[#120f26] border border-amber-500/30 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
            
            {/* Header */}
            <div className="p-6 border-b border-indigo-900/50 flex justify-between items-center bg-gradient-to-r from-[#120f26] to-[#1a1638]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
                        <Target className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-serif font-bold text-amber-50 tracking-wide">Auto-Triangulation</h2>
                        <p className="text-xs text-indigo-300">Birth Time Rectification (BTR) Protocol</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                
                {/* Error State */}
                {error && (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
                        <p className="text-rose-200 mb-6">{error}</p>
                        <button onClick={onClose} className="px-6 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">Close</button>
                    </div>
                )}

                {/* Analyzing State */}
                {status === 'analyzing' && (
                    <div className="flex flex-col items-center justify-center h-96 space-y-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-20 animate-pulse"></div>
                            <Loader2 className="w-20 h-20 text-amber-400 animate-spin relative z-10" />
                        </div>
                        <div className="flex gap-4 opacity-50">
                            {userPhoto ? (
                                <div className="flex items-center gap-2 text-xs text-indigo-300"><User className="w-4 h-4" /> Face Scan Active</div>
                            ) : (
                                <div className="flex items-center gap-2 text-xs text-slate-500"><User className="w-4 h-4" /> No Face Data</div>
                            )}
                            {userPalm ? (
                                <div className="flex items-center gap-2 text-xs text-indigo-300"><Hand className="w-4 h-4" /> Palm Scan Active</div>
                            ) : (
                                <div className="flex items-center gap-2 text-xs text-slate-500"><Hand className="w-4 h-4" /> No Palm Data</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Result State */}
                {status === 'result' && result && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        
                        {/* Score Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-[#0f0c29] p-6 rounded-2xl border border-indigo-900/50 flex flex-col items-center justify-center text-center shadow-inner">
                                <span className="text-xs text-indigo-400 uppercase tracking-widest font-bold mb-2">Confidence Score</span>
                                <div className={`text-6xl font-serif font-bold ${getScoreColor(result.confidenceScore)}`}>
                                    {result.confidenceScore}%
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Accuracy Probability</p>
                            </div>
                            
                            <div className="md:col-span-2 bg-[#1a1638]/50 p-6 rounded-2xl border border-indigo-900/50">
                                <h3 className="text-lg font-bold text-white mb-4 border-b border-white/5 pb-2">The Verdict</h3>
                                <p className="text-slate-300 leading-relaxed text-sm mb-4">
                                    {result.verdict}
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                        <div className="text-[10px] text-amber-500 uppercase font-bold mb-1">Chart vs Face</div>
                                        <p className="text-xs text-slate-300">{result.visualMatchAnalysis || "Not Analyzed"}</p>
                                    </div>
                                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                        <div className="text-[10px] text-emerald-500 uppercase font-bold mb-1">Chart vs Palm</div>
                                        <p className="text-xs text-slate-300">{result.palmMatchAnalysis || "Not Analyzed"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rectification Questions */}
                        {result.confidenceScore < 95 && (
                            <div>
                                <h3 className="text-xl font-serif text-amber-100 mb-4 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-amber-400" />
                                    Refinement Questions
                                </h3>
                                <p className="text-sm text-indigo-300/70 mb-6">
                                    To move closer to 100% accuracy, verify these specific details which distinguish your current Lagna from adjacent signs (±2 hours).
                                </p>
                                <div className="grid grid-cols-1 gap-4">
                                    {result.rectificationQuestions.map((q, i) => (
                                        <div key={i} className="bg-[#1e1b4b] border border-indigo-500/20 p-5 rounded-xl hover:border-amber-500/30 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <div className="bg-indigo-900/50 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">{i + 1}</div>
                                                <div className="flex-1">
                                                    <h4 className="text-white font-medium mb-3">{q.question}</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                                        <div className="bg-black/30 p-3 rounded border border-white/5 cursor-pointer hover:bg-emerald-900/20 hover:border-emerald-500/50 transition-all group">
                                                            <span className="text-[10px] text-slate-500 block uppercase tracking-wider mb-1">Possibility A</span>
                                                            <span className="text-sm text-slate-200 group-hover:text-emerald-300">{q.optionA}</span>
                                                        </div>
                                                        <div className="bg-black/30 p-3 rounded border border-white/5 cursor-pointer hover:bg-amber-900/20 hover:border-amber-500/50 transition-all group">
                                                            <span className="text-[10px] text-slate-500 block uppercase tracking-wider mb-1">Possibility B</span>
                                                            <span className="text-sm text-slate-200 group-hover:text-amber-300">{q.optionB}</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-indigo-400 italic border-l-2 border-indigo-500/30 pl-3">
                                                        Logic: {q.reasoning}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default TimeRectification;
