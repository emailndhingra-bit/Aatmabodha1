import React from 'react';
import { PrastharaTable } from '../types';

interface Props {
  prasthara: PrastharaTable[];
  sav: Record<string, number>;
}

const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

const AshtakvargaTable: React.FC<Props> = ({ prasthara, sav }) => {
  if (!prasthara || prasthara.length === 0) return null;

  // We need to pivot the data: Rows = Signs (1-12), Cols = Planets (Sun...Sat)
  // Extract BAV scores for each planet for each sign
  const tableData = signs.map((signName, index) => {
     const signIndex = index; // 0-11
     const rowData: any = { sign: signName, signNum: index + 1 };
     
     // For each planet (Sun, Moon...) find their score in this sign
     prasthara.forEach(p => {
         const planetName = p.planet;
         // p.rows[signIndex] should correspond to the sign if sorted, but let's be safe if possible
         // Assuming p.rows is ordered Aries -> Pisces
         const points = p.rows[signIndex]?.points || 0;
         rowData[planetName] = points;
     });
     
     // SAV Total for this sign (index + 1)
     rowData['SAV'] = sav[(index + 1).toString()] || 0;
     
     return rowData;
  });

  // Get list of planets from prasthara for columns
  const planetColumns = prasthara.map(p => p.planet);

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full text-sm text-left text-slate-300 border-collapse">
        <thead className="text-xs uppercase bg-slate-800 text-amber-400">
          <tr>
            <th className="px-4 py-3 border border-slate-600">Sign</th>
            {planetColumns.map(p => (
                <th key={p} className="px-4 py-3 border border-slate-600 text-center">{p.substring(0,3)}</th>
            ))}
            <th className="px-4 py-3 border border-slate-600 text-center font-bold text-white bg-slate-700">SAV</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, idx) => (
            <tr key={idx} className="hover:bg-slate-800/50">
              <td className="px-4 py-2 border border-slate-600 font-medium text-slate-200">
                  {row.signNum}. {row.sign}
              </td>
              {planetColumns.map(p => (
                  <td key={p} className="px-4 py-2 border border-slate-600 text-center">
                      {row[p]}
                  </td>
              ))}
              <td className={`px-4 py-2 border border-slate-600 text-center font-bold ${row.SAV >= 28 ? 'text-green-400' : row.SAV <= 25 ? 'text-red-400' : 'text-white'}`}>
                  {row.SAV}
              </td>
            </tr>
          ))}
          {/* Total Row */}
          <tr className="bg-slate-800 font-bold border-t-2 border-slate-500">
              <td className="px-4 py-3 border border-slate-600 text-amber-400">Total</td>
              {planetColumns.map(p => {
                   const total = tableData.reduce((acc, curr) => acc + (curr[p] || 0), 0);
                   return <td key={p} className="px-4 py-3 border border-slate-600 text-center text-amber-400">{total}</td>
              })}
              <td className="px-4 py-3 border border-slate-600 text-center text-amber-400 text-lg">
                   {tableData.reduce((acc, curr) => acc + (curr.SAV || 0), 0)}
              </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default AshtakvargaTable;