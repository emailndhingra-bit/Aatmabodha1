
import React, { useState, useEffect, useRef } from 'react';
import { BookChapter } from '../types';
import { generateCosmicImage } from '../services/geminiService';
import { ChevronLeft, ChevronRight, X, Sparkles, Loader2, UserCircle, Download, BookOpen, Globe } from 'lucide-react';

interface Props {
  chapters: BookChapter[];
  onClose: () => void;
  userPhoto?: string | null;
}

const BookViewer: React.FC<Props> = ({ chapters, onClose, userPhoto }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [images, setImages] = useState<Record<number, string>>({});
  const [loadingImage, setLoadingImage] = useState(false);
  
  // Track image generation status to prevent duplicate calls
  const generatingRef = useRef<Set<number>>(new Set());

  // Keyboard Navigation
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'ArrowRight') {
              if (currentPage < chapters.length - 1) setCurrentPage(p => p + 1);
          } else if (e.key === 'ArrowLeft') {
              if (currentPage > 0) setCurrentPage(p => p - 1);
          } else if (e.key === 'Escape') {
              onClose();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, chapters.length, onClose]);

  // Generate image for current page if missing
  useEffect(() => {
    const loadPageImage = async () => {
        const chapter = chapters[currentPage];
        if (!chapter || images[currentPage] || generatingRef.current.has(currentPage)) return;

        generatingRef.current.add(currentPage);
        setLoadingImage(true);

        try {
            // Extract age from context (e.g., "Age 12")
            const ageMatch = chapter.timePeriod.match(/Age\s*(\d+)/i);
            const age = ageMatch ? ageMatch[1] : chapter.ageContext;

            const prompt = `${chapter.visualPrompt}. The character is ${chapter.ageContext} (approx ${age} years old). Cinematic, emotional, storybook illustration style.`;
            
            const img = await generateCosmicImage(prompt, userPhoto || undefined, age);
            
            if (img) {
                setImages(prev => ({ ...prev, [currentPage]: img }));
            }
        } catch (e) {
            console.error("Failed to generate book image", e);
        } finally {
            setLoadingImage(false);
            generatingRef.current.delete(currentPage);
        }
    };

    loadPageImage();
    
    // Preload next page logic could go here
  }, [currentPage, chapters, userPhoto]);

  const handleNext = () => {
      if (currentPage < chapters.length - 1) setCurrentPage(p => p + 1);
  };

  const handlePrev = () => {
      if (currentPage > 0) setCurrentPage(p => p - 1);
  };

  // --- HTML EXPORT LOGIC ---
  const handleDownloadHTML = () => {
      // Serialize current state
      const bookData = JSON.stringify({
          chapters: chapters,
          images: images
      });

      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Book of Life - Cosmic Biography</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Inter:wght@300;400&display=swap');
        body { margin: 0; padding: 0; background-color: #0B0c15; color: #fff; font-family: 'Inter', sans-serif; overflow: hidden; height: 100vh; }
        .container { display: flex; height: 100%; }
        .left-panel { flex: 1; background-color: #120f26; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .right-panel { flex: 1; padding: 4rem; display: flex; flex-direction: column; justify-content: center; position: relative; background: linear-gradient(to top, #0B0c15, rgba(11,12,21,0.9), transparent); }
        .image-display { width: 100%; height: 100%; object-fit: cover; transition: transform 20s ease; }
        .image-display:hover { transform: scale(1.05); }
        .overlay { position: absolute; inset: 0; background: linear-gradient(to right, transparent, #0B0c15); }
        h1 { font-family: 'Cinzel', serif; font-size: 3rem; color: #fef3c7; margin-bottom: 0.5rem; text-shadow: 0 0 20px rgba(245, 158, 11, 0.3); }
        .chapter-tag { color: #f59e0b; font-family: monospace; letter-spacing: 0.3em; font-size: 0.8rem; text-transform: uppercase; }
        .time-tag { display: inline-block; background: rgba(255,255,255,0.05); padding: 0.2rem 0.8rem; border-radius: 99px; border: 1px solid rgba(255,255,255,0.1); font-size: 0.8rem; color: #c7d2fe; margin-top: 1rem; }
        .divider { width: 3rem; height: 4px; background: linear-gradient(to right, #f59e0b, transparent); margin: 2rem 0; }
        p { font-family: 'Cinzel', serif; font-size: 1.25rem; line-height: 1.8; color: #cbd5e1; opacity: 0.9; }
        p::first-letter { font-size: 2.5rem; color: #f59e0b; float: left; margin-right: 0.5rem; font-weight: bold; }
        .nav-controls { margin-top: 3rem; display: flex; gap: 1rem; align-items: center; }
        button { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.8rem; border-radius: 50%; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
        button:hover { background: rgba(255,255,255,0.1); border-color: white; }
        button:disabled { opacity: 0.3; cursor: not-allowed; }
        .progress { position: absolute; bottom: 0; left: 0; height: 4px; background: #1e1b4b; width: 100%; }
        .progress-bar { height: 100%; background: linear-gradient(to right, #d97706, #f59e0b); transition: width 0.5s; }
        
        @media (max-width: 768px) {
            .container { flex-direction: column; }
            .left-panel { height: 40%; }
            .right-panel { height: 60%; padding: 2rem; }
            h1 { font-size: 2rem; }
            p { font-size: 1rem; }
        }
        .placeholder { display: flex; flex-direction: column; align-items: center; color: #475569; }
        .placeholder-icon { width: 60px; height: 60px; margin-bottom: 1rem; opacity: 0.5; border: 2px dashed #475569; border-radius: 50%; }
    </style>
</head>
<body>
    <div class="container">
        <div class="left-panel" id="visualPanel">
            <!-- Image goes here -->
        </div>
        <div class="right-panel">
            <div id="contentPanel">
                <!-- Text goes here -->
            </div>
            <div class="nav-controls">
                <button onclick="prevPage()" id="btnPrev">←</button>
                <span id="pageIndicator" style="font-family: monospace; color: #64748b; font-size: 0.8rem;">1 / 10</span>
                <button onclick="nextPage()" id="btnNext">→</button>
            </div>
        </div>
    </div>
    <div class="progress"><div class="progress-bar" id="progressBar" style="width: 0%"></div></div>

    <script>
        const data = ${bookData};
        let currentIndex = 0;

        function render() {
            const chap = data.chapters[currentIndex];
            const img = data.images[currentIndex];

            // Text
            const contentHTML = \`
                <div class="chapter-tag">CHAPTER \${chap.chapter}</div>
                <h1>\${chap.title}</h1>
                <div class="time-tag">\${chap.timePeriod}</div>
                <div class="divider"></div>
                <p>\${chap.narrative}</p>
            \`;
            document.getElementById('contentPanel').innerHTML = contentHTML;

            // Image
            const visualHTML = img 
                ? \`<img src="\${img}" class="image-display" /><div class="overlay"></div>\`
                : \`<div class="placeholder"><div class="placeholder-icon"></div><span>Visualization not generated yet</span></div>\`;
            document.getElementById('visualPanel').innerHTML = visualHTML;

            // Controls
            document.getElementById('btnPrev').disabled = currentIndex === 0;
            document.getElementById('btnNext').disabled = currentIndex === data.chapters.length - 1;
            document.getElementById('pageIndicator').innerText = \`\${currentIndex + 1} / \${data.chapters.length}\`;
            document.getElementById('progressBar').style.width = \`\${((currentIndex + 1) / data.chapters.length) * 100}%\`;
        }

        function nextPage() {
            if (currentIndex < data.chapters.length - 1) {
                currentIndex++;
                render();
            }
        }

        function prevPage() {
            if (currentIndex > 0) {
                currentIndex--;
                render();
            }
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') nextPage();
            if (e.key === 'ArrowLeft') prevPage();
        });

        render();
    </script>
</body>
</html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Book_of_Life_AstroUno.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const currentChapter = chapters[currentPage];
  const currentImage = images[currentPage];

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0c15] flex flex-col items-center justify-center animate-in fade-in duration-700 focus:outline-none" tabIndex={0}>
        
        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-amber-400" />
                <h2 className="text-xl font-serif text-amber-50 tracking-widest hidden sm:block">THE CHRONICLES</h2>
            </div>
            <div className="flex gap-4">
                <button 
                    onClick={handleDownloadHTML} 
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-100 hover:text-white transition-all border border-emerald-500/30"
                    title="Save as Interactive Web Book (HTML)"
                >
                    <Globe className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider hidden md:inline">Save Web Book</span>
                </button>
                <button 
                    onClick={onClose} 
                    className="p-2 rounded-full bg-white/5 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 transition-all border border-white/10"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* Main Content: Split Screen / Immersive */}
        <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col md:flex-row items-stretch h-full overflow-hidden relative">
            
            {/* Left/Background: Image */}
            <div className="absolute inset-0 md:relative md:w-1/2 h-full bg-[#120f26] flex items-center justify-center overflow-hidden">
                {currentImage ? (
                    <>
                        <img 
                            src={currentImage} 
                            alt={currentChapter.title} 
                            className="w-full h-full object-cover animate-in fade-in duration-1000 scale-105 hover:scale-100 transition-transform duration-[20s]" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0c15] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#0B0c15]"></div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center relative z-10">
                         {loadingImage ? (
                             <>
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 animate-pulse"></div>
                                    <Sparkles className="w-12 h-12 text-amber-400 animate-spin-slow" />
                                </div>
                                <h3 className="text-amber-100 font-serif text-lg animate-pulse">Manifesting Memory...</h3>
                                <p className="text-indigo-300/60 text-sm mt-2">Recalling {currentChapter.ageContext} years</p>
                             </>
                         ) : (
                             <div className="opacity-30">
                                 <UserCircle className="w-20 h-20 text-slate-600 mb-4" />
                                 <p className="text-slate-500">Visualizing...</p>
                             </div>
                         )}
                    </div>
                )}
            </div>

            {/* Right: Text Content */}
            <div className="relative z-10 md:w-1/2 h-full flex flex-col justify-center p-8 md:p-16 lg:p-24 bg-gradient-to-t from-[#0B0c15] via-[#0B0c15]/90 to-transparent md:bg-none">
                <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700 key={currentPage}">
                    <div className="space-y-2">
                        <span className="text-amber-500 font-mono text-xs uppercase tracking-[0.3em] pl-1">
                            Chapter {currentChapter.chapter}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-serif font-bold text-amber-50 leading-tight">
                            {currentChapter.title}
                        </h1>
                        <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-indigo-200 text-xs font-medium mt-2">
                            {currentChapter.timePeriod}
                        </div>
                    </div>

                    <div className="w-12 h-1 bg-gradient-to-r from-amber-500 to-transparent"></div>

                    <p className="text-lg md:text-xl text-slate-300 font-serif leading-relaxed opacity-90 first-letter:text-4xl first-letter:font-bold first-letter:text-amber-500 first-letter:mr-2 first-letter:float-left">
                        {currentChapter.narrative}
                    </p>

                    <div className="pt-8 flex items-center gap-6">
                        <button 
                            onClick={handlePrev} 
                            disabled={currentPage === 0}
                            className="p-3 rounded-full border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all group"
                            title="Previous Page (Left Arrow)"
                        >
                            <ChevronLeft className="w-6 h-6 text-white group-hover:-translate-x-1 transition-transform" />
                        </button>
                        
                        <span className="text-xs text-slate-500 font-mono">
                            {currentPage + 1} / {chapters.length}
                        </span>

                        <button 
                            onClick={handleNext} 
                            disabled={currentPage === chapters.length - 1}
                            className="p-3 rounded-full border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all group"
                            title="Next Page (Right Arrow)"
                        >
                            <ChevronRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

        </div>
        
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-indigo-900/30 w-full">
            <div 
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500" 
                style={{ width: `${((currentPage + 1) / chapters.length) * 100}%` }}
            ></div>
        </div>

    </div>
  );
};

export default BookViewer;
