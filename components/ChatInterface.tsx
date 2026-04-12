
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, User, Bot, Loader2, BrainCircuit, Copy, Check, X, Globe, ClipboardCopy, Image as ImageIcon, Eye, Network, Heart, Download, Wand2, Compass, ArrowRight, GitBranch, Lightbulb, Clock, TrendingUp, AlertOctagon, Fingerprint, Users, FileDown, Square, CheckSquare, Crown, Paperclip, FileText, Mic, MicOff, AlertTriangle, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateCosmicImage, generateCompactOneLiner, getExtraContext } from '../services/geminiService';
import { processFileContent, processZipFile } from '../services/fileProcessor';
import { jsPDF } from "jspdf";

interface Props {
  chatSession: any | null;
  db: any; 
  language: string | null;
  onLanguageSelect: (lang: string) => void;
  userPhoto?: string | null;
  userAge?: string;
  userGotra?: string;
  userMood?: string;
  userName?: string;
  userGender?: string;
  triggerPrompt?: string | null;
  onPromptHandled?: () => void;
  cultureMode?: 'EN' | 'JP' | 'HI';
  isJapanese?: boolean;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 image if generated
}

interface ShareState {
    isOpen: boolean;
    answer: string;
    question?: string;
}

interface QAPair {
    question: Message;
    answer: Message;
    id: number;
}

// --- COSMIC LOADING MESSAGES (GLORIFIED RISHI SCIENCE) ---
const COSMIC_LOADING_MESSAGES = [
    "Tumhara jawab aa raha hai...\nGuruji thoda time lete hain. (up to 3 min)",
    "Initiating Rishi-Level Deep Scan Protocols...",
    "Triangulating D1 (Rashi) with D9 (Navamsha) Coordinates...",
    "⚡ DETECTING BHAVA CHALIT SHIFTS (Manifestation Check)...",
    "Calculating Precise Shadbala Strengths (Planetary Voltage)...",
    "Decoding the Vimshottari Timeline for Karmic Triggers...",
    "Consulting the Bhrigu Nadi Archives for Pattern Matches...",
    "Measuring Karmic Density in the 8th House...",
    "Synthesizing Nakshatra Padas for Micro-Accuracy...",
    "Aligning your Atmakaraka with Cosmic Geometry...",
    "Verifying Neecha Bhanga & Yoga Cancellations...",
    "Applying Parashara's Light to the 12th House...",
    "Running NRFV-Ω Contextual Logic Engine...",
    "Reading the Invisible Ink of Prarabdha Karma..."
];

