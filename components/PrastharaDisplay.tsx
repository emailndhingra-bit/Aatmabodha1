import React, { useState } from 'react';
import { PrastharaTable } from '../types';

interface Props {
  tables?: PrastharaTable[];
}

const signs = ["Ar", "Ta", "Ge", "Ca", "Le", "Vi", "Li", "Sc", "Sa", "Cp", "Aq", "Pi"];
const fullSigns = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

const PrastharaDisplay: React.FC<Props> = ({ tables }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!tables || tables.length === 0) return null;

  const currentTable = tables[activeTab];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-700 bg-slate-900/50">
            {tables.map((t, idx) => (
                <button
                    key={idx}
                    onClick={() => setActiveTab(idx)}
                    className={`px-4 py-3 text-sm font-bold whitespace-nowrap transition-colors ${
                        activeTab === idx 
                        ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                >
                    {t.planet} P.A.V.
                </button>
            ))}
        </div>

        {/* Detailed Matrix Table */}
        <div className="p-4 overflow-x-auto">
             {currentTable && currentTable.matrix && currentTable.matrix.length > 0 ? (
                 <table className="w-full text-xs text-left border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 border border-slate-600 bg-slate-700 text-slate-300">Donor / Sign</th>
                            {signs.map((s, i) => (
                                <th key={i} className="p-2 border border-slate-600 bg-slate-700 text-slate-300 text-center w-10">{s}</th>
                            ))}
                            <th className="p-2 border border-slate-600 bg-slate-700 text-amber-400 font-bold text-center">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentTable.matrix.map((row, idx) => {
                            const rowTotal = row.points.reduce((a, b) => a + b, 0);
                            return (
                                <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="p-2 border border-slate-600 font-medium text-slate-200">{row.donor}</td>
                                    {row.points.map((pt, i) => (
                                        <td key={i} className={`p-2 border border-slate-600 text-center ${pt === 1 ? 'text-green-400 font-bold' : 'text-slate-600'}`}>
                                            {pt === 1 ? '•' : ''}
                                        </td>
                                    ))}
                                    <td className="p-2 border border-slate-600 text-center text-slate-300 font-mono">{rowTotal}</td>
                                </tr>
                            );
                        })}
                        {/* Grand Total Row */}
                        <tr className="bg-slate-700/50 font-bold border-t-2 border-slate-500">
                             <td className="p-2 border border-slate-600 text-amber-400">Total (BAV)</td>
                             {currentTable.rows.map((r, i) => (
                                 <td key={i} className={`p-2 border border-slate-600 text-center ${r.points >= 5 ? 'text-green-400' : r.points <= 3 ? 'text-red-400' : 'text-white'}`}>
                                     {r.points}
                                 </td>
                             ))}
                             <td className="p-2 border border-slate-600 text-center text-amber-400 text-lg">
                                 {currentTable.rows.reduce((a, b) => a + b.points, 0)}
                             </td>
                        </tr>
                    </tbody>
                 </table>
             ) : (
                 <div className="text-slate-400 text-center py-4">Detailed matrix data not available. Showing summary.</div>
             )}
             
             {/* Fallback or Summary View if Matrix is missing, or just summary details below */}
             {(!currentTable.matrix || currentTable.matrix.length === 0) && (
                 <div className="grid grid-cols-6 md:grid-cols-12 gap-2 mt-4">
                     {currentTable.rows.map((row, rIdx) => (
                        <div key={rIdx} className="flex flex-col items-center bg-slate-900/50 p-2 rounded border border-slate-700">
                           <span className="text-[10px] text-slate-500 uppercase">{row.sign.substring(0,3)}</span>
                           <span className={`text-lg font-bold ${row.points >= 5 ? 'text-green-400' : row.points <= 3 ? 'text-red-400' : 'text-slate-200'}`}>
                             {row.points}
                           </span>
                        </div>
                     ))}
                 </div>
             )}
        </div>
    </div>
  );
};

export default PrastharaDisplay;