
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { ShadbalaData } from '../types';

interface Props {
  data: ShadbalaData[];
}

const ShadbalaChart: React.FC<Props> = ({ data }) => {
  const getBarColor = (classification: string | undefined) => {
      const cls = classification || '';
      if (cls === 'Excellent') return '#10b981'; // Emerald
      if (cls === 'Good') return '#34d399'; // Green
      if (cls === 'Normal') return '#facc15'; // Yellow
      if (cls === 'Little Weak') return '#fb923c'; // Orange
      if (cls === 'N/A') return '#64748b'; // Slate for N/A
      return '#f87171'; // Red for Needs External Improvement
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="planet" 
            type="category" 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            width={60}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: number, name: string, props: any) => {
                const cls = props.payload.classification;
                return [`${value} (${cls})`, 'Shadbala Ratio'];
            }}
          />
          <Bar dataKey="strength" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.classification)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3 text-[9px] mt-2 text-slate-400">
         <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Excellent (&gt;1.2)</span>
         <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Good (1.1-1.2)</span>
         <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span> Normal (1.0-1.1)</span>
         <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> Little Weak (0.85-1.0)</span>
         <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Needs Ext. Impr. (&lt;0.85)</span>
      </div>
    </div>
  );
};

export default ShadbalaChart;
