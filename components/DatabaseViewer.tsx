
// ... existing imports ...
import React, { useState, useEffect, useRef } from 'react';
import { Table, X, Database, Upload, BookOpen, Layers, Loader2, RefreshCw, Hand, Sparkles, Calendar } from 'lucide-react';
import { processFileContent, processZipFile } from '../services/fileProcessor';
import { recalculateAstrologyData } from '../services/geminiService';
import { AnalysisResult } from '../types';

interface Props {
  db: any; // SQL.js Database object
  onClose: () => void;
  cultureMode: 'EN' | 'JP' | 'HI';
}

const DatabaseViewer: React.FC<Props> = ({ db, onClose, cultureMode }) => {
  const [tables, setTables] = useState<string[]>([]);
  const [activeTable, setActiveTable] = useState<string>('');
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTables = () => {
    if (db) {
      const result = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
      if (result[0] && result[0].values) {
        const tableList = result[0].values.map((v: any[]) => v[0]);
        setTables(tableList);
        if (tableList.length > 0 && !activeTable) {
            setActiveTable(tableList[0]);
        }
      }
    }
  };

  const fetchTableData = () => {
    if (db && activeTable) {
      const result = db.exec(`SELECT * FROM ${activeTable}`);
      if (result[0]) {
        setColumns(result[0].columns);
        setRows(result[0].values);
      } else {
        setColumns([]);
        setRows([]);
      }
    }
  };

  useEffect(() => {
    fetchTables();
  }, [db]);

  useEffect(() => {
    fetchTableData();
  }, [db, activeTable]);

  if (!db) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f0c29] border border-amber-500/20 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="flex flex-col gap-4 p-4 border-b border-indigo-900/50 bg-[#120f26]">
           <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-indigo-900/30 rounded-lg">
                    <Database className="w-5 h-5 text-amber-400" />
                 </div>
                 <div>
                    <h2 className="text-lg font-serif font-bold text-amber-50">Cosmic Database Inspector</h2>
                    <p className="text-xs text-indigo-400">In-Memory SQLite Instance</p>
                 </div>
               </div>
               <button 
                 onClick={onClose}
                 className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
               >
                 <X className="w-5 h-5" />
               </button>
           </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar (Tables) */}
            <div className="w-64 border-r border-indigo-900/50 bg-[#120f26]/50 overflow-y-auto p-3 space-y-1">
                <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3 px-2 mt-2">Tables</div>
                {tables.map(t => (
                    <button
                        key={t}
                        onClick={() => setActiveTable(t)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                            activeTable === t 
                            ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg' 
                            : 'text-indigo-200 hover:bg-white/5'
                        }`}
                    >
                        <span>{t}</span>
                        {t === 'knowledge_base' && <BookOpen className="w-3 h-3 opacity-70" />}
                        {t === 'current_transits' && <Calendar className="w-3 h-3 opacity-70" />}
                        {t === 'palm_analysis' && <Hand className="w-3 h-3 opacity-70" />}
                    </button>
                ))}
            </div>

            {/* Data View */}
            <div className="flex-1 overflow-auto bg-[#0B0c15] p-0 custom-scrollbar">
                {rows.length > 0 ? (
                    <table className="w-full text-xs text-left text-indigo-200 border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr>
                                {columns.map((col, i) => (
                                    <th key={i} className="bg-[#1a1638] px-4 py-3 font-bold text-amber-100 border-b border-r border-indigo-900/50 last:border-r-0 whitespace-nowrap shadow-sm">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-white/5 border-b border-indigo-900/30 transition-colors">
                                    {row.map((cell: any, cIdx: number) => {
                                        const cellStr = String(cell);
                                        const isLong = cellStr.length > 200;
                                        return (
                                            <td key={cIdx} className="px-4 py-2 border-r border-indigo-900/30 last:border-r-0 max-w-[400px] align-top relative group" title={cellStr}>
                                                <div className={isLong ? "line-clamp-3" : ""}>
                                                    {cell === null ? <span className="text-slate-600 italic">null</span> : cellStr}
                                                </div>
                                                {isLong && <span className="text-[9px] text-indigo-500 italic block mt-1">(Truncated)</span>}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-indigo-500/50 gap-4">
                        {activeTable === 'palm_analysis' ? (
                            <>
                                <Hand className="w-12 h-12 opacity-20" />
                                <p>Add palm details here basis the image which is uploaded</p>
                            </>
                        ) : activeTable === 'current_transits' ? (
                            <>
                                <RefreshCw className="w-12 h-12 opacity-20" />
                                <p>Recalculate to update transits and other data.</p>
                            </>
                        ) : (
                            <>
                                <Table className="w-12 h-12 opacity-20" />
                                <p>{activeTable ? "No records found" : "Select a table to view data"}</p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
        
        {/* Footer */}
        <div className="p-3 border-t border-indigo-900/50 bg-[#120f26] text-xs text-indigo-400 flex justify-between items-center px-6">
            <span>{rows.length} records found</span>
            <div className="flex gap-4">
                <span className="flex items-center gap-1"><Layers className="w-3 h-3 text-violet-400" /> Multi-File Support</span>
                <span className="font-mono text-[10px] bg-black/30 px-2 py-1 rounded border border-indigo-900/30">SQL.js v1.8.0</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseViewer;