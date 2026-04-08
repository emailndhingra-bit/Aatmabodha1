import React from 'react';
import { AnalysisResult } from '../types';

interface Props {
  data: AnalysisResult;
}

const BasicDetailsDisplay: React.FC<Props> = ({ data }) => {
  const { avkahadaChakra, basicDetails, favourablePoints, ghatak } = data;

  if (!avkahadaChakra && !basicDetails && !favourablePoints && !ghatak) {
    return null;
  }

  const renderTable = (title: string, obj: any) => {
    if (!obj || Object.keys(obj).length === 0) return null;
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="bg-white/10 px-4 py-3 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <tbody>
              {Object.entries(obj).map(([key, value], idx) => {
                if (['Date_of_Birth', 'Time_of_Birth', 'Weekday', 'Day'].includes(key)) return null;
                return (
                <tr key={key} className={idx % 2 === 0 ? 'bg-white/5' : ''}>
                  <td className="px-4 py-2 font-medium text-gray-400 w-1/2 border-r border-white/5">
                    {key.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-2 w-1/2">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderTable('Avkahada Chakra', avkahadaChakra)}
        {renderTable('Basic Details', basicDetails)}
        {renderTable('Favourable Points', favourablePoints)}
        {renderTable('Ghatak (Malefics)', ghatak)}
      </div>
    </div>
  );
};

export default BasicDetailsDisplay;