// --- Mermaid Component ---
const MermaidBlock: React.FC<{ chart: string }> = ({ chart }) => {
  const [svg, setSvg] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderChart = async () => {
        if (!chart || !containerRef.current) return;
        try {
            // @ts-ignore
            const mermaidModule = await import('https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.esm.min.mjs');
            const mermaid = mermaidModule.default;

            mermaid.initialize({ 
                startOnLoad: false, 
                theme: 'dark', 
                securityLevel: 'loose',
                htmlLabels: false, 
                flowchart: { htmlLabels: false },
                fontFamily: 'Cinzel, serif',
                themeVariables: {
                    primaryColor: '#d97706',
                    primaryTextColor: '#fff',
                    lineColor: '#f59e0b',
                    mainBkg: '#1e1b4b',
                }
            });

            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
            let cleanChart = (chart || "").replace(/\)\)\)\s*:::/g, ')) :::')
                                  .replace(/(\(\()(?!"|')(.*?[():].*?)(?!"|')(\)\))/g, '$1"$2"$3')
                                  .replace(/(\[)(?!"|')(.*?[():].*?)(?!"|')(\])/g, '$1"$2"$3')
                                  .replace(/(\{)(?!"|')(.*?[():].*?)(?!"|')(\})/g, '$1"$2"$3');

            const { svg } = await mermaid.render(id, cleanChart);
            setSvg(svg);
        } catch (error) {
            console.error("Mermaid Render Failed:", error);
            setSvg(`<div style="color:#ef4444; font-size:10px;">Diagram Error.</div>`);
        }
    };
    renderChart();
  }, [chart]);

  const generateImageBlob = (callback: (blob: Blob | null) => void) => {
      const svgElement = containerRef.current?.querySelector('svg');
      if (!svgElement) return;
      
      try {
          const serializer = new XMLSerializer();
          let source = serializer.serializeToString(svgElement);
          if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
              source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
          }
          const svgBlob = new Blob([source], {type: "image/svg+xml;charset=utf-8"});
          const url = URL.createObjectURL(svgBlob);
          const img = new Image();
          
          img.onload = () => {
              try {
                  const canvas = document.createElement('canvas');
                  const bbox = svgElement.getBoundingClientRect();
                  const scale = 2; 
                  canvas.width = bbox.width * scale;
                  canvas.height = bbox.height * scale;
                  const ctx = canvas.getContext('2d');
                  if(ctx) {
                      ctx.fillStyle = '#0f172a'; 
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                      
                      try {
                          canvas.toBlob((blob) => {
                              callback(blob);
                              URL.revokeObjectURL(url);
                          }, 'image/png');
                      } catch (blobError) {
                          console.error("Canvas Tainted/Security Error during export:", blobError);
                          URL.revokeObjectURL(url);
                          callback(null);
                      }
                  } else {
                      URL.revokeObjectURL(url);
                      callback(null);
                  }
              } catch (e) {
                  console.error("Image generation process failed:", e);
                  URL.revokeObjectURL(url);
                  callback(null);
              }
          };
          
          img.onerror = () => {
              URL.revokeObjectURL(url);
              callback(null);
          };

          img.src = url;
      } catch (e) { callback(null); }
  };

  const handleCopyImage = () => {
      setCopyStatus('loading');
      generateImageBlob(async (blob) => {
          if (blob) {
              try {
                  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                  setCopyStatus('success');
                  setTimeout(() => setCopyStatus('idle'), 2000);
              } catch (err) { setCopyStatus('idle'); }
          } else {
              setCopyStatus('idle');
          }
      });
  };

  const handleDownloadImage = () => {
      generateImageBlob((blob) => {
          if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `vedic-chart-${Date.now()}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
          }
      });
  };

  return (
    <div className="my-6 w-full bg-[#120f26] p-4 rounded-xl border border-amber-500/20 shadow-2xl flex flex-col items-center relative overflow-hidden group" ref={containerRef}>
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none"></div>
        {svg ? (
            <>
                <div dangerouslySetInnerHTML={{ __html: svg }} className="w-full flex justify-center overflow-x-auto mb-2 relative z-10" />
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={handleCopyImage}
                        disabled={copyStatus === 'loading'}
                        className="p-1.5 rounded-lg bg-black/50 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/30 transition-all"
                        title="Copy to Clipboard"
                    >
                        {copyStatus === 'success' ? <Check className="w-4 h-4" /> : copyStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button 
                        onClick={handleDownloadImage}
                        className="p-1.5 rounded-lg bg-black/50 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/30 transition-all"
                        title="Download Chart"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </>
        ) : (
            <div className="flex items-center gap-2 text-xs text-amber-500/50 animate-pulse py-4">
                <BrainCircuit className="w-4 h-4" /> Materializing Yantra...
            </div>
        )}
    </div>
  );
};

// --- Oracle Card (FAQ) Component ---
const OracleCard: React.FC<{ icon: any, title: string, prompt: string, displayPrompt?: string, onClick: (p: string, dp?: string) => void, subtext?: string }> = ({ icon: Icon, title, prompt, displayPrompt, onClick, subtext }) => (
    <button 
        onClick={() => onClick(prompt, displayPrompt)}
        className="group relative flex flex-col items-center justify-center p-4 h-36 bg-[#1a1638] border border-indigo-500/30 rounded-xl hover:border-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all duration-300 overflow-hidden w-full"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="w-10 h-10 rounded-full bg-[#0f0c29] border border-indigo-400/30 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:border-amber-400/50 transition-all shadow-lg">
            <Icon className="w-5 h-5 text-indigo-300 group-hover:text-amber-400" />
        </div>
        <span className="text-xs font-serif font-bold text-indigo-100 group-hover:text-amber-100 tracking-wide text-center z-10 px-2 line-clamp-2">{title}</span>
        {subtext && <span className="text-[10px] text-indigo-400 mt-1 opacity-70 font-sans">{subtext}</span>}
    </button>
);

// --- Suggestion Chip Component ---
const SuggestionChip: React.FC<{ text: string, onClick: () => void }> = ({ text, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-2 bg-[#1a1638] hover:bg-indigo-900 border border-indigo-500/30 hover:border-amber-500/50 rounded-full text-xs text-indigo-200 hover:text-white transition-all shadow-lg animate-in fade-in slide-in-from-bottom-2 whitespace-nowrap"
    >
        <GitBranch className="w-3 h-3 text-amber-400" />
        {text}
        <ArrowRight className="w-3 h-3 opacity-50" />
    </button>
);

const INDIAN_LANGUAGES = [
  { code: 'Hindi', label: 'हिंदी', desc: 'शुद्ध और विस्तृत' },
  { code: 'Hinglish', label: 'Hinglish', desc: 'Desi Style' },
  { code: 'Marathi', label: 'मराठी', desc: 'अचूक आणि स्पष्ट' },
  { code: 'Gujarati', label: 'ગુજરાતી', desc: 'વિગતવાર જ્યોતિષ' },
  { code: 'Tamil', label: 'தமிழ்', desc: 'துல்லியமான கணிப்பு' },
  { code: 'Telugu', label: 'తెలుగు', desc: 'వేద విజ్ఞానం' },
  { code: 'Kannada', label: 'ಕನ್ನಡ', desc: 'ದೈವಿಕ ಮಾರ್ಗದರ್ಶನ' },
  { code: 'Malayalam', label: 'മലയാളം', desc: 'വിധി വായന' },
  { code: 'Bengali', label: 'বাংলা', desc: 'গভীর অন্তর্দৃষ্টি' },
  { code: 'Punjabi', label: 'ਪੰਜਾਬੀ', desc: 'ਕਿਸਮਤ ਦਾ ਲੇਖਾ' },
  { code: 'Odia', label: 'ଓଡ଼ିଆ', desc: 'ଭାଗ୍ୟ ଭବିଷ୍ୟତ' },
  { code: 'Urdu', label: 'اردو', desc: 'تقدیر اور ستارے' }
];

const GLOBAL_LANGUAGES = [
  { code: 'English', label: 'English', desc: 'Professional & Direct' },
  { code: 'Spanish', label: 'Español', desc: 'Pasión y Destino' },
  { code: 'French', label: 'Français', desc: 'Élégance Cosmique' },
  { code: 'German', label: 'Deutsch', desc: 'Präzision und Tiefe' },
  { code: 'Portuguese', label: 'Português', desc: 'Espiritualidade' },
  { code: 'Russian', label: 'Русский', desc: 'Судьба и Космос' },
  { code: 'Chinese', label: '中文', desc: '阴阳与宿命' },
  { code: 'Japanese', label: '日本語', desc: '日本の文化的文脈' },
  { code: 'Korean', label: '한국어', desc: '운명と調和' },
  { code: 'Arabic', label: 'العربية', desc: 'مكتوب (Maktub)' },
  { code: 'Italian', label: 'Italiano', desc: 'Destino Stellare' },
  { code: 'Turkish', label: 'Türkçe', desc: 'Kader ve Yıldızlar' }
];

const ChatInterface: React.FC<Props> = ({ chatSession, db, language, onLanguageSelect, userPhoto, userAge, userGotra, userMood, userName, userGender, triggerPrompt, onPromptHandled, cultureMode = 'EN' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(COSMIC_LOADING_MESSAGES[0]);
  const [visualizing, setVisualizing] = useState(false);
  const [hasSentPhoto, setHasSentPhoto] = useState(false);
  const [isLangSelecting, setIsLangSelecting] = useState(false);
  
  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Customization State
  const [includeIllustrations, setIncludeIllustrations] = useState(false);
  const [responseStyle, setResponseStyle] = useState<'detailed' | 'crux'>('detailed');
  
  // New Toggle State for Visualization & God Mode
  const [isVisualizeActive, setIsVisualizeActive] = useState(false);
  const [isGodMode, setIsGodMode] = useState(true); // Default God Mode to Active

  // Attachments State
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suggestions State
  const [smartInitialSuggestions, setSmartInitialSuggestions] = useState<{icon:any, title:string, prompt:string, displayPrompt?:string, subtext:string}[]>([]);
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([]);

  // Modals
  const [shareModal, setShareModal] = useState<ShareState | null>(null);
  const [copyModal, setCopyModal] = useState<ShareState | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // PDF Selection State
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [qaPairs, setQaPairs] = useState<QAPair[]>([]);
  const [selectedQaIds, setSelectedQaIds] = useState<number[]>([]);

  // ── Memory & Token Management State ──────────────────
  const [sessionTokens, setSessionTokens] = useState(0);
  const [lastInjectedTopic, setLastInjectedTopic] = useState('');
  const [turnCount, setTurnCount] = useState(0);
  const TOKEN_WARN_THRESHOLD = 80000;
  const MAX_HISTORY_TURNS = 8;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- INITIAL GREETING LOGIC ---
  useEffect(() => {
    let initialText = "**Om Tat Sat.** I am Aatmabodha.\n\nI see your chart clearly. I do not guess; I calculate. The planets have woven a specific pattern for you, and I am here to untangle it.\n\nAsk me boldly. Whether it is your **Past Life**, your **Karmic Debts**, or your **Golden Period**—I will reveal the deterministic truth.\n\n*What do the stars compel you to ask today?*";
    if (cultureMode === 'JP') {
        initialText = "**こんばんは。** 私はアートマボーダ（Aatmabodha）です。\n\nあなたの星（ホロスコープ）がはっきりと見えます。私は推測しません、計算します。惑星はあなたのために特別なパターンを織り成しており、私はそれを解き明かすためにここにいます。\n\n**過去世**、**カルマ（業）**、または**人生の黄金期**について、何でも聞いてください。決定論的な真実をお伝えします。\n\n*今日、星々はあなたに何を問いかけるよう促していますか？*";
    } else if (cultureMode === 'HI') {
        initialText = "**नमस्कार।** मैं आत्मबोध (Aatmabodha) हूँ।\n\nमैं आपकी कुंडली को स्पष्ट रूप से देख रहा हूँ। मैं अनुमान नहीं लगाता, गणना करता हूँ। ग्रहों ने आपके लिए एक विशिष्ट जाल बुना है, और मैं उसे सुलझाने के लिए यहाँ हूँ।\n\nनिडर होकर पूछें। चाहे वह आपका **पिछले जन्म** हो, **कर्म ऋण** हो, या आपका **स्वर्ण काल (Golden Period)**—मैं आपको सत्य बताऊंगा।\n\n*आज सितारे आपसे क्या पूछना चाहते हैं?*";
    }

    // Restore saved chat history if available, otherwise show greeting
    try {
      const saved = localStorage.getItem('vedicChatHistory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 1) {
          setMessages(parsed);
          return; // Don't overwrite with greeting
        }
      }
    } catch (e) {
      console.warn('Could not restore chat history', e);
    }
    setMessages([{ role: 'model', text: initialText }]);
  }, [cultureMode]);

  // Persist messages to localStorage whenever they change (cap at 50)
  useEffect(() => {
    if (messages.length > 1) {
      try {
        const toSave = messages.slice(-50);
        localStorage.setItem('vedicChatHistory', JSON.stringify(toSave));
      } catch (e) {
        console.warn('Could not save chat history', e);
      }
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, visualizing]);

  // Loading Message Rotation Logic (always start with 3-min wait copy, then cycle)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    let idx = 0;
    if (loading) {
      setLoadingMessage(COSMIC_LOADING_MESSAGES[0]);
      interval = setInterval(() => {
        idx = (idx + 1) % COSMIC_LOADING_MESSAGES.length;
        setLoadingMessage(COSMIC_LOADING_MESSAGES[idx]);
      }, 6000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  // Extract Q&A Pairs from Messages when Modal Opens
  useEffect(() => {
      if (pdfModalOpen) {
          const pairs: QAPair[] = [];
          let currentQuestion: Message | null = null;
          
          messages.forEach((msg, idx) => {
              if (msg.role === 'user') {
                  currentQuestion = msg;
              } else if (msg.role === 'model' && currentQuestion) {
                  // Only add real questions, avoid the initial greeting if it has no user prompt
                  pairs.push({
                      id: pairs.length,
                      question: currentQuestion,
                      answer: msg
                  });
                  currentQuestion = null; // Reset for next pair
              }
          });
          
          setQaPairs(pairs);
          // Auto-select all by default
          setSelectedQaIds(pairs.map(p => p.id));
      }
  }, [pdfModalOpen, messages]);

  // --- SPEECH RECOGNITION SETUP ---
  useEffect(() => {
      // Check browser support
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = true;
          // Note: Not setting language explicitly allows browser to default to system or attempt auto-detect
          
          recognitionRef.current.onresult = (event: any) => {
              let finalTranscript = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                  if (event.results[i].isFinal) {
                      finalTranscript += event.results[i][0].transcript;
                  }
              }
              if (finalTranscript) {
                  setInput(prev => prev ? `${prev} ${finalTranscript}` : finalTranscript);
                  setIsListening(false);
              }
          };

          recognitionRef.current.onerror = (event: any) => {
              console.error("Speech Recognition Error", event.error);
              setIsListening(false);
          };

          recognitionRef.current.onend = () => {
              setIsListening(false);
          };
      }
  }, []);

  const toggleListening = () => {
      if (!recognitionRef.current) {
          alert("Speech recognition not supported in this browser.");
          return;
      }
      if (isListening) {
          recognitionRef.current.stop();
          setIsListening(false);
      } else {
          try {
              recognitionRef.current.start();
              setIsListening(true);
          } catch(e) {
              console.error(e);
          }
      }
  };

  // --- GENERATE SMART CONTEXT TILES ---
  useEffect(() => {
      if (!db || smartInitialSuggestions.length > 0) return;

      try {
          const suggestions = [];

          // 1. IMMEDIATE REMEDY
          suggestions.push({
              icon: Wand2,
              title: cultureMode === 'JP' ? "今すぐできる対策" : cultureMode === 'HI' ? "तत्काल उपाय" : "Immediate Remedy",
              prompt: cultureMode === 'JP' ? "今、私に最も役立つ対策は何ですか？" : cultureMode === 'HI' ? "अभी मुझे सबसे ज्यादा कौन सा उपाय मदद करेगा?" : "What remedy will help me most right now?",
              subtext: cultureMode === 'JP' ? "現在の修正" : cultureMode === 'HI' ? "वर्तमान सुधार" : "Current Fix"
          });

          // 2. CAREER CHANGE
          suggestions.push({
              icon: TrendingUp,
              title: cultureMode === 'JP' ? "キャリアチェンジ" : cultureMode === 'HI' ? "करियर बदलाव" : "Career Change",
              prompt: cultureMode === 'JP' ? "キャリアチェンジ — 今が適切な時期ですか？" : cultureMode === 'HI' ? "करियर बदलाव — क्या यह सही समय है?" : "Career change — is this the right time?",
              subtext: cultureMode === 'JP' ? "タイミング確認" : cultureMode === 'HI' ? "समय की जाँच" : "Timing Check"
          });

          // 3. MARRIAGE SURVIVAL
          suggestions.push({
              icon: Heart,
              title: cultureMode === 'JP' ? "結婚の存続" : cultureMode === 'HI' ? "विवाह का भविष्य" : "Marriage Survival",
              prompt: cultureMode === 'JP' ? "私の結婚生活は続きますか？" : cultureMode === 'HI' ? "क्या मेरी शादी बचेगी?" : "Will my marriage survive?",
              subtext: cultureMode === 'JP' ? "関係の監査" : cultureMode === 'HI' ? "रिश्ते की जाँच" : "Relationship Audit"
          });

          // 4. PARTNER COMPATIBILITY
          suggestions.push({
              icon: Users,
              title: cultureMode === 'JP' ? "相性確認" : cultureMode === 'HI' ? "साथी की अनुकूलता" : "Partner Compatibility",
              prompt: cultureMode === 'JP' ? "この人は私に合っていますか？" : cultureMode === 'HI' ? "क्या यह व्यक्ति मेरे लिए सही है?" : "Is this person right for me?",
              subtext: cultureMode === 'JP' ? "魂のつながり" : cultureMode === 'HI' ? "आत्मा का संबंध" : "Soul Connection"
          });

          // 5. FEELING STUCK
          suggestions.push({
              icon: AlertOctagon,
              title: cultureMode === 'JP' ? "停滞感" : cultureMode === 'HI' ? "रुकावट का एहसास" : "Feeling Stuck",
              prompt: cultureMode === 'JP' ? "なぜ私の人生は行き詰まっているように感じるのですか？" : cultureMode === 'HI' ? "मेरा जीवन रुका हुआ क्यों महसूस होता है?" : "Why does my life feel stuck?",
              subtext: cultureMode === 'JP' ? "カルマのブロック" : cultureMode === 'HI' ? "कर्म संबंधी रुकावटें" : "Karmic Blockages"
          });

          // 6. FINANCIAL GROWTH
          suggestions.push({
              icon: Crown,
              title: cultureMode === 'JP' ? "経済的成長" : cultureMode === 'HI' ? "वित्तीय विकास" : "Financial Growth",
              prompt: cultureMode === 'JP' ? "私の経済状況はいつ改善しますか？" : cultureMode === 'HI' ? "मेरी वित्तीय स्थिति में कब सुधार होगा?" : "When does my financial situation improve?",
              subtext: cultureMode === 'JP' ? "富のタイムライン" : cultureMode === 'HI' ? "धन की समयरेखा" : "Wealth Timeline"
          });

          // 7. LIFE'S PURPOSE
          suggestions.push({
              icon: Compass,
              title: cultureMode === 'JP' ? "人生の目的" : cultureMode === 'HI' ? "जीवन का उद्देश्य" : "Life's Purpose",
              prompt: cultureMode === 'JP' ? "私の人生の目的は何ですか？" : cultureMode === 'HI' ? "मेरे जीवन का उद्देश्य क्या है?" : "What is my life's purpose?",
              subtext: cultureMode === 'JP' ? "魂の使命" : cultureMode === 'HI' ? "आत्मा का मिशन" : "Soul Mission"
          });

          // 8. FAMILY PLANNING
          suggestions.push({
              icon: Clock,
              title: cultureMode === 'JP' ? "家族計画" : cultureMode === 'HI' ? "परिवार नियोजन" : "Family Planning",
              prompt: cultureMode === 'JP' ? "赤ちゃんを授かるのに最適な時期はいつですか？" : cultureMode === 'HI' ? "बच्चे के लिए सबसे अच्छा समय कब है?" : "When is the best time for a baby?",
              subtext: cultureMode === 'JP' ? "吉兆なタイミング" : cultureMode === 'HI' ? "शुभ समय" : "Auspicious Timing"
          });

          // 9. FOREIGN SETTLEMENT
          suggestions.push({
              icon: Globe,
              title: cultureMode === 'JP' ? "海外移住" : cultureMode === 'HI' ? "विदेश प्रवास" : "Foreign Settlement",
              prompt: cultureMode === 'JP' ? "海外に移住すべきですか？" : cultureMode === 'HI' ? "क्या मुझे विदेश जाना चाहिए?" : "Should I move abroad?",
              subtext: cultureMode === 'JP' ? "移住の確認" : cultureMode === 'HI' ? "स्थानांतरण की जाँच" : "Relocation Check"
          });

          // 10. TOP 10 UNIQUE TRAITS
          suggestions.push({
              icon: Fingerprint,
              title: cultureMode === 'JP' ? "トップ10のユニークな特徴" : cultureMode === 'HI' ? "शीर्ष 10 अद्वितीय गुण" : "Top 10 Unique Traits",
              prompt: cultureMode === 'JP' ? "私の中のトップ10のユニークな特徴は何ですか？（d1からd60のすべてのチャートの重要な要素、またはghatak、nbry、shadbal、chalit、逆行、ナクシャトラ、惑星のavastha、Ashtakvarga、KP、人生のYOGAS、およびデータベースからの他の多くの要素を使用してください。幻覚を見ないでください。そして、それらすべてが個別に、ユーザーが読んだ後に「すごい、どうして私のことをこんなに知っているの？これは非常にユニークで、誰とも話し合ったことがない」と言うようなものであるべきです。そして、最終的にユーザー側からあなたへの信頼を生み出すべきです。8つが良いものであれば、2つは改善の余地がある、またはあまり良くないものであるべきですが、非常に適切な方法で文書化され、動機付けられ、励まされるセラピストのトーンであるべきです。これは内部用です）" : cultureMode === 'HI' ? "मुझमें शीर्ष 10 अद्वितीय बातें क्या हैं? (d1 से d60 तक सभी चार्ट की प्रमुख बातें या घटक, nbry, shadbal, chalit, वक्री, नक्षत्र, ग्रह अवस्था, अष्टकवर्ग, KP, जीवन में योग, और डेटाबेस से कई अन्य चीजों का उपयोग करें। चीजें भ्रामक नहीं होनी चाहिए और वे सभी व्यक्तिगत रूप से कुछ ऐसा होना चाहिए जिसे पढ़ने के बाद उपयोगकर्ता कहे 'वाह, यह मेरे बारे में यह कैसे जानता है, यह बहुत ही अनोखा है और मैंने कभी किसी के साथ इस पर चर्चा नहीं की है' और अंततः यह उपयोगकर्ता की ओर से आप पर विश्वास पैदा करना चाहिए। यदि 8 अच्छे हैं तो 2 सुधार के क्षेत्र या इतने अच्छे नहीं होने चाहिए, लेकिन बहुत ही उचित तरीके से प्रलेखित और प्रेरक, उत्साहवर्धक चिकित्सक स्वर में होने चाहिए। यह केवल आपके आंतरिक उपयोग के लिए है)" : "what are top 10 unique things in me ? ( use d1 to d60 all charts key things or even from ghatak, nbry, shadbal, chalit, retrograde, nakshatra, planet avastha, Ashtakvarga, KP, YOGAS in life, and many more things from database, things should be not hallucinated and all of them individually should be something which user after reading should say WOW, how it knows this about me this is very very unique and i have never discussed this with anyone andit should fianlly create trust on you from user side if 8 are good 2 should be area of improvement or not so good ones but documented in very proper way and motivating encouraging therapist tone thats for your internal only)",
              displayPrompt: cultureMode === 'JP' ? "私の中のトップ10のユニークな特徴は何ですか？" : cultureMode === 'HI' ? "मुझमें शीर्ष 10 अद्वितीय बातें क्या हैं?" : "What are the top 10 unique things in me?",
              subtext: cultureMode === 'JP' ? "深いアイデンティティスキャン" : cultureMode === 'HI' ? "गहन पहचान स्कैन" : "Deep Identity Scan"
          });

          setSmartInitialSuggestions(suggestions);

      } catch (e) {
          console.error("Error generating smart tiles", e);
      }
  }, [db, cultureMode]);

  const handleToggleGodMode = () => {
      setIsGodMode(prev => !prev);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newFiles = Array.from(e.target.files);
          setAttachments(prev => [...prev, ...newFiles]);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Detect which topic branch a query falls into (mirrors getExtraContext logic)
  const detectTopic = (q: string): string => {
    const ql = q.toLowerCase();
    if (/shaadi|marriage|partner|love|relationship|vivah|rishta|spouse|wife|husband|patni|pati|pyaar|breakup|divorce|talaaq|girlfriend|boyfriend/.test(ql)) return 'MARRIAGE';
    if (/career|job|business|kaam|naukri|promotion|salary|office|profession|vyapar|success|safalta|interview|resign|quit|startup|entrepreneurship/.test(ql)) return 'CAREER';
    if (/car|gadi|vehicle|property|ghar|home|house|buy|kharidna|plot|land|zameen|flat|apartment|d4|4th house|sukh/.test(ql)) return 'PROPERTY';
    if (/child|baccha|progeny|pregnancy|garbh|putra|santaan|beta|beti|son|daughter|d7/.test(ql)) return 'CHILDREN';
    if (/health|bimari|sehat|doctor|hospital|sick|illness|body|dard|pain|surgery|disease|cancer|diabetes|stress|anxiety|mental/.test(ql)) return 'HEALTH';
    if (/money|paisa|dhan|wealth|income|financial|loan|debt|savings|rich|ameer|garib|investment|stocks|loss|profit|nuksaan|fayda/.test(ql)) return 'WEALTH';
    if (/kab|when|kitne saal|which year|2025|2026|2027|2028|2029|2030|future|timing|aane wala|prediction|bhavishya|turning point/.test(ql)) return 'TIMING';
    if (/spiritual|soul|atma|karma|past life|ishta|devata|moksha|dharma|god|bhagwan|meditation|dhyan|mantra|worship|pooja|temple|d20|d24/.test(ql)) return 'SPIRITUALITY';
    if (/education|padhai|study|degree|course|skill|learning|communication|writing|book|likhna|padhna|d24|mercury|budh|3rd house|handwriting/.test(ql)) return 'EDUCATION';
    if (/travel|videsh|foreign|abroad|settlement|immigration|visa|passport|bahar|jaana|d12|9th house|12th house/.test(ql)) return 'TRAVEL';
    if (/personality|nature|swabhav|character|strength|weakness|psychology|hidden|secret|unique|special|trait|behaviour|andar se|d27/.test(ql)) return 'PERSONALITY';
    if (/father|dad|papa|pita|mother|mom|maa|mata|parent|ghar wale|family|d12 parent/.test(ql)) return 'PARENTS';
    return 'GENERAL';
  };

  // Save anonymised query analytics to localStorage (no PII)
  const saveQueryAnalytics = (query: string, topic: string) => {
    try {
      const existing = JSON.parse(localStorage.getItem('vedicQueryAnalytics') || '[]');
      existing.push({
        topic,
        queryLength: query.length,
        timestamp: new Date().toISOString(),
        turnNumber: turnCount,
        sessionTokens,
      });
      // Keep last 500 analytics entries
      const trimmed = existing.slice(-500);
      localStorage.setItem('vedicQueryAnalytics', JSON.stringify(trimmed));
    } catch (e) { /* silent fail */ }
  };

  const clearChatHistory = () => {
    localStorage.removeItem('vedicChatHistory');
    setSessionTokens(0);
    setTurnCount(0);
    setLastInjectedTopic('');
    setSuggestedFollowUps([]);
  };

  const handleSend = async (manualMsg?: string, displayMsg?: string) => {
    const textToSend = manualMsg || input.trim();
    if ((!textToSend && attachments.length === 0) || !chatSession || loading) return;

    // Capture visualization intent before resetting state
    const shouldTriggerImage = isVisualizeActive || (manualMsg && /visualize|show me/i.test(manualMsg));
    const isGodModeTrigger = isGodMode;

    setInput("");
    setIsVisualizeActive(false); 
    setSuggestedFollowUps([]); 

    // Optimistically update UI
    const msgToShow: Message = { role: 'user', text: displayMsg || textToSend };
    if (attachments.length > 0) {
        msgToShow.text = `[Sent ${attachments.length} attachment(s)] ${textToSend}`;
    }
    setMessages(prev => [...prev, msgToShow]);
    setLoading(true);

    let messagePayload: (string | { text: string } | { inlineData: { mimeType: string, data: string } })[] = [];
    let steeringInstructions = "";

    if (userName) {
        steeringInstructions += ` Address the user by their name: ${userName}.`;
    }
    if (userGender && userGender !== 'Prefer not to say') {
        steeringInstructions += ` The user's gender is ${userGender}. Use appropriate pronouns and context if needed.`;
    }

    // --- FILE PROCESSING LOGIC ---
    try {
        for (const file of attachments) {
            const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(file.name);
            
            if (isImage) {
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
                    reader.readAsDataURL(file);
                });
                
                let mimeType = file.type;
                if (!mimeType) {
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    if (ext === 'png') mimeType = 'image/png';
                    else if (ext === 'webp') mimeType = 'image/webp';
                    else if (ext === 'heic') mimeType = 'image/heic';
                    else mimeType = 'image/jpeg';
                }

                messagePayload.push({
                    inlineData: {
                        mimeType: mimeType,
                        data: base64
                    }
                });
                messagePayload.push({ text: `[Context: Attached Image - ${file.name}]` });
            } 
            else if (file.name.toLowerCase().endsWith('.zip')) {
                const processed = await processZipFile(file);
                let zipText = `\n[ZIP ARCHIVE CONTENT: ${file.name}]\n`;
                processed.forEach(p => {
                    let contentStr = typeof p.content === 'string' ? p.content : JSON.stringify(p.content);
                    zipText += `\n--- FILE: ${p.filename} ---\n${contentStr}\n`;
                });
                messagePayload.push({ text: zipText });
            }
            else {
                const processed = await processFileContent(file);
                if (processed.type !== 'unknown') {
                    let contentStr = typeof processed.content === 'string' ? processed.content : JSON.stringify(processed.content);
                    messagePayload.push({ text: `\n[ATTACHED DOCUMENT: ${file.name}]\n${contentStr}\n` });
                } else {
                    messagePayload.push({ text: `\n[ATTACHED FILE: ${file.name} - Content could not be parsed, treat as binary context if applicable]\n` });
                }
            }
        }
    } catch (e) {
        console.error("File processing error", e);
        messagePayload.push({ text: "[System Error: Failed to process some attachments]" });
    }
    setAttachments([]); 

    if (userPhoto && !hasSentPhoto) {
        setHasSentPhoto(true);
        const base64Data = userPhoto.split(',')[1];
        
        const hiddenContext = `
        [EXPRESSION_CONTEXT]
        - Photo_Type: Candid/Selfie
        - Self_Reported_Baseline: ${userMood || 'Unknown'}
        - Gotra: ${userGotra || 'Unknown'}
        - Photo_Age: ${userAge || 'Unknown'}
        
        [SYSTEM: Perform NRFV-Ω V15.2 Visual & Genetic Synthesis Protocol immediately.]
        `;

        messagePayload.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
            }
        });
        messagePayload.push({ text: hiddenContext });
    }

    // --- SYSTEM INSTRUCTIONS ---
 
    if (responseStyle === 'crux' && !isGodModeTrigger) {
        steeringInstructions += " STRICT: Provide 'The Crux' only. Extremely concise. 3-4 sentences max.";
    }
    if (includeIllustrations) {
        steeringInstructions += " STRICT: Include a Mermaid.js diagram (graph TD, flowchart LR) to explain logic.";
    }
    if (shouldTriggerImage) {
        steeringInstructions += " STRICT: The user desires a visual representation. Output <<VISUALIZE: ...>> tag at the end.";
    }

    // --- SMART ORCHESTRATOR: selective chart injection ──
    const currentTopic = detectTopic(textToSend);
    const topicChanged = currentTopic !== lastInjectedTopic;
    const isFirstTurn = turnCount === 0;
    const shouldInjectChart = isFirstTurn || topicChanged;


    // Save anonymised analytics (no PII)
    saveQueryAnalytics(textToSend, currentTopic);

    let chartOneLiner = "";
    try {
      if (db && shouldInjectChart) chartOneLiner = generateCompactOneLiner(db);
    } catch(e) { console.warn("Chart data skipped", e); }

    const extraContext = (db && shouldInjectChart) ? getExtraContext(db, textToSend) : "";

    // Build the context hint for turns where we skip full injection
    const skipHint = (!shouldInjectChart && lastInjectedTopic)
  ? `[CONTEXT: Topic: ${currentTopic}. Key chart reminder:]\n${generateCompactOneLiner(db)}\n\n`
  : "";

    const finalContextBlock = chartOneLiner
      ? `[CHART_DATA]\n${chartOneLiner}${extraContext}\n[/CHART_DATA]\n\n`
      : skipHint;

    const instructionBlock = steeringInstructions ? `[SYSTEM: ${steeringInstructions}]` : "";

    const finalPromptText = `${finalContextBlock}${textToSend}\n\n${instructionBlock}`;
    // Add text prompt last
    messagePayload.push({ text: finalPromptText });

    // Update topic tracker
    if (shouldInjectChart) setLastInjectedTopic(currentTopic);

    // Trim history to last 6 exchanges (12 messages)
    const { systemInstruction } = (await import('../services/geminiService')).getSystemInstruction(db, language, cultureMode);

    
    const sendWithRetry = async (retries = 3): Promise<any> => {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          // Chat is handled by services/geminiService.ts via backend proxy.
          // Keep the same prompt text but route through the existing chat session.
          // @ts-ignore
          const rawUserText = manualMsg || input.trim();
          return await chatSession.sendMessage(finalPromptText, rawUserText);
        } catch (err: any) {
          const msg = err?.message || err?.toString() || '';
          const isRateLimit = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
          const isNetwork = msg.includes('503') || msg.includes('timeout') || msg.includes('network');
          
          if ((isRateLimit || isNetwork) && attempt < retries - 1) {
            const wait = isRateLimit ? 15000 : 3000;
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { 
                role: 'model', 
                text: isRateLimit 
                  ? `⏳ Server busy — retrying in ${wait/1000}s... (attempt ${attempt + 2}/${retries})`
                  : `🔄 Connection issue — retrying...`
              };
              return updated;
            });
            await new Promise(r => setTimeout(r, wait));
            continue;
          }
          throw err;
        }
      }
    };

    try {
      const result = await sendWithRetry();
      let responseText = result.error
        ? String(result.error)
        : (result.text || "");

      responseText = responseText.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
      
      const visualizeMatch = responseText.match(/<<VISUALIZE:\s*(.*?)>>/);
      if (visualizeMatch) {
          responseText = responseText.replace(visualizeMatch[0], '').trim();
      }

      const followUpMatch = responseText.match(/<<<SUGG:\s*(.*?)>>>/);
      if (followUpMatch) {
          try {
              const jsonStr = followUpMatch[1];
              const parsedFollowUps = JSON.parse(jsonStr);
              if (Array.isArray(parsedFollowUps)) {
                  setSuggestedFollowUps(parsedFollowUps);
              }
              responseText = responseText.replace(followUpMatch[0], '').trim();
          } catch (e) {
              console.warn("Failed to parse follow ups", e);
          }
      }
      
      const usage = result.usageMetadata;
      // @ts-ignore
      const modelUsed = chatSession.model || 'gemini-3.1-pro-preview';
      if (usage) {
          const inputTokens = usage.promptTokenCount || 0;
          const outputTokens = usage.candidatesTokenCount || 0;
          const turnTotal = inputTokens + outputTokens;
          setSessionTokens(prev => prev + turnTotal);
          setTurnCount(prev => prev + 1);
          // Show token info only in dev mode (remove the footer line in production)
          if (process.env.NODE_ENV === 'development') {
            responseText += `\n\n---\n*Model: ${modelUsed} | Input: ${inputTokens} | Output: ${outputTokens} | Session: ${sessionTokens + turnTotal}*`;
          }
          // Warn user when session is getting heavy (optional UX)
          if (sessionTokens + turnTotal > TOKEN_WARN_THRESHOLD) {
            console.warn(`[AATMABODHA] Session token budget at ${sessionTokens + turnTotal}. Consider session renewal.`);
          }
      } else {
          setTurnCount(prev => prev + 1);
      }
      
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
      setLoading(false); 
      
      if (visualizeMatch && shouldTriggerImage) {
          const imagePrompt = visualizeMatch[1];
          setVisualizing(true);
          try {
             const generatedImgUrl = await generateCosmicImage(imagePrompt, userPhoto || undefined, userAge);
             setMessages(prev => {
                 const newArr = [...prev];
                 const lastMsg = newArr[newArr.length - 1];
                 lastMsg.image = generatedImgUrl;
                 return newArr;
             });
          } catch (e) {
             console.error("Visual generation failed", e);
          } finally {
             setVisualizing(false);
          }
      }

    } catch (error: any) {
      console.error("Chat Error:", error);
      const errMsg = error?.message || error?.toString() || '';
      const isRateLimit = errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED');
      
      const userFriendlyMsg = isRateLimit
        ? "⏳ Too many requests right now. Please wait 30 seconds and ask again — your chart session is still active."
        : "⚠️ Connection interrupted. Your chart is safe — please ask your question again.";
      
      setMessages(prev => [...prev, { role: 'model', text: userFriendlyMsg }]);
      setLoading(false);
    }
  };

  // Trigger prompt listener
  useEffect(() => {
      if (triggerPrompt && !loading) {
          handleSend(triggerPrompt);
          if (onPromptHandled) onPromptHandled();
      }
  }, [triggerPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const togglePdfItem = (id: number) => {
      if (selectedQaIds.includes(id)) {
          setSelectedQaIds(selectedQaIds.filter(i => i !== id));
      } else {
          setSelectedQaIds([...selectedQaIds, id]);
      }
  };

  const toggleAllPdfItems = () => {
      if (selectedQaIds.length === qaPairs.length) {
          setSelectedQaIds([]);
      } else {
          setSelectedQaIds(qaPairs.map(p => p.id));
      }
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    const maxLineWidth = pageWidth - (margin * 2);
    let y = 20;

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(245, 158, 11);
    doc.text("Aatmabodha - Cosmic Session Log", margin, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, y);
    y += 15;

    const messagesToPrint: Message[] = [];
    
    qaPairs.forEach(pair => {
        if (selectedQaIds.includes(pair.id)) {
            messagesToPrint.push(pair.question);
            messagesToPrint.push(pair.answer);
        }
    });

    if (messagesToPrint.length === 0) {
        alert("Please select at least one question to download.");
        return;
    }

    messagesToPrint.forEach((msg, i) => {
        if (!msg.text) return;

        if (y > doc.internal.pageSize.height - 30) {
            doc.addPage();
            y = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        if (msg.role === 'user') {
            doc.setTextColor(79, 70, 229); 
            doc.text("You:", margin, y);
        } else {
            doc.setTextColor(217, 119, 6); 
            doc.text("Aatmabodha:", margin, y);
        }
        y += 7;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0);
        
        let cleanText = (msg.text || "")
            .replace(/\*\*(.*?)\*\*/g, '$1') 
            .replace(/\*(.*?)\*/g, '$1') 
            .replace(/#{1,6}\s/g, '') 
            .replace(/`{3}[\s\S]*?`{3}/g, '[Code/Chart Block]') 
            .replace(/`(.+?)`/g, '$1') 
            .replace(/\[(.*?)\]\(.*?\)/g, '$1') 
            .replace(/<<<SUGG:\s*.*?>>>/g, '') 
            .replace(/<<VISUALIZE:.*?>>/g, ''); 

        const lines = doc.splitTextToSize(cleanText, maxLineWidth);
        
        if (y + (lines.length * 5) > doc.internal.pageSize.height - 15) {
            doc.addPage();
            y = 20;
        }

        doc.text(lines, margin, y);
        y += (lines.length * 5) + 10;
    });

    doc.save(`Aatmabodha_Session_${new Date().toISOString().slice(0,10)}.pdf`);
    setPdfModalOpen(false);
  };

  const openCopyModal = (answer: string, question?: string) => { setCopyModal({ isOpen: true, answer, question }); setCopySuccess(false); };
  
  const handleDetailedCopy = async () => {
     if(!copyModal) return;
     const text = copyModal.answer;
     await navigator.clipboard.writeText(text);
     setCopySuccess(true);
     setTimeout(() => { setCopySuccess(false); setCopyModal(null); }, 1500);
  };

  // --- LANGUAGE SELECT ---
  if (!chatSession && db) {
      return (
        <div className="flex flex-col h-[80vh] relative overflow-hidden rounded-xl shadow-2xl border border-amber-900/30 bg-[#0B0c15] items-center justify-center p-6">
             <div className="z-10 bg-[#120f26]/90 backdrop-blur-md p-8 rounded-2xl border border-amber-500/20 max-w-5xl w-full shadow-2xl text-center relative overflow-y-auto max-h-[75vh] custom-scrollbar">
                 
                 {isLangSelecting && (
                     <div className="absolute inset-0 bg-[#120f26]/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl animate-in fade-in duration-300">
                         <div className="relative">
                             <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 animate-pulse"></div>
                             <Sparkles className="w-12 h-12 text-amber-400 animate-spin-slow" />
                         </div>
                         <h3 className="mt-6 text-lg font-serif font-bold text-amber-100">Awakening the Oracle...</h3>
                         <p className="text-xs text-indigo-300 mt-2">Preparing your cosmic session</p>
                     </div>
                 )}

                 <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                     <Globe className="w-8 h-8 text-white" />
                 </div>
                 <h2 className="text-2xl font-serif font-bold text-amber-50 mb-2">Select Language</h2>
                 <p className="text-indigo-200/60 mb-6 text-sm">Choose your preferred tongue for the divine consultation.</p>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                     {/* Indian Languages */}
                     <div>
                         <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-4 border-b border-amber-500/20 pb-2">Indian Languages</h3>
                         <div className="grid grid-cols-2 gap-3">
                             {INDIAN_LANGUAGES.map(lang => (
                                 <button
                                    key={lang.code}
                                    onClick={() => {
                                        setIsLangSelecting(true);
                                        onLanguageSelect(lang.code);
                                    }}
                                    disabled={isLangSelecting}
                                    className="p-3 rounded-xl border border-indigo-900/50 bg-[#1a1638] hover:bg-amber-700/80 hover:border-amber-500/50 transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed flex flex-col h-full"
                                 >
                                     <div className="font-bold text-sm text-indigo-100 group-hover:text-white">{lang.label}</div>
                                     <div className="text-[10px] text-indigo-400 group-hover:text-amber-100 mt-auto pt-1">{lang.desc}</div>
                                 </button>
                             ))}
                         </div>
                     </div>

                     {/* Global Languages */}
                     <div>
                         <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-4 border-b border-cyan-500/20 pb-2">Global Languages</h3>
                         <div className="grid grid-cols-2 gap-3">
                             {GLOBAL_LANGUAGES.map(lang => (
                                 <button
                                    key={lang.code}
                                    onClick={() => {
                                        setIsLangSelecting(true);
                                        onLanguageSelect(lang.code);
                                    }}
                                    disabled={isLangSelecting}
                                    className="p-3 rounded-xl border border-indigo-900/50 bg-[#1a1638] hover:bg-cyan-700/80 hover:border-cyan-500/50 transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed flex flex-col h-full"
                                 >
                                     <div className="font-bold text-sm text-indigo-100 group-hover:text-white">{lang.label}</div>
                                     <div className="text-[10px] text-indigo-400 group-hover:text-cyan-100 mt-auto pt-1">{lang.desc}</div>
                                 </button>
                             ))}
                         </div>
                     </div>
                 </div>
             </div>
        </div>
      );
  }

  const getPlaceholder = () => {
      if (isListening) return cultureMode === 'HI' ? "सुन रहा हूँ..." : "Listening...";
      if (isGodMode) return cultureMode === 'JP' ? "ゴッドモード... (深い質問を)" : cultureMode === 'HI' ? "गॉड मोड... (गहरा प्रश्न पूछें)" : "ENTERING GOD MODE... (Ask your deep question)";
      return cultureMode === 'JP' ? "アートマボーダに尋ねる..." : cultureMode === 'HI' ? "आत्मबोध से पूछें..." : `Ask Aatmabodha (${language || 'English'})...`;
  };

  return (
    <div className="flex flex-col h-[80vh] relative overflow-hidden rounded-xl shadow-2xl border border-amber-900/30 bg-[#0B0c15]">
      
      {/* Background Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-indigo-900/10 to-transparent"></div>
      </div>

      {/* Header */}
      <div className="relative z-20 bg-[#120f26] border-b border-amber-900/20 p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
            <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-900 to-slate-900 border border-amber-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <Bot className="w-6 h-6 text-amber-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#120f26] rounded-full animate-pulse"></div>
            </div>
            <div>
                <h2 className="text-amber-50 font-serif font-bold text-base flex items-center gap-2">
                    {cultureMode === 'JP' ? "アートマボーダ" : cultureMode === 'HI' ? "आत्मबोध" : "Aatmabodha"}
                    <span className="text-[9px] bg-amber-900/40 text-amber-200 px-1.5 py-0.5 rounded border border-amber-500/30 tracking-widest uppercase font-sans">
                        {cultureMode === 'JP' ? "神託モード" : cultureMode === 'HI' ? "ओरेकल मोड" : "Oracle Mode"}
                    </span>
                </h2>
                <p className="text-indigo-300/60 text-xs font-medium font-sans">
                    {language || (cultureMode === 'JP' ? "Japanese" : cultureMode === 'HI' ? "Hindi" : "Hinglish")} • Powered by Gemini 3.0 Pro
                </p>
            </div>
        </div>
      </div>

      {/* Settings Bar */}
      <div className="relative z-20 bg-[#0f0c29]/90 border-b border-indigo-900/30 p-2 flex items-center justify-between gap-4 backdrop-blur-md">
          
          {/* Main Controls */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
            <button 
                onClick={() => {
                    if (navigator.share) {
                        navigator.share({
                            title: 'My Cosmic Reading',
                            text: 'Check out my reading from Aatmabodha, the AI Astrologer!',
                            url: window.location.href,
                        }).catch(console.error);
                    } else {
                        alert('Sharing is not supported on this browser.');
                    }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-indigo-400/30 text-indigo-400 hover:border-amber-500/50 hover:text-amber-200 transition-all shrink-0"
                title="Share with friends"
            >
                <Share2 className="w-3.5 h-3.5" />
                <span className="text-xs font-bold font-serif tracking-wide hidden sm:inline">Share</span>
            </button>
            <button 
                onClick={() => setPdfModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-indigo-400/30 text-indigo-400 hover:border-amber-500/50 hover:text-amber-200 transition-all shrink-0"
                title="Download Chat History as PDF"
            >
                <FileDown className="w-3.5 h-3.5" />
                <span className="text-xs font-bold font-serif tracking-wide hidden sm:inline">PDF</span>
            </button>
          </div>
      </div>

      {/* Messages Area */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[#0B0c15]">
        
        {/* Empty State */}
        {messages.length === 1 && (
            <div className="max-w-3xl mx-auto mt-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center mb-6">
                    <h3 className="text-amber-200/80 font-serif uppercase tracking-[0.3em] text-xs mb-2">
                        {cultureMode === 'JP' ? "宇宙のコンテキスト" : cultureMode === 'HI' ? "कॉस्मिक संदर्भ" : "Cosmic Context"}
                    </h3>
                    <p className="text-indigo-300 text-sm">
                        {cultureMode === 'JP' ? "あなたのチャートから運命のパターンを検出しました" : cultureMode === 'HI' ? "आपकी कुंडली से भाग्य के पैटर्न का पता चला" : "Destiny patterns detected in your chart"}
                    </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {smartInitialSuggestions.map((card, idx) => (
                        <OracleCard 
                            key={idx} 
                            icon={card.icon} 
                            title={card.title} 
                            prompt={card.prompt} 
                            displayPrompt={card.displayPrompt}
                            subtext={card.subtext}
                            onClick={handleSend} 
                        />
                    ))}
                    {smartInitialSuggestions.length === 0 && (
                        <div className="col-span-full text-center text-xs text-slate-500 animate-pulse">{cultureMode === 'JP' ? "データベースから提案を検索中..." : cultureMode === 'HI' ? "सुझाव खोजे जा रहे हैं..." : "Scanning database for smart suggestions..."}</div>
                    )}
                </div>
            </div>
        )}

        {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-[#1a1638] border border-amber-500/20 flex items-center justify-center shrink-0 mt-1 shadow-lg">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
              )}
              
              <div className={`max-w-[90%] md:max-w-[85%] rounded-2xl p-5 text-sm leading-relaxed shadow-lg relative group/bubble
                ${msg.role === 'user' 
                  ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none border border-indigo-500/50' 
                  : 'bg-[#15122b] text-indigo-100 rounded-tl-none border border-amber-900/20'
                }
              `}>
                <div className="markdown-body font-sans">
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            code({node, inline, className, children, ...props}: any) {
                                const match = /language-(\w+)/.exec(className || '')
                                const isMermaid = match && match[1] === 'mermaid';
                                if (isMermaid) return <MermaidBlock chart={String(children).replace(/\n$/, '')} />;
                                return !inline && match ? (
                                    <pre className="bg-[#0f0c29] p-3 rounded-lg overflow-x-auto my-3 border border-indigo-900/50 text-indigo-200">
                                        <code className={className} {...props}>{children}</code>
                                    </pre>
                                ) : (
                                    <code className="bg-indigo-900/30 px-1.5 py-0.5 rounded text-amber-200 font-mono text-xs border border-indigo-500/20" {...props}>{children}</code>
                                )
                            },
                            table({children}) {
                                return <div className="overflow-hidden my-6 rounded-xl border border-indigo-900/50 shadow-lg bg-[#0f0c29]/50"><table className="min-w-full text-sm text-left text-indigo-200/80">{children}</table></div>;
                            },
                            thead({children}) { return <thead className="bg-[#1a1638] text-xs uppercase text-amber-400 font-bold tracking-wider border-b border-indigo-900">{children}</thead> },
                            tbody({children}) { return <tbody className="divide-y divide-indigo-900/30">{children}</tbody> },
                            tr({children}) { return <tr className="group hover:bg-white/5 transition-colors">{children}</tr> },
                            td({children}) { return <td className="px-4 py-3 align-top leading-relaxed first:font-semibold first:text-indigo-300">{children}</td> },
                            strong({children}) { return <strong className="font-bold text-yellow-400">{children}</strong> }
                        }}
                    >
                        {msg.text}
                    </ReactMarkdown>
                </div>
                
                {/* GENERATED IMAGE */}
                {msg.image && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)] relative group/image">
                        <img src={msg.image} alt="Cosmic Visualization" className="w-full h-auto object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity flex items-end justify-center p-4">
                            <button onClick={() => {
                                const a = document.createElement('a');
                                a.href = msg.image!;
                                a.download = 'vedic-rishi-vision.png';
                                a.click();
                            }} className="text-xs text-white bg-black/50 px-3 py-1.5 rounded-full border border-white/20 hover:bg-amber-600 hover:border-amber-500 transition-colors flex items-center gap-2">
                                <ImageIcon className="w-3 h-3" /> Save Vision
                            </button>
                        </div>
                    </div>
                )}

                {msg.role === 'model' && (
                  <div className="mt-3 pt-3 border-t border-indigo-900/30 flex gap-2 justify-end opacity-0 group-hover/bubble:opacity-100 transition-opacity">
                    <button onClick={() => openCopyModal(msg.text)} className="p-1.5 rounded bg-[#0f0c29] hover:bg-indigo-600 text-indigo-400 hover:text-white transition-colors border border-indigo-900"><Copy className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-indigo-600 border border-indigo-400 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-indigo-600/20">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
        ))}

        {/* LOGICAL EXTENSION TILES (FOLLOW-UPS) */}
        {!loading && suggestedFollowUps.length > 0 && messages[messages.length - 1].role === 'model' && (
            <div className="flex flex-col items-center gap-3 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2 text-[10px] text-amber-500/70 uppercase tracking-widest font-bold">
                    <Lightbulb className="w-3 h-3" /> 
                    {cultureMode === 'JP' ? "論理的展開" : cultureMode === 'HI' ? "तार्किक विस्तार" : "Logical Extensions"}
                </div>
                <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
                    {suggestedFollowUps.map((q, i) => (
                        <SuggestionChip key={i} text={q} onClick={() => handleSend(q)} />
                    ))}
                </div>
            </div>
        )}

        {loading && (
          <div className="flex gap-3 justify-start animate-in fade-in duration-500">
             <div className="w-8 h-8 rounded-full bg-[#1a1638] border border-indigo-900 flex items-center justify-center shrink-0">
                <BrainCircuit className="w-4 h-4 text-cyan-400 animate-pulse" />
             </div>
             <div className="flex items-center gap-2 mb-3 text-xs font-bold text-amber-500 uppercase tracking-wider bg-[#1a1638] px-4 py-2 rounded-full border border-amber-900/30 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-serif tracking-widest whitespace-pre-line text-center">{loadingMessage}</span>
             </div>
          </div>
        )}
        
        {visualizing && (
          <div className="flex gap-3 justify-start animate-in fade-in duration-500">
             <div className="w-8 h-8 rounded-full bg-[#1a1638] border border-indigo-900 flex items-center justify-center shrink-0">
                <Eye className="w-4 h-4 text-purple-400 animate-pulse" />
             </div>
             <div className="flex items-center gap-2 mb-3 text-xs font-bold text-purple-400 uppercase tracking-wider bg-[#1a1638] px-3 py-1.5 rounded-full border border-purple-900/30">
                <Sparkles className="w-3 h-3 animate-pulse" />
                {cultureMode === 'JP' ? "ビジョンを具現化中..." : cultureMode === 'HI' ? "दृश्य प्रकट हो रहा है..." : "Manifesting Vision..."}
             </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
          <div className="bg-[#1a1638]/90 border-t border-indigo-900/30 p-2 flex gap-2 overflow-x-auto no-scrollbar relative z-20">
              {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#0B0c15] border border-indigo-500/30 rounded-lg px-2 py-1.5 text-xs text-indigo-200 shrink-0 animate-in slide-in-from-bottom-2">
                      {file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(file.name) ? <ImageIcon className="w-3 h-3 text-purple-400" /> : <FileText className="w-3 h-3 text-amber-400" />}
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button onClick={() => removeAttachment(idx)} className="hover:text-rose-400"><X className="w-3 h-3" /></button>
                  </div>
              ))}
          </div>
      )}

      {/* Input Area */}
      <div className="relative z-20 bg-[#120f26] border-t border-amber-900/20 p-3 sm:p-4 pb-4 sm:pb-5">
        <div className={`relative flex items-end gap-2 p-2 rounded-xl border transition-all shadow-inner ${isGodMode ? 'bg-[#1a1638] border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-[#0B0c15] border-indigo-900/50 focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/20'}`}>
            <input 
                type="file" 
                multiple 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="*" // Allow all file types explicitly
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="hidden p-2 text-indigo-400 hover:text-amber-200 hover:bg-white/5 rounded-lg transition-colors shrink-0 mb-0.5"
                title="Attach files (Images, PDF, DOC, ZIP)"
            >
                <Paperclip className="w-4 h-4" />
            </button>
            <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder()}
                className={`w-full bg-transparent text-sm p-1.5 max-h-32 min-h-[24px] focus:outline-none custom-scrollbar resize-none font-medium pr-20 ${isGodMode ? 'text-amber-100 placeholder:text-amber-500/50' : 'text-indigo-100 placeholder:text-indigo-700/50'}`}
                rows={1}
            />
            
            {/* Right Side Actions inside Input Bar */}
            <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
                {/* SPEECH TO TEXT BUTTON */}
                <button
                    onClick={toggleListening}
                    className={`p-1.5 rounded-lg transition-all shadow-lg shrink-0 ${isListening ? 'bg-rose-600 text-white animate-pulse' : 'text-indigo-400 hover:text-amber-200 hover:bg-white/5'}`}
                    title="Speak (Supports Multi-Language)"
                >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                    onClick={() => handleSend()}
                    disabled={(loading || (!input.trim() && attachments.length === 0))}
                    className={`p-1.5 rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${isGodMode ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-amber-600/30 hover:shadow-amber-500/50' : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-600/20'}`}
                >
                    {isGodMode ? <Crown className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                </button>
            </div>
        </div>
        <div className="text-center mt-2 flex justify-between px-2 text-[10px] text-indigo-500/60 font-bold uppercase tracking-widest">
           <span className="flex items-center gap-1">
               {isGodMode ? (
                   <>
                       <AlertTriangle className="w-3 h-3 text-amber-500" />
                       {cultureMode === 'JP' ? "⚠️ ゴッドモード: 深層分析有効" : cultureMode === 'HI' ? "⚠️ गॉड मोड: गहरा विश्लेषण सक्षम" : "GOD MODE: HIGH DEPTH ENABLED"}
                   </>
               ) : (
                   cultureMode === 'JP' ? "アストロAIプロトコル アクティブ" : cultureMode === 'HI' ? "एस्ट्रो-एआई प्रोटोकॉल सक्रिय" : "Astro-AI Protocol Active"
               )}
           </span>
           <span>{cultureMode === 'JP' ? "決定論的真実" : cultureMode === 'HI' ? "नियतिवादी सत्य" : "DETERMINISTIC TRUTH"}</span>
        </div>
      </div>
      
      {/* Copy/Share Modal (Simplified for this file) */}
      {(copyModal) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-[#1a1638] border border-amber-500/30 rounded-2xl w-full max-w-sm p-6 text-center">
                  <div className="mb-4 flex justify-center"><div className="p-3 bg-amber-500/10 rounded-full"><ClipboardCopy className="w-8 h-8 text-amber-400" /></div></div>
                  <h3 className="text-lg font-bold text-white mb-2">{copySuccess ? 'Copied to Clipboard!' : 'Copy Wisdom'}</h3>
                  <button onClick={handleDetailedCopy} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors">Copy Text</button>
                  <button onClick={() => setCopyModal(null)} className="mt-3 text-xs text-slate-400 hover:text-white">Close</button>
              </div>
          </div>
      )}

      {/* PDF Selection Modal */}
      {pdfModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-[#1a1638] border border-amber-500/30 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
                  {/* Header */}
                  <div className="p-5 border-b border-indigo-900/50 flex justify-between items-center bg-[#120f26]">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-500/10 rounded-lg">
                              <FileDown className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-white">{cultureMode === 'JP' ? "PDFとしてエクスポート" : cultureMode === 'HI' ? "PDF निर्यात करें" : "Export Session to PDF"}</h3>
                              <p className="text-xs text-indigo-300">{cultureMode === 'JP' ? "保存したい回答を選択してください。" : cultureMode === 'HI' ? "वे उत्तर चुनें जिन्हें आप सहेजना चाहते हैं।" : "Select the answers you want to save."}</p>
                          </div>
                      </div>
                      <button onClick={() => setPdfModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                          <X className="w-5 h-5" />
                      </button>
                  </div>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                      {qaPairs.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                              <p>{cultureMode === 'JP' ? "まだ質問がありません。" : cultureMode === 'HI' ? "अभी कोई प्रश्न नहीं।" : "No questions asked yet."}</p>
                          </div>
                      ) : (
                          <div className="space-y-1">
                              <button 
                                  onClick={toggleAllPdfItems}
                                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 border-b border-indigo-900/30"
                              >
                                  {selectedQaIds.length === qaPairs.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                  {selectedQaIds.length === qaPairs.length ? (cultureMode === 'JP' ? "全選択解除" : cultureMode === 'HI' ? "सभी अचयनित करें" : "Deselect All") : (cultureMode === 'JP' ? "すべて選択" : cultureMode === 'HI' ? "सभी चुनें" : "Select All")}
                              </button>

                              {qaPairs.map(pair => (
                                  <div 
                                      key={pair.id} 
                                      onClick={() => togglePdfItem(pair.id)}
                                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-all ${
                                          selectedQaIds.includes(pair.id) 
                                          ? 'bg-indigo-900/30 border-amber-500/40' 
                                          : 'hover:bg-white/5 border-transparent'
                                      }`}
                                  >
                                      <div className={`mt-1 shrink-0 ${selectedQaIds.includes(pair.id) ? 'text-amber-400' : 'text-slate-600'}`}>
                                          {selectedQaIds.includes(pair.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-white line-clamp-2 leading-relaxed">
                                              {(pair.question.text || "").replace(/\[.*?\]/, '').trim()} 
                                          </p>
                                          <p className="text-xs text-indigo-400/60 mt-1 truncate">
                                              {cultureMode === 'JP' ? "回答プレビュー" : cultureMode === 'HI' ? "उत्तर पूर्वावलोकन" : "Answer preview"}: {(pair.answer.text || "").substring(0, 60)}...
                                          </p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-indigo-900/50 bg-[#120f26] flex justify-between items-center">
                      <span className="text-xs text-slate-400">
                          {selectedQaIds.length} {cultureMode === 'JP' ? "選択済み" : cultureMode === 'HI' ? "चयनित" : "selected"}
                      </span>
                      <div className="flex gap-3">
                          <button 
                              onClick={() => setPdfModalOpen(false)}
                              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-sm font-medium transition-colors"
                          >
                              {cultureMode === 'JP' ? "キャンセル" : cultureMode === 'HI' ? "रद्द करें" : "Cancel"}
                          </button>
                          <button 
                              onClick={handleGeneratePDF}
                              disabled={selectedQaIds.length === 0}
                              className="px-6 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-sm font-bold shadow-lg shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                              {cultureMode === 'JP' ? "PDFをダウンロード" : cultureMode === 'HI' ? "PDF डाउनलोड करें" : "Download PDF"}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default ChatInterface;
