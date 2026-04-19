import React from 'react';
import { AnalysisResult } from '../types';

interface Props {
  data: AnalysisResult;
}

const TraditionalSummary: React.FC<Props> = ({ data }) => {
  const { avkahadaChakra, basicDetails } = data;

  if (!avkahadaChakra && !basicDetails) {
    return null;
  }

  const getValue = (key: string, obj1: any, obj2: any) => {
    if (obj1 && obj1[key] !== undefined) return obj1[key];
    if (obj2 && obj2[key] !== undefined) return obj2[key];
    return "Not Available";
  };

  const getBalDasa = () => {
    for (const k of ['Bal_Dasa', 'Bal Dasa', 'Bala_Dasa', 'Dasa_Balance'] as const) {
      const v = getValue(k, avkahadaChakra, basicDetails);
      if (v !== 'Not Available') return v;
    }
    return 'Not Available';
  };

  const summaryData = [
    { label: 'Name', value: getValue('Name', basicDetails, avkahadaChakra) },
    { label: 'Paya', value: getValue('Paya', avkahadaChakra, basicDetails) },
    { label: 'Asc Lord', value: getValue('Lagna_Lord', avkahadaChakra, basicDetails) },
    { label: 'Bal. Dasa', value: getBalDasa() },
    
    { label: 'Sex', value: getValue('Gender', basicDetails, avkahadaChakra) !== "Not Available" ? getValue('Gender', basicDetails, avkahadaChakra) : getValue('Sex', basicDetails, avkahadaChakra) },
    { label: 'Ayan Type', value: getValue('Ayanamsa_Name', avkahadaChakra, basicDetails) },
    { label: 'Asc', value: getValue('Lagna', avkahadaChakra, basicDetails) },
    { label: 'Karan', value: getValue('Karan', avkahadaChakra, basicDetails) },
    
    { label: 'Ayan', value: getValue('Ayanamsa_Value', avkahadaChakra, basicDetails) },
    { label: 'Yoga', value: getValue('Yoga', avkahadaChakra, basicDetails) },
    { label: 'Star Lord', value: getValue('Nakshatra_Lord', avkahadaChakra, basicDetails) },
    
    { label: 'Place', value: getValue('Place_of_Birth', basicDetails, avkahadaChakra) },
    { label: 'Tithi', value: getValue('Tithi', avkahadaChakra, basicDetails) },
    { label: 'Star - Pada', value: `${getValue('Nakshatra', avkahadaChakra, basicDetails)} - ${getValue('Nakshatra_Pada', avkahadaChakra, basicDetails)}` },
    
    { label: 'Sunset', value: getValue('Sunset', avkahadaChakra, basicDetails) },
    { label: 'Rasi Lord', value: getValue('Rasi_Lord', avkahadaChakra, basicDetails) },
    
    { label: 'SID', value: getValue('Sidereal_Time', basicDetails, avkahadaChakra) },
    { label: 'Sunrise', value: getValue('Sunrise', avkahadaChakra, basicDetails) },
    { label: 'Rasi', value: getValue('Rasi', avkahadaChakra, basicDetails) },
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-8">
      <div className="bg-white/10 px-4 py-3 border-b border-white/10 text-center">
        <h3 className="text-xl font-bold text-white tracking-wider">Traditional</h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm text-gray-300">
          {summaryData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-1">
              <span className="font-semibold text-gray-400">{item.label}</span>
              <span className="text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TraditionalSummary;
