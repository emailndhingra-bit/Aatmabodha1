import React from 'react';
import { KPCusp, KPPlanet } from '../types';

interface Props {
  cusps?: KPCusp[];
  planets?: KPPlanet[];
}

const KPDisplay: React.FC<Props> = ({ cusps, planets }) => {
  if ((!cusps || cusps.length === 0) && (!planets || planets.length === 0)) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Cusps Table */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h4 className="text-md font-bold text-indigo-300 mb-3">Cuspal Positions</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="text-xs uppercase bg-slate-900/50 text-slate-400">
              <tr>
                <th className="px-2 py-2">Cusp</th>
                <th className="px-2 py-2">Degree</th>
                <th className="px-2 py-2">Sign</th>
                <th className="px-2 py-2">Sub Lord</th>
                <th className="px-2 py-2">Sub-Sub Lord</th>
              </tr>
            </thead>
            <tbody>
              {cusps?.map((c, i) => (
                <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="px-2 py-2 font-mono">{c.cusp}</td>
                  <td className="px-2 py-2">{c.degree}</td>
                  <td className="px-2 py-2">{c.sign || '-'}</td>
                  <td className="px-2 py-2 text-amber-300">{c.subLord || '-'}</td>
                  <td className="px-2 py-2 text-indigo-300">{c.subSubLord || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Planets Significators */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h4 className="text-md font-bold text-indigo-300 mb-3">Planetary Significators</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="text-xs uppercase bg-slate-900/50 text-slate-400">
              <tr>
                <th className="px-2 py-2">Planet</th>
                <th className="px-2 py-2">Star Lord</th>
                <th className="px-2 py-2">Sub Lord</th>
                <th className="px-2 py-2">Sub-Sub Lord</th>
                <th className="px-2 py-2">Sig. Houses</th>
              </tr>
            </thead>
            <tbody>
              {planets?.map((p, i) => (
                <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="px-2 py-2 font-bold text-white">{p.planet}</td>
                  <td className="px-2 py-2">{p.starLord || '-'}</td>
                  <td className="px-2 py-2">{p.subLord || '-'}</td>
                  <td className="px-2 py-2 text-indigo-300">{p.subSubLord || '-'}</td>
                  <td className="px-2 py-2 text-cyan-300">
                    {p.significatorHouses?.join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default KPDisplay;