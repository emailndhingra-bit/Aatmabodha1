
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Mic, MicOff, PhoneOff, Radio, Volume2, Sparkles, AlertTriangle } from 'lucide-react';
import { generateVirtualFileContext } from '../services/geminiService';
import { ORACLE_RULES } from '../services/oracleRules';

interface Props {
  onClose: () => void;
  db: any;
}

const LiveVoiceModal: React.FC<Props> = ({ onClose, db }) => {
  const [status, setStatus] = useState<'initializing' | 'connected' | 'error' | 'permission_denied' | 'disconnected'>('initializing');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // Model is speaking
  const [isListening, setIsListening] = useState(false); // User is speaking
  
  // Refs for Audio Contexts and Workers
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Gemini Session
  const sessionRef = useRef<any>(null);

  // --- AUDIO HELPERS ---
  const encode = (bytes: Uint8Array) => {
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
  };

  const decode = (base64: string) => {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
  };

  const createBlob = (data: Float32Array): Blob => {
      const l = data.length;
      const int16 = new Int16Array(l);
      for (let i = 0; i < l; i++) {
          int16[i] = data[i] * 32768;
      }
      return {
          data: encode(new Uint8Array(int16.buffer)),
          mimeType: 'audio/pcm;rate=16000',
      };
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
      const dataInt16 = new Int16Array(data.buffer);
      const frameCount = dataInt16.length / numChannels;
      const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

      for (let channel = 0; channel < numChannels; channel++) {
          const channelData = buffer.getChannelData(channel);
          for (let i = 0; i < frameCount; i++) {
              channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
          }
      }
      return buffer;
  };

  useEffect(() => {
    let mounted = true;

    const startSession = async () => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const chartContext = generateVirtualFileContext(db, true);
            
            // Audio Context Setup
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            // Request Permission Explicitly
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const inputNode = audioContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = scriptProcessor;

            // Connect Session
            const sessionPromise = ai.live.connect({
                model: 'gemini-3.1-flash-live-preview',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                    },
                    systemInstruction: `${ORACLE_RULES}

**YOUR PRIME DIRECTIVES FOR AUDIO (OVERRIDING TEXT RULES):**
1. **EXTREME COMPASSION:** Speak with profound warmth, kindness, and empathy. Be a healer, not just a calculator. Your voice should feel like a safe embrace.
2. **BE CONCISE:** Do not ramble. Keep answers SHORT, direct, and conversational (2-4 sentences max per turn). Do NOT use markdown formatting, bullet points, or the <<<SUGG:...>>> protocol in audio mode.
3. **CHART SPECIFICITY (DEPTH):** You MUST reference the specific planets in the user's chart to prove you know them.
   - *Bad:* "You are going through a hard time."
   - *Good:* "I see your Moon is in Scorpio in the 8th house. This creates deep emotional turbulence, doesn't it?"
4. **REMEDIAL NATURE:** Always end with a tone of hope or a tiny, practical suggestion based on the planets.

**USER CHART CONTEXT:**
${chartContext}`
                },
                callbacks: {
                    onopen: () => {
                        if (mounted) setStatus('connected');
                        console.log("Gemini Live Connected");
                        
                        // Start Audio Stream
                        inputNode.connect(scriptProcessor);
                        scriptProcessor.connect(audioContextRef.current!.destination);
                        
                        scriptProcessor.onaudioprocess = (e) => {
                            if (isMuted) return; // Mute logic
                            
                            const inputData = e.inputBuffer.getChannelData(0);
                            
                            // Simple Voice Activity Detection (VAD) visualizer hack
                            let sum = 0;
                            for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
                            const avg = sum / inputData.length;
                            if (avg > 0.01) setIsListening(true); else setIsListening(false);

                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData) {
                            if (mounted) setIsSpeaking(true);
                            if (outputAudioContextRef.current) {
                                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                                
                                const buffer = await decodeAudioData(decode(audioData), outputAudioContextRef.current, 24000, 1);
                                const source = outputAudioContextRef.current.createBufferSource();
                                source.buffer = buffer;
                                source.connect(outputAudioContextRef.current.destination);
                                
                                source.addEventListener('ended', () => {
                                    sourcesRef.current.delete(source);
                                    if (sourcesRef.current.size === 0 && mounted) setIsSpeaking(false);
                                });
                                
                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += buffer.duration;
                                sourcesRef.current.add(source);
                            }
                        }
                        
                        // Handle interruption
                        if (msg.serverContent?.interrupted) {
                            sourcesRef.current.forEach(s => s.stop());
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                            if (mounted) setIsSpeaking(false);
                        }
                    },
                    onclose: () => {
                        console.log("Live Session Closed");
                        if (mounted) setStatus('disconnected');
                    },
                    onerror: (e: any) => {
                        console.error("Live Session Error", e);
                        if (mounted) setStatus('error');
                    }
                }
            });
            
            sessionRef.current = sessionPromise;

        } catch (e: any) {
            console.error("Setup Failed", e);
            if (mounted) {
                if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError' || e.message?.toLowerCase().includes('permission')) {
                    setStatus('permission_denied');
                } else {
                    setStatus('error');
                }
            }
        }
    };

    startSession();

    return () => {
        mounted = false;
        // Cleanup
        if (processorRef.current) processorRef.current.disconnect();
        if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
        if (audioContextRef.current) audioContextRef.current.close();
        if (outputAudioContextRef.current) outputAudioContextRef.current.close();
        
        sessionRef.current?.then((s:any) => s.close());
    };
  }, []); // Run once on mount

  const toggleMute = () => setIsMuted(!isMuted);

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0c15]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] transition-all duration-1000 ${isSpeaking ? 'scale-150 bg-amber-500/20' : 'scale-100'}`}></div>
        </div>

        {/* Header */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
            <div className="flex items-center gap-3">
                <Radio className={`w-5 h-5 ${status === 'connected' ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <span className={`text-sm font-bold uppercase tracking-widest ${status === 'error' || status === 'permission_denied' ? 'text-rose-400' : 'text-slate-300'}`}>
                    {status === 'initializing' && 'Aligning Frequency...'}
                    {status === 'connected' && 'Cosmic Link Active'}
                    {status === 'error' && 'Connection Failed'}
                    {status === 'permission_denied' && 'Microphone Denied'}
                    {status === 'disconnected' && 'Link Severed'}
                </span>
            </div>
            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-rose-900/50 rounded-full text-slate-300 hover:text-white transition-colors border border-white/10">
                <PhoneOff className="w-5 h-5" />
            </button>
        </div>

        {/* Main Visualizer */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-lg">
            
            {/* The Orb */}
            <div className="relative w-48 h-48 sm:w-64 sm:h-64 mb-12">
                {/* Core */}
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-indigo-900 to-black border-4 transition-all duration-300 flex items-center justify-center overflow-hidden
                    ${isSpeaking ? 'border-amber-400/50 shadow-[0_0_50px_rgba(245,158,11,0.4)]' : 
                      status === 'error' || status === 'permission_denied' ? 'border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.3)]' :
                      'border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]'}
                `}>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-50"></div>
                    {isSpeaking && <Sparkles className="w-12 h-12 text-amber-200 animate-spin-slow opacity-50" />}
                    {(status === 'error' || status === 'permission_denied') && <AlertTriangle className="w-16 h-16 text-rose-500 opacity-80" />}
                </div>

                {/* Pulsating Rings (Speaking) */}
                {isSpeaking && (
                    <>
                        <div className="absolute inset-0 rounded-full border border-amber-500/30 animate-ping opacity-20"></div>
                        <div className="absolute -inset-4 rounded-full border border-amber-500/20 animate-pulse opacity-20 delay-75"></div>
                    </>
                )}

                {/* Pulsating Rings (Listening) */}
                {isListening && !isSpeaking && (
                    <>
                        <div className="absolute -inset-8 rounded-full border-2 border-emerald-500/30 animate-ping opacity-10 duration-[2000ms]"></div>
                        <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse"></div>
                    </>
                )}
            </div>

            {/* Status Text */}
            <div className="h-16 mb-8 text-center px-4">
                {status === 'permission_denied' ? (
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-rose-300 font-serif text-lg tracking-wide">Permission Denied</p>
                        <p className="text-slate-400 text-xs">Please allow microphone access in your browser settings to speak with Aatmabodha.</p>
                    </div>
                ) : status === 'error' ? (
                    <p className="text-rose-300 font-serif text-lg tracking-wide">Connection Error. Please retry.</p>
                ) : isSpeaking ? (
                    <p className="text-amber-200 font-serif text-lg tracking-wide animate-pulse">Aatmabodha is speaking...</p>
                ) : isListening ? (
                    <p className="text-emerald-300 font-serif text-lg tracking-wide animate-pulse">Listening to you...</p>
                ) : (
                    <p className="text-indigo-300/50 text-sm uppercase tracking-widest">Channel Open</p>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6">
                <button 
                    onClick={toggleMute}
                    disabled={status !== 'connected'}
                    className={`p-6 rounded-full border-2 transition-all duration-300 shadow-2xl ${
                        status !== 'connected' ? 'bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed' :
                        isMuted 
                        ? 'bg-rose-950/50 border-rose-500 text-rose-400 hover:bg-rose-900' 
                        : 'bg-indigo-950/50 border-indigo-500 text-white hover:bg-indigo-900 hover:border-amber-400'
                    }`}
                >
                    {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>
            </div>
            
            <p className="mt-6 text-xs text-slate-500 font-mono">
                {status === 'connected' ? (isMuted ? "Microphone Muted" : "Tap to Mute") : "Waiting for connection..."}
            </p>

        </div>
    </div>
  );
};

export default LiveVoiceModal;
