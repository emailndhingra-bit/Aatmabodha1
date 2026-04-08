import React, { useState } from 'react';
import { DashaSystem } from '../types';
import { AlertTriangle, ChevronRight, CornerDownRight } from 'lucide-react';

interface Props {
  dashas: DashaSystem[];
}

const DashaDisplay: React.FC<Props> = ({ dashas }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!dashas || dashas.length === 0) return <div className="text-slate-500">No Dasha data extracted.</div>;

  return (
    <div className="bg-slate-800 rounded-lg p-4 h-[400px] flex flex-col">
      <div className="flex border-b border-slate-700 mb-4 shrink-0 overflow-x-auto no-scrollbar">
        {dashas.map((d, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === idx 
                ? 'text-amber-400 border-b-2 border-amber-400' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {d.systemName}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="sticky top-0 bg-slate-800 z-10 pb-2 border-b border-slate-700/50 mb-2 grid grid-cols-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-2">Period Name</div>
            <div className="text-right">Timeframe</div>
        </div>
        <div className="space-y-1">
            {dashas[activeTab].periods.map((period, pIdx) => {
                const parts = String(period.name || '').split('-').map(s => s.trim());
                const depth = parts.length;
                
                // --- Updated Logic for Hierarchy ---
                // Level 1 (MD): E.g. "Sun" or "GEM" (depth 1) OR "Sun - Sun" (depth 2 but same)
                // Level 2 (AD): E.g. "Sun - Moon" (depth 2)
                // Level 3 (PD): E.g. "Sun - Moon - Mars" (depth 3)
                
                let isMD = false;
                let isAD = false;
                let isPD = false;

                if (depth === 1) {
                    isMD = true;
                } else if (depth === 2) {
                    if (parts[0] === parts[1]) isMD = true; // "Sun-Sun" treat as header
                    else isAD = true;
                } else if (depth >= 3) {
                    isPD = true;
                }
                
                // Base styles
                let containerClass = "flex justify-between items-center p-2 rounded border border-transparent transition-colors hover:bg-slate-700/50";
                let textClass = "font-medium flex items-center gap-2";
                
                if (isMD) {
                    containerClass += " bg-slate-700/30 mt-2 shadow-sm font-bold border-l-4 border-l-amber-500/50";
                    textClass += " text-amber-200 text-sm";
                } else if (isAD) {
                    containerClass += " ml-4 border-l border-l-slate-700 text-sm py-1.5 bg-slate-900/20";
                    textClass += " text-slate-300";
                } else if (isPD) {
                    // Level 3 Indentation
                    containerClass += " ml-10 border-l border-l-indigo-900/50 text-xs py-1 bg-black/20";
                    textClass += " text-indigo-300 font-normal";
                }

                if (period.isSandhi) {
                    containerClass += " border-amber-500/30 bg-amber-900/10";
                }

                return (
                  <div key={pIdx} className={containerClass}>
                    <span className={`col-span-2 ${textClass}`}>
                        {isAD && <ChevronRight className="w-3 h-3 text-slate-500" />}
                        {isPD && <CornerDownRight className="w-3 h-3 text-indigo-500/50" />}
                        
                        {/* Display Name Logic */}
                        {isPD ? parts[parts.length - 1] : period.name}

                        {period.isSandhi && (
                            <div className="flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-wide ml-2" title="Dasha Sandhi: Period of Instability">
                                <AlertTriangle className="w-3 h-3" /> Sandhi
                            </div>
                        )}
                    </span>
                    <div className="flex flex-col text-right text-xs text-slate-400 shrink-0">
                       <span className={`font-mono ${isPD ? 'text-[10px] text-indigo-400' : 'text-slate-300'}`}>{period.endDate}</span>
                       <span className="font-mono text-[9px] opacity-50">ends</span>
                    </div>
                  </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default DashaDisplay;