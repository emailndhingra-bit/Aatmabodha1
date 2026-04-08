
import React from 'react';
import { PlanetInfo } from '../types';
import { AlertTriangle } from 'lucide-react';

interface Props {
  planets: PlanetInfo[];
}

const PlanetaryTable: React.FC<Props> = ({ planets }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full text-sm text-left text-slate-300 whitespace-nowrap">
        <thead className="text-xs uppercase bg-slate-800 text-amber-400">
          <tr>
            <th className="px-4 py-3">Planet</th>
            <th className="px-4 py-3">R</th>
            <th className="px-4 py-3">Sign</th>
            <th className="px-4 py-3">Degree</th>
            <th className="px-4 py-3">Nakshatra</th>
            <th className="px-4 py-3">Lord</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">NBRY</th>
            <th className="px-4 py-3">Yogas & Bhangas</th>
            <th className="px-4 py-3">Jamini</th>
            <th className="px-4 py-3">Houses Owned</th>
            <th className="px-4 py-3">Houses Aspected</th>
          </tr>
        </thead>
        <tbody>
          {planets.map((p, idx) => {
            let bhangas: string[] = [];
            try {
                if (p.yogaBhangas && p.yogaBhangas !== 'No') bhangas = JSON.parse(p.yogaBhangas);
            } catch (e) {}
            
            return (
            <tr key={idx} className="border-b border-slate-700 hover:bg-slate-800/50">
              <td className="px-4 py-3 font-medium text-white">{p.planet}</td>
              <td className="px-4 py-3 text-red-400 font-bold">{p.retrograde ? 'R' : ''}</td>
              <td className="px-4 py-3">{p.sign}</td>
              <td className="px-4 py-3 font-mono">{p.degree}</td>
              <td className="px-4 py-3 text-cyan-300">{p.nakshatra}</td>
              <td className="px-4 py-3">{p.lord || '-'}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                  p.status === 'Exalted' ? 'bg-green-900 text-green-300' :
                  p.status === 'Debilitated' ? 'bg-red-900 text-red-300' :
                  p.status === 'Own' ? 'bg-blue-900 text-blue-300' : 
                  'bg-slate-700 text-slate-400'
                }`}>
                  {p.status || '-'}
                </span>
              </td>
              <td className="px-4 py-3 text-yellow-300">{p.nbry === 'Yes' ? 'Yes' : '-'}</td>
              <td className="px-4 py-3 text-xs max-w-[250px]">
                  <div className="flex flex-col gap-1">
                      {p.yogas && <span className="truncate" title={p.yogas}>{p.yogas}</span>}
                      {bhangas.length > 0 && bhangas.map((b, i) => (
                          <div key={i} className="flex items-center gap-1 text-rose-400 font-bold bg-rose-900/20 px-1.5 py-0.5 rounded border border-rose-500/30 w-fit">
                              <AlertTriangle className="w-3 h-3" />
                              <span className="text-[10px]">{b}</span>
                          </div>
                      ))}
                      {!p.yogas && bhangas.length === 0 && <span className="text-slate-500">-</span>}
                  </div>
              </td>
              <td className="px-4 py-3 text-purple-300">{p.jamini || '-'}</td>
              <td className="px-4 py-3 text-slate-400">{p.housesOwned || '-'}</td>
              <td className="px-4 py-3 text-slate-400">{p.housesAspected || '-'}</td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  );
};

export default PlanetaryTable;
