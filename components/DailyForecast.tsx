
import React, { useState, useEffect } from 'react';
import { generateDailyForecast } from '../services/geminiService';
import { Loader2, Calendar, MapPin, Sun, Moon, Clock, Sparkles, AlertCircle, ShieldCheck, ChevronRight, RefreshCw, Zap } from 'lucide-react';

interface Props {
  db: any;
  profileName?: string;
  language?: string;
}

const DailyForecast: React.FC<Props> = ({ db, profileName = 'Profile', language = 'EN' }) => {
  const [loading, setLoading] = useState(false); // Initial loading state false
  const [data, setData] = useState<any>(null); // Full forecast data from AI
  const [localTransits, setLocalTransits] = useState<any[]>([]); // Instant DB data
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<string>("Unknown");
  const [isForecastGenerated, setIsForecastGenerated] = useState(false);
  
  // Initialize with today's date in local time (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const getRelationToMoon = (transitSign: string, natalMoonSign: string): string => {
      if (!natalMoonSign || !transitSign) return "";
      const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
      const tIdx = SIGNS.indexOf(transitSign);
      const mIdx = SIGNS.indexOf(natalMoonSign);
      if (tIdx === -1 || mIdx === -1) return "";
      
      let diff = tIdx - mIdx + 1;
      if (diff <= 0) diff += 12;
      
      // Simple suffixes
      const suffix = (diff === 1) ? "st" : (diff === 2) ? "nd" : (diff === 3) ? "rd" : "th";
      return `${diff}${suffix} from Moon`;
  };

  useEffect(() => {
    const initLocalData = async () => {
        if (!db) return;

        // 1. INSTANT RENDER: Fetch Local Transits immediately
        try {
            const transitRes = db.exec("SELECT planet, sign FROM current_transits");
            // UPDATED QUERY: Use new schema (D1_Rashi_sign)
            const natalMoonRes = db.exec("SELECT D1_Rashi_sign FROM planets WHERE planet_name = 'Moon'");
            
            let natalMoonSign = "";
            if (natalMoonRes.length > 0 && natalMoonRes[0].values.length > 0) {
                natalMoonSign = natalMoonRes[0].values[0][0];
            }

            if (transitRes.length > 0 && transitRes[0].values) {
                const mappedTransits = transitRes[0].values.map((row: any[]) => ({
                    planet: row[0],
                    currentSign: row[1],
                    status: "Calculating...", // Placeholder
                    relationToMoon: getRelationToMoon(row[1], natalMoonSign)
                }));
                setLocalTransits(mappedTransits);
            }
        } catch(e) { console.error("Local transit fetch failed", e); }

        // 2. Check Cache (Keyed by selected date)
        const cacheKey = `vedicDaily_${selectedDate}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
            console.log("Loading Daily Forecast from Cache");
            try {
                const parsed = JSON.parse(cached);
                if (parsed && parsed.data) {
                    setData(parsed.data);
                    setLocation(parsed.location);
                    setIsForecastGenerated(true);
                    return; 
                }
            } catch (e) {
                localStorage.removeItem(cacheKey);
            }
        }
        
        // Reset state if date changes and no cache
        setData(null);
        setIsForecastGenerated(false);
    };

    initLocalData();
  }, [db, selectedDate]); 

  const handleGenerateForecast = async () => {
      setLoading(true);
      setError(null);
      
      try {
          // 3. Get Location
          let loc = "Unknown Location";
          try {
              const cachedLoc = localStorage.getItem('vedicUserLocation');
              if (cachedLoc) {
                  loc = cachedLoc;
              } else {
                  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
                  });
                  loc = `${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`;
                  localStorage.setItem('vedicUserLocation', loc);
              }
          } catch (e) {
              console.log("Geolocation fallback");
              loc = "User's Current Location (General)";
          }
          setLocation(loc);

          // 4. Format Date
          const dateObj = new Date(selectedDate);
          const dateForPrompt = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

          // 5. Generate with AI
          const result = await generateDailyForecast(db, loc, dateForPrompt, profileName, language);
          
          if (result) {
              setData(result);
              setIsForecastGenerated(true);
              // Cache the result
              localStorage.setItem(`vedicDaily_${selectedDate}`, JSON.stringify({
                  date: selectedDate,
                  location: loc,
                  data: result
              }));
          } else {
              setError("Unable to align daily stars. Try again later.");
          }

      } catch (e) {
          console.error("Forecast Error", e);
          setError("Cosmic interference. Please retry.");
      } finally {
          setLoading(false);
      }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedDate(e.target.value);
  };

  // Merge Strategy: Prefer local structure (Fastest), merge AI status when available
  const displayTransits = localTransits.length > 0 ? localTransits.map(t => {
      const aiData = data?.transits?.find((at: any) => at.planet === t.planet);
      return {
          ...t,
          status: aiData?.status || t.status,
          relationToMoon: aiData?.relationToMoon || t.relationToMoon // Use AI description if it adds details like "(Kantaka Shani)"
      };
  }) : (data?.transits || []);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 animate-in fade-in duration-700">
        
        {/* Header Card */}
        <div className="bg-gradient-to-r from-[#1e1b4b] to-[#17153B] border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="flex-1">
                    <h2 className="text-3xl font-serif font-bold text-amber-50 mb-2">Daily Cosmic Weather</h2>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-indigo-200/80">
                        {/* Date Picker */}
                        <div className="flex items-center gap-2 bg-[#0f0c29]/50 px-3 py-1.5 rounded-lg border border-indigo-500/30">
                            <Calendar className="w-4 h-4 text-amber-400" />
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={handleDateChange}
                                className="bg-transparent text-white focus:outline-none text-sm font-sans uppercase tracking-wide cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                            />
                        </div>
                        <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-amber-400" /> {location.includes(",") ? "Lat/Long Coords" : location}</div>
                    </div>
                </div>
                
                {/* Panchang Mini */}
                <div className="flex gap-3">
                    <div className="bg-[#0f0c29]/50 p-3 rounded-xl border border-indigo-500/30 backdrop-blur-md min-w-[100px]">
                        <div className="text-[10px] uppercase text-indigo-400 font-bold tracking-wider mb-1">Tithi</div>
                        <div className="text-sm font-serif text-white truncate" title={data?.panchang?.tithi}>
                            {data ? data.panchang?.tithi : (loading ? <Loader2 className="w-3 h-3 animate-spin text-slate-500" /> : "-")}
                        </div>
                    </div>
                    <div className="bg-[#0f0c29]/50 p-3 rounded-xl border border-indigo-500/30 backdrop-blur-md min-w-[100px]">
                        <div className="text-[10px] uppercase text-indigo-400 font-bold tracking-wider mb-1">Nakshatra</div>
                        <div className="text-sm font-serif text-white truncate" title={data?.panchang?.nakshatra}>
                            {data ? data.panchang?.nakshatra : (loading ? <Loader2 className="w-3 h-3 animate-spin text-slate-500" /> : "-")}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Col: Transits (Loads Instantly from DB) */}
            <div className="md:col-span-1 space-y-6">
                <div className="bg-[#1a1638] rounded-xl border border-indigo-900/50 overflow-hidden">
                    <div className="bg-indigo-950/50 p-3 border-b border-indigo-900/50 flex items-center gap-2">
                        <Sun className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Planetary State (Gochar)</span>
                    </div>
                    <div className="p-3 space-y-2">
                        {displayTransits.length > 0 ? displayTransits.map((t: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs p-2 rounded hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                <div className="flex flex-col">
                                    <span className="font-bold text-white">{t.planet}</span>
                                    <span className="text-[10px] text-slate-400">{t.currentSign}</span>
                                </div>
                                <div className="text-right">
                                    {t.status === 'Calculating...' ? (
                                        <span className="text-[9px] text-slate-500 italic">...</span>
                                    ) : (
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                            t.status === 'Favorable' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/20' : 
                                            t.status === 'Challenging' ? 'bg-rose-900/50 text-rose-400 border border-rose-500/20' : 
                                            'bg-slate-800 text-slate-300'
                                        }`}>
                                            {t.status}
                                        </span>
                                    )}
                                    <div className="text-[9px] text-indigo-300/70 mt-0.5">{t.relationToMoon}</div>
                                </div>
                            </div>
                        )) : (
                            <div className="p-4 text-center text-xs text-slate-500 italic">No Transit Data</div>
                        )}
                    </div>
                </div>

                {data && (
                    <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 rounded-xl border border-indigo-500/20 p-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-bold text-white uppercase">Today's Luck</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-black/20 p-2 rounded">
                                <span className="text-[10px] text-slate-400 block">Color</span>
                                <span className="text-sm font-bold text-white">{data.tips?.luckyColor}</span>
                            </div>
                            <div className="bg-black/20 p-2 rounded">
                                <span className="text-[10px] text-slate-400 block">Number</span>
                                <span className="text-sm font-bold text-white">{data.tips?.luckyNumber}</span>
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-indigo-200 border-t border-white/5 pt-2">
                            <span className="font-bold text-amber-400">Remedy: </span> {data.tips?.remedy}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Col: Forecast (Loads Async via Button) */}
            <div className="md:col-span-2 space-y-6">
                
                {!isForecastGenerated && !loading ? (
                    <div className="flex flex-col items-center justify-center h-64 border border-indigo-900/30 rounded-xl bg-[#1a1638]/30">
                        <div className="mb-4 relative">
                            <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 animate-pulse"></div>
                            <Sparkles className="w-12 h-12 text-amber-400 relative z-10" />
                        </div>
                        <h3 className="text-lg font-serif text-white mb-2">Detailed Cosmic Forecast</h3>
                        <p className="text-sm text-indigo-300/60 mb-6 text-center max-w-xs">
                            Generate hour-by-hour insights using real-time planetary positions tailored to your chart.
                        </p>
                        <button 
                            onClick={handleGenerateForecast}
                            className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold shadow-lg shadow-amber-900/20 transition-all transform hover:scale-105"
                        >
                            <Zap className="w-4 h-4" />
                            Reveal Forecast
                        </button>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center h-64 border border-indigo-900/30 rounded-xl bg-[#1a1638]/30 animate-pulse">
                        <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
                        <p className="text-sm text-indigo-300">Consulting the Stars...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 border border-rose-900/30 rounded-xl bg-rose-950/10">
                        <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                        <p className="text-sm text-rose-300">{error}</p>
                        <button onClick={handleGenerateForecast} className="mt-4 px-4 py-2 text-xs bg-rose-900/50 hover:bg-rose-800/50 text-white rounded">Retry</button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            {/* Morning */}
                            <div className="flex gap-4 group">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/50 group-hover:bg-amber-500 group-hover:text-black transition-colors text-amber-300">
                                        <Sun className="w-4 h-4" />
                                    </div>
                                    <div className="w-0.5 h-full bg-indigo-900/50 my-2 group-hover:bg-amber-500/30 transition-colors"></div>
                                </div>
                                <div className="pb-6 flex-1">
                                    <h4 className="text-sm font-bold text-amber-200 mb-1">Morning Energy</h4>
                                    <p className="text-sm text-slate-300 leading-relaxed bg-[#1a1638] p-3 rounded-lg border border-indigo-900 shadow-sm">
                                        {data.forecast?.morning}
                                    </p>
                                </div>
                            </div>

                            {/* Afternoon */}
                            <div className="flex gap-4 group">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/50 group-hover:bg-orange-500 group-hover:text-black transition-colors text-orange-300">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div className="w-0.5 h-full bg-indigo-900/50 my-2 group-hover:bg-orange-500/30 transition-colors"></div>
                                </div>
                                <div className="pb-6 flex-1">
                                    <h4 className="text-sm font-bold text-orange-200 mb-1">Afternoon Focus</h4>
                                    <p className="text-sm text-slate-300 leading-relaxed bg-[#1a1638] p-3 rounded-lg border border-indigo-900 shadow-sm">
                                        {data.forecast?.afternoon}
                                    </p>
                                </div>
                            </div>

                            {/* Evening */}
                            <div className="flex gap-4 group">
                                <div className="flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50 group-hover:bg-indigo-500 group-hover:text-white transition-colors text-indigo-300">
                                        <Moon className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-indigo-200 mb-1">Evening Unwind</h4>
                                    <p className="text-sm text-slate-300 leading-relaxed bg-[#1a1638] p-3 rounded-lg border border-indigo-900 shadow-sm">
                                        {data.forecast?.evening}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-emerald-300 mb-1">Protective Guidance</h4>
                                <p className="text-xs text-emerald-100/70">
                                    Based on Lahiri Ayanamsa & Chitra Paksha. Forecast considers your localized planetary positions.
                                </p>
                            </div>
                        </div>
                    </>
                )}

            </div>
        </div>
    </div>
  );
};

export default DailyForecast;
