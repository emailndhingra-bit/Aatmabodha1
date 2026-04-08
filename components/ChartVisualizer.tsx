
import React from 'react';
import { ChartData } from '../types';

interface ChartVisualizerProps {
  data: ChartData;
}

const NorthIndianChart: React.FC<ChartVisualizerProps> = ({ data }) => {
  const housePlanets: Record<number, string[]> = {};
  
  // Initialize
  for(let i=1; i<=12; i++) {
    housePlanets[i] = [];
  }

  // Populate from data with defensive checks
  (data.planets || []).forEach(p => {
    if (p.house) {
      const pName = (p.planet || '').substring(0, 2); 
      housePlanets[p.house].push(p.retrograde ? `${pName}(R)` : pName);
    }
  });

  const getSignForHouse = (houseNum: number) => {
    if (!data.ascendantSignNumber) return null;
    return (data.ascendantSignNumber + houseNum - 2) % 12 + 1;
  };

  const renderHouseContent = (houseNum: number, x: number, y: number, signX: number, signY: number) => {
    const signNum = getSignForHouse(houseNum);
    return (
      <g>
        {/* Sign Number */}
        {signNum && (
          <text x={signX} y={signY} fontSize="6" fill="#ca8a04" textAnchor="middle" opacity="0.7" className="font-bold select-none font-serif">
            {signNum}
          </text>
        )}
        
        {/* Planets */}
        <text x={x} y={y} fontSize="8" fill="#fef3c7" textAnchor="middle" className="font-semibold drop-shadow-md tracking-tighter" style={{ textShadow: '0 0 2px rgba(251, 191, 36, 0.5)' }}>
           {housePlanets[houseNum].length > 0 ? housePlanets[houseNum].join(' ') : ''}
        </text>
      </g>
    );
  };
  
  return (
    <div className="relative w-full aspect-square max-w-sm mx-auto bg-[#1e1b4b] rounded-sm p-1 shadow-2xl overflow-hidden group">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-500/30 rounded-tl-lg"></div>
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-500/30 rounded-tr-lg"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-500/30 rounded-bl-lg"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-500/30 rounded-br-lg"></div>

      <div className="absolute top-2 left-0 right-0 text-center z-10">
          <h3 className="text-amber-400 font-serif text-sm font-bold tracking-[0.2em] uppercase opacity-90">{data.name}</h3>
          <div className="text-[9px] text-indigo-300 uppercase tracking-widest mt-0.5">
            {data.ascendantSign ? `Lagna: ${data.ascendantSign}` : ''}
          </div>
      </div>
      
      <svg viewBox="0 0 200 200" className="w-full h-full text-amber-100 stroke-amber-600/40 stroke-[0.8] mt-2">
        {/* Background glow for center */}
        <circle cx="100" cy="100" r="30" fill="url(#centerGlow)" opacity="0.2" />
        <defs>
            <radialGradient id="centerGlow">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="transparent" />
            </radialGradient>
        </defs>

        {/* Outer Box */}
        <rect x="2" y="2" width="196" height="196" fill="none" strokeWidth="1.5" stroke="#92400e" opacity="0.6" />
        
        {/* Main Diagonals */}
        <line x1="0" y1="0" x2="200" y2="200" />
        <line x1="200" y1="0" x2="0" y2="200" />
        
        {/* Inner Diamond */}
        <path d="M100 0 L200 100 L100 200 L0 100 Z" fill="none" strokeWidth="1" />

        {/* Render Houses */}
        {renderHouseContent(1, 100, 48, 100, 85)}   {/* House 1: Top Diamond (Center) */}
        {renderHouseContent(2, 50, 15, 90, 15)}     {/* House 2: Top Left Triangle (Upper) */}
        {renderHouseContent(3, 15, 50, 15, 90)}     {/* House 3: Top Left Triangle (Lower) */}
        {renderHouseContent(4, 45, 100, 85, 100)}   {/* House 4: Left Diamond (Center) */}
        {renderHouseContent(5, 15, 150, 15, 110)}   {/* House 5: Bottom Left Triangle (Upper) */}
        {renderHouseContent(6, 50, 185, 90, 185)}   {/* House 6: Bottom Left Triangle (Lower) */}
        {renderHouseContent(7, 100, 152, 100, 115)} {/* House 7: Bottom Diamond (Center) */}
        {renderHouseContent(8, 150, 185, 110, 185)} {/* House 8: Bottom Right Triangle (Lower) */}
        {renderHouseContent(9, 185, 150, 185, 110)} {/* House 9: Bottom Right Triangle (Upper) */}
        {renderHouseContent(10, 155, 100, 115, 100)} {/* House 10: Right Diamond (Center) */}
        {renderHouseContent(11, 185, 50, 185, 90)}   {/* House 11: Top Right Triangle (Lower) */}
        {renderHouseContent(12, 150, 15, 110, 15)}   {/* House 12: Top Right Triangle (Upper) */}

      </svg>
    </div>
  );
};

export default NorthIndianChart;
