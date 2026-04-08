
import React, { useState, useEffect } from 'react';
import { Gem } from '../types'; 
import { generateHiddenGemsAI } from '../services/geminiService';
import { Search, Diamond, Zap, AlertTriangle, Sparkles, Feather, Lock, Key, Download, Loader2, BrainCircuit } from 'lucide-react';

interface Props {
  db: any;
  onClose: () => void;
}

const HiddenGems: React.FC<Props> = ({ db, onClose }) => {
  const [activeTab, setActiveTab] = useState<'strengths' | 'weaknesses'>('strengths');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{strengths: Gem[], weaknesses: Gem[]}>({ strengths: [], weaknesses: [] });
  const [error, setError] = useState<string | null>(null);

  // Async Generation with AI
  useEffect(() => {
    const fetchGems = async () => {
        setLoading(true);
        try {
            // Call the AI Service with Thinking Mode
            const result = await generateHiddenGemsAI(db);
            setData(result);
        } catch (e) {
            console.error(e);
            setError("Cosmic interference detected. Please try scanning again.");
        } finally {
            setLoading(false);
        }
    };

    if (db) fetchGems();
  }, [db]);

  const activeData = activeTab === 'strengths' ? data.strengths : data.weaknesses;
  
  const filteredData = activeData.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = () => {
    const generateHtml = () => {
      const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      const renderGemSection = (title: string, gems: Gem[], color: string) => `
        <div class="section-header" style="border-left-color: ${color};">
            <h2>${title}</h2>
            <p>${gems.length} Insights Detected</p>
        </div>
        <div class="grid">
            ${gems.map((gem, i) => `
                <div class="card">
                    <div class="meta">
                        <span class="tag">${gem.tag}</span>
                        <span class="index">#${i + 1}</span>
                    </div>
                    <h3>${gem.title}</h3>
                    <p class="description">${gem.description}</p>
                    <div class="remedy">
                        <strong>${gem.remedyTitle}:</strong> ${gem.remedy}
                    </div>
                </div>
            `).join('')}
        </div>
      `;

      return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Aatmabodha - Hidden Gems Report</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&family=Inter:wght@400;600&display=swap');
                
                body {
                    font-family: 'Merriweather', serif;
                    line-height: 1.6;
                    color: #1e293b;
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 40px;
                    background-color: #fff;
                }
                
                .header {
                    text-align: center;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 30px;
                    margin-bottom: 40px;
                }
                
                .header h1 {
                    font-family: 'Inter', sans-serif;
                    font-size: 32px;
                    color: #0f172a;
                    margin: 0 0 10px 0;
                    letter-spacing: -0.5px;
                }
                
                .header p {
                    color: #64748b;
                    font-style: italic;
                    margin: 0;
                }
                
                .section-header {
                    margin-top: 50px;
                    margin-bottom: 25px;
                    padding-left: 20px;
                    border-left: 6px solid #ccc;
                }
                
                .section-header h2 {
                    font-family: 'Inter', sans-serif;
                    font-size: 24px;
                    margin: 0;
                    color: #334155;
                }
                
                .section-header p {
                    margin: 5px 0 0 0;
                    font-size: 14px;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-weight: bold;
                }
                
                .grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                
                .card {
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 20px;
                    background-color: #f8fafc;
                    page-break-inside: avoid;
                }
                
                .meta {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }
                
                .tag {
                    font-family: 'Inter', sans-serif;
                    font-size: 10px;
                    text-transform: uppercase;
                    background: #e2e8f0;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    color: #475569;
                }
                
                .index {
                    font-family: 'Inter', sans-serif;
                    font-size: 10px;
                    color: #cbd5e1;
                    font-weight: bold;
                }
                
                h3 {
                    font-size: 16px;
                    margin: 0 0 10px 0;
                    color: #1e293b;
                }
                
                .description {
                    font-size: 13px;
                    color: #475569;
                    margin-bottom: 15px;
                }
                
                .remedy {
                    background: #fff;
                    padding: 10px;
                    border-radius: 4px;
                    border-left: 3px solid #fbbf24;
                    font-size: 12px;
                    font-style: italic;
                    color: #334155;
                }
                
                .footer {
                    margin-top: 60px;
                    text-align: center;
                    font-size: 12px;
                    color: #94a3b8;
                    font-family: 'Inter', sans-serif;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 20px;
                }

                @media print {
                    body { padding: 0; margin: 20px; }
                    .grid { display: block; }
                    .card { margin-bottom: 15px; border: 1px solid #ccc; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Cosmic Pattern Report</h1>
                <p>Generated via Aatmabodha • ${date}</p>
            </div>

            ${renderGemSection("Jackpot Zones (Strengths)", data.strengths, "#10b981")}
            ${renderGemSection("Shadow Truths (Weaknesses)", data.weaknesses, "#f43f5e")}

            <div class="footer">
                NRFV-Ω Protocol V14.2 • God Mode Analysis<br/>
                Generated for Personal Use
            </div>
        </body>
        </html>
      `;
    };

    const htmlContent = generateHtml();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Aatmabodha_HiddenGems_Report.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 overflow-hidden flex flex-col animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 shrink-0 shadow-2xl relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
             <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
                <Diamond className="w-6 h-6 text-white" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-white tracking-wide">Hidden Gems <span className="text-amber-400">&</span> Shadow Truths</h2>
                <p className="text-xs text-slate-400 font-medium">Deep AI Scan • NRFV-Ω Contextual Logic</p>
             </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-96 group">
             <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
             </div>
             <input 
               type="text" 
               placeholder={`Search in ${activeTab}...`}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-slate-950/50 border border-slate-700 rounded-full py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
             />
          </div>

          <div className="flex gap-2">
            <button 
                onClick={handleDownload} 
                disabled={loading || data.strengths.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download formatted report"
            >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Report</span>
            </button>
            <button 
                onClick={onClose} 
                className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
                Exit Vault
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
         {/* Background Ambience */}
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
         <div className={`absolute top-0 left-1/4 w-96 h-96 ${activeTab === 'strengths' ? 'bg-emerald-600/10' : 'bg-rose-600/10'} rounded-full blur-3xl pointer-events-none transition-colors duration-1000`}></div>

         <div className="h-full flex flex-col max-w-7xl mx-auto px-4 py-6 relative z-10">
            
            {/* Loading State */}
            {loading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse"></div>
                        <BrainCircuit className="w-16 h-16 text-cyan-400 animate-pulse relative z-10" />
                    </div>
                    <h3 className="text-xl font-bold text-white mt-8 mb-2">Analyzing Chart Context...</h3>
                    <p className="text-slate-400 text-sm animate-pulse">Applying Nitin_Rules • Deep Thinking Mode</p>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="flex flex-col items-center justify-center h-full">
                    <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
                    <p className="text-rose-300">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-slate-800 rounded-lg text-sm hover:bg-slate-700">Retry</button>
                </div>
            )}

            {!loading && !error && (
            <>
                {/* Tabs */}
                <div className="flex justify-center mb-8 shrink-0">
                <div className="bg-slate-900/80 p-1.5 rounded-full border border-slate-700 flex relative backdrop-blur-md shadow-xl">
                    {/* Sliding Pill */}
                    <div 
                        className={`absolute top-1.5 bottom-1.5 w-[140px] bg-slate-800 rounded-full transition-all duration-300 ease-out shadow-inner ${activeTab === 'strengths' ? 'left-1.5 bg-gradient-to-r from-emerald-600 to-teal-600' : 'left-[148px] bg-gradient-to-r from-rose-600 to-pink-600'}`}
                    ></div>
                    
                    <button 
                        onClick={() => setActiveTab('strengths')}
                        className={`relative w-[140px] py-2 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-colors z-10 ${activeTab === 'strengths' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Sparkles className="w-4 h-4" />
                        Jackpot Gems
                    </button>
                    <button 
                        onClick={() => setActiveTab('weaknesses')}
                        className={`relative w-[140px] py-2 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-colors z-10 ${activeTab === 'weaknesses' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Shadow Truths
                    </button>
                </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredData.map((item, idx) => (
                        <div 
                            key={item.id + idx}
                            className={`group relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                                activeTab === 'strengths' 
                                ? 'bg-slate-900/60 border-emerald-500/20 hover:border-emerald-500/50' 
                                : 'bg-slate-900/60 border-rose-500/20 hover:border-rose-500/50'
                            }`}
                        >
                            {/* Card Background Gradient */}
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${activeTab === 'strengths' ? 'from-emerald-500 to-transparent' : 'from-rose-500 to-transparent'}`}></div>

                            {/* Header */}
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-widest font-bold border ${
                                    activeTab === 'strengths' 
                                    ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' 
                                    : 'bg-rose-900/30 text-rose-400 border-rose-500/30'
                                }`}>
                                    {item.tag}
                                </span>
                                {activeTab === 'strengths' ? <Zap className="w-5 h-5 text-emerald-500/50 group-hover:text-emerald-400 transition-colors" /> : <Lock className="w-4 h-4 text-rose-500/50 group-hover:text-rose-400 transition-colors" />}
                            </div>

                            {/* Content */}
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">{item.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">{item.description}</p>

                            {/* Remedy Section */}
                            <div className={`mt-auto p-3 rounded-lg border relative overflow-hidden ${
                                activeTab === 'strengths' 
                                ? 'bg-emerald-950/20 border-emerald-500/20' 
                                : 'bg-rose-950/20 border-rose-500/20'
                            }`}>
                                <div className="flex items-center gap-2 mb-1.5">
                                    {activeTab === 'strengths' ? <Key className="w-3.5 h-3.5 text-amber-400" /> : <Feather className="w-3.5 h-3.5 text-amber-400" />}
                                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">{item.remedyTitle}</span>
                                </div>
                                <p className="text-xs text-slate-300 font-medium italic">"{item.remedy}"</p>
                            </div>

                            {/* Index Number Watermark */}
                            <div className="absolute -bottom-4 -right-2 text-[80px] font-black text-white/5 pointer-events-none select-none">
                                {idx + 1}
                            </div>
                        </div>
                    ))}
                    </div>

                    {filteredData.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                            <Search className="w-12 h-12 mb-4 opacity-20" />
                            <p>No gems found matching "{searchTerm}"</p>
                        </div>
                    )}
                </div>
            </>
            )}
         </div>
      </div>
    </div>
  );
};

export default HiddenGems;
