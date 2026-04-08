import React from 'react';
import { Varshphal } from '../types';

interface Props {
  data?: Varshphal;
  bhriguBindu?: string;
  ishtaDevata?: string;
}

const VarshphalDisplay: React.FC<Props> = ({ data, bhriguBindu, ishtaDevata }) => {
  return (
    <div className="space-y-6">
      {/* Special Points Section */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-6 border border-indigo-700 shadow-lg relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-indigo-500"></div>
         <h3 className="text-lg font-bold text-white mb-4">Special Points</h3>
         <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-800/80 p-3 rounded border border-slate-600">
                 <div className="text-xs text-amber-400 uppercase tracking-wider mb-1 font-bold">Ishta Devata</div>
                 <div className="text-md text-white font-medium">{ishtaDevata || 'Calculating...'}</div>
             </div>
             <div className="bg-slate-800/80 p-3 rounded border border-slate-600">
                 <div className="text-xs text-amber-400 uppercase tracking-wider mb-1 font-bold">Bhrigu Bindu</div>
                 <div className="text-md text-white font-medium">{bhriguBindu || 'Calculating...'}</div>
             </div>
         </div>
      </div>

      {/* Varshphal Section */}
      {data && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <h3 className="text-lg font-bold text-white mb-4 z-10 relative">Varshphal (Annual Horoscope)</h3>
          
          <div className="grid grid-cols-2 gap-4 z-10 relative">
            <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Year</div>
              <div className="text-lg font-mono text-amber-300">{data.year || 'N/A'}</div>
            </div>
            
            <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Location</div>
              <div className="text-md font-medium text-white">{data.location || '-'}</div>
            </div>

            <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Muntha</div>
              <div className="text-md font-medium text-white">{data.muntha || '-'}</div>
              {data.munthaLord && <div className="text-xs text-slate-500">Lord: {data.munthaLord}</div>}
            </div>

            <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Varshphal Lagna</div>
              <div className="flex justify-between items-center">
                <span className="text-md font-medium text-white">{data.varshphalLagna || '-'}</span>
                {data.varshphalLagnaLord && <span className="text-xs text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">Lord: {data.varshphalLagnaLord}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VarshphalDisplay;