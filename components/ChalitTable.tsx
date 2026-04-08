
import React from 'react';
import { ChalitRow, PlanetaryShift } from '../types';
import { ArrowRight } from 'lucide-react';

interface Props {
  rows: ChalitRow[];
  shifts?: PlanetaryShift[];
}

const ChalitTable: React.FC<Props> = ({ rows, shifts }) => {
  if (!rows || rows.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Shifts Summary */}
      {shifts && shifts.length > 0 && (
        <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-3">
            <h4 className="text-sm font-bold text-indigo-300 mb-2 uppercase tracking-wide">Planetary Shifts Detected</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {shifts.map((shift, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-slate-900/50 p-2 rounded border border-slate-700">
                        <span className="font-bold text-white">{shift.planet}</span>
                        <div className="flex items-center text-slate-400">
                            H{shift.fromHouse} <ArrowRight className="w-3 h-3 mx-1 text-amber-400" /> H{shift.toHouse}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs uppercase bg-slate-800 text-amber-400">
            <tr>
              <th className="px-4 py-3">House</th>
              <th className="px-4 py-3">Sign</th>
              <th className="px-4 py-3 border-r border-slate-700">Bhava Begin (Sandhi)</th>
              <th className="px-4 py-3 border-r border-slate-700 text-amber-200">Bhava Mid (Cusp)</th>
              <th className="px-4 py-3">Bhava End</th>
              <th className="px-4 py-3">Planets in Bhava</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-3 font-bold text-white">{row.house}</td>
                <td className="px-4 py-3 text-slate-300">{row.sign || '-'}</td>
                <td className="px-4 py-3 border-r border-slate-700 font-mono text-xs">{row.startDegree || '-'}</td>
                <td className="px-4 py-3 border-r border-slate-700 font-mono text-xs text-amber-200 font-bold">{row.degree || '-'}</td>
                <td className="px-4 py-3 font-mono text-xs">{row.endDegree || '-'}</td>
                <td className="px-4 py-3">
                   {row.planets && row.planets.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                          {row.planets.map((p, i) => (
                              <span key={i} className="px-2 py-0.5 bg-indigo-900/50 text-indigo-300 rounded border border-indigo-700/50 text-xs">
                                  {p}
                              </span>
                          ))}
                      </div>
                   ) : (
                       <span className="text-slate-600">-</span>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChalitTable;
