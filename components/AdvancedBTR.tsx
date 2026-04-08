
import React, { useState, useEffect } from 'react';
import { Target, CheckCircle, ArrowRight, Loader2, Clock, AlertTriangle, ChevronRight, RotateCcw, Sparkles, Zap } from 'lucide-react';
import { runAdvancedBTRStep } from '../services/geminiService';

interface Props {
  db: any;
}

const STEPS = ['D1', 'D9', 'KP', 'D10', 'D60'];

const AdvancedBTR: React.FC<Props> = ({ db }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stepData, setStepData] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<string | null>(null);

  useEffect(() => {
    loadStep();
  }, [currentStepIndex]);

  const loadStep = async () => {
      setLoading(true);
      setStepData(null);
      setSelectedOption(null);
      
      const stepName = STEPS[currentStepIndex] || 'FINAL';
      
      try {
          const data = await runAdvancedBTRStep(db, stepName, history);
          if (data) {
              if (stepName === 'FINAL' || (currentStepIndex >= STEPS.length)) {
                  setFinalResult(data.finalVerdict || data.analysis);
              } else {
                  setStepData(data);
              }
          }
      } catch (e) {
          console.error("Step Load Failed", e);
      } finally {
          setLoading(false);
      }
  };

  const handleConfirm = () => {
      if (!selectedOption || !stepData) return;
      
      const choice = stepData.options.find((o: any) => o.id === selectedOption);
      const record = {
          step: STEPS[currentStepIndex],
          choice: choice
      };
      
      setHistory(prev => [...prev, record]);
      
      if (currentStepIndex < STEPS.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
      } else {
          // Trigger Final Synthesis
          setLoading(true);
          runAdvancedBTRStep(db, 'FINAL', [...history, record]).then(res => {
              setFinalResult(res?.finalVerdict || res?.analysis || "Rectification Complete.");
              setLoading(false);
          });
          setCurrentStepIndex(prev => prev + 1); // Move to final state visually
      }
  };

  const handleReset = () => {
      setCurrentStepIndex(0);
      setHistory([]);
      setFinalResult(null);
      setStepData(null);
  };

  if (!db) return <div className="p-10 text-center text-slate-500">Please load data first.</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Protocol Status */}
        <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-900/30 border border-amber-500/30 rounded-full text-[10px] text-amber-200 uppercase tracking-widest font-bold shadow-lg shadow-amber-500/10">
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
                Protocol 14 Active
            </div>
        </div>

        {/* Progress Stepper (Centered & Styled) */}
        {!finalResult && (
            <div className="flex justify-center items-center gap-4 sm:gap-6 py-6">
                {STEPS.map((step, idx) => (
                    <div key={step} className="flex items-center">
                        <div className={`relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all duration-300 ${
                            idx === currentStepIndex 
                            ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-110 z-10' 
                            : idx < currentStepIndex 
                            ? 'bg-[#1a1638] border-emerald-500/50 text-emerald-500' 
                            : 'bg-[#0f0c29] border-indigo-900 text-indigo-700'
                        }`}>
                            {idx < currentStepIndex ? <CheckCircle className="w-5 h-5" /> : <span className="font-serif font-bold text-xs sm:text-sm">{step}</span>}
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div className={`h-0.5 w-8 sm:w-12 md:w-16 ml-2 rounded-full transition-colors ${idx < currentStepIndex ? 'bg-emerald-900' : 'bg-indigo-950'}`}></div>
                        )}
                    </div>
                ))}
            </div>
        )}

        {/* Main Content Area */}
        <div className="bg-[#0f0c29] border border-amber-500/20 rounded-3xl p-1 shadow-2xl relative overflow-hidden ring-1 ring-white/5">
            
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>

            {loading ? (
                <div className="flex flex-col items-center justify-center text-center space-y-6 h-[500px]">
                    <div className="relative">
                        <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-20 animate-pulse"></div>
                        <Loader2 className="w-16 h-16 text-amber-400 animate-spin relative z-10" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-serif text-amber-100 tracking-wide mb-2 animate-pulse">Calibrating Time...</h3>
                        <p className="text-indigo-300/60 text-sm font-light">Checking Protocol 14 Rules for {STEPS[currentStepIndex] || 'Final Synthesis'}</p>
                    </div>
                </div>
            ) : finalResult ? (
                <div className="flex flex-col items-center justify-center text-center space-y-8 min-h-[500px] animate-in zoom-in-95 duration-500 p-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-600 to-teal-900 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)] border border-emerald-400/30">
                        <Clock className="w-12 h-12 text-white" />
                    </div>
                    <div className="max-w-2xl w-full">
                        <h3 className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-400 mb-6">Rectification Complete</h3>
                        <div className="bg-[#1a1638]/80 p-8 rounded-2xl border border-emerald-500/20 text-left shadow-lg backdrop-blur-sm relative group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50 rounded-l-2xl"></div>
                            <p className="text-indigo-100 leading-loose text-lg whitespace-pre-wrap font-light">{finalResult}</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 px-8 py-3 rounded-full border border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <RotateCcw className="w-4 h-4" /> Start Over
                    </button>
                </div>
            ) : stepData ? (
                <div className="p-6 md:p-10 space-y-10 animate-in fade-in slide-in-from-right-4">
                    
                    {/* Analysis Box */}
                    <div className="bg-[#15122b] border-l-4 border-amber-500 p-6 rounded-r-xl shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Sparkles className="w-32 h-32" /></div>
                        <div className="flex justify-between items-start mb-3 relative z-10">
                            <h4 className="text-amber-500 font-bold uppercase tracking-[0.2em] text-xs">Analysis Phase: {STEPS[currentStepIndex]}</h4>
                            {stepData.confidence && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-amber-300 text-xs font-bold shadow-sm">
                                    Confidence: {stepData.confidence}%
                                </div>
                            )}
                        </div>
                        <p className="text-slate-200 text-base leading-relaxed font-light relative z-10">{stepData.analysis}</p>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stepData.options.map((opt: any) => (
                            <button
                                key={opt.id}
                                onClick={() => setSelectedOption(opt.id)}
                                className={`relative group flex flex-col h-full text-left rounded-2xl transition-all duration-300 overflow-hidden border-2 ${
                                    selectedOption === opt.id 
                                    ? 'bg-[#1e1b4b] border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)] scale-[1.02]' 
                                    : 'bg-[#1a1638] border-transparent hover:border-indigo-500/50 hover:bg-[#1f1b40]'
                                }`}
                            >
                                {/* Header */}
                                <div className={`p-4 border-b ${selectedOption === opt.id ? 'border-amber-500/30 bg-amber-500/10' : 'border-indigo-900/30 bg-[#15122b]'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                                            opt.id === 'curr' ? 'bg-blue-900/30 text-blue-300' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            {opt.id === 'curr' ? 'Current Time' : opt.timeAdjustment}
                                        </span>
                                        {selectedOption === opt.id && <CheckCircle className="w-5 h-5 text-amber-400 animate-in zoom-in" />}
                                    </div>
                                    <h5 className={`text-lg font-serif font-bold leading-tight ${selectedOption === opt.id ? 'text-amber-100' : 'text-slate-200 group-hover:text-white'}`}>
                                        {opt.label}
                                    </h5>
                                </div>

                                {/* Body */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <p className="text-sm text-indigo-200/80 leading-relaxed mb-4">
                                        {opt.description}
                                    </p>
                                    
                                    {/* Questions List inside card */}
                                    {opt.questions && (
                                        <div className="mt-auto bg-black/20 p-3 rounded-xl border border-white/5">
                                            <span className="text-[9px] text-slate-500 uppercase font-bold mb-2 block">Checkpoints:</span>
                                            <ul className="space-y-2">
                                                {opt.questions.map((q: string, i: number) => (
                                                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${selectedOption === opt.id ? 'bg-amber-400' : 'bg-indigo-500'}`}></div>
                                                        {q}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Bottom Action */}
                    <div className="flex justify-end pt-6 border-t border-indigo-900/30">
                        <button 
                            onClick={handleConfirm}
                            disabled={!selectedOption}
                            className={`flex items-center gap-3 px-10 py-4 rounded-xl font-bold text-sm tracking-wide shadow-xl transition-all duration-300 transform ${
                                selectedOption 
                                ? 'bg-gradient-to-r from-amber-700 to-orange-700 text-white hover:from-amber-600 hover:to-orange-600 hover:shadow-amber-900/40 hover:-translate-y-1' 
                                : 'bg-[#1a1638] text-slate-500 cursor-not-allowed border border-indigo-900'
                            }`}
                        >
                            Confirm Selection <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center text-rose-400">
                    <AlertTriangle className="w-8 h-8 mb-2" />
                    Error loading step data.
                </div>
            )}
        </div>
    </div>
  );
};

export default AdvancedBTR;
