
import React from 'react';
import { Briefcase, Heart, Sparkles, Home, Zap, Clock, Star, Crown, CalendarCheck, Plane, Activity, Anchor, Fingerprint } from 'lucide-react';

interface Props {
  onAsk: (question: string) => void;
}

const CATEGORIES = [
  {
    id: 'triangulation',
    title: "The Master Scan (Triangulation)",
    icon: Fingerprint,
    color: 'from-violet-600 to-indigo-900',
    description: "Cross-verify destiny using Face, Palm, and Chart together.",
    questions: [
      "Triangulate Wealth: Chart (D2) vs Sun Line (Palm) vs Nose Shape.",
      "Conflict Check: Chart shows success, but does my Face show 'Fire'?",
      "Love Audit: Compare 7th House (Chart) with Heart Line (Palm).",
      "Stress Test: Saturn's Chart placement vs Chains on Palm lines.",
      "Leadership Verify: Mars in Chart vs Jawline & Thumb strength.",
      "Karmic Check: Ketu in Chart vs 'Fish' sign on Palm."
    ]
  },
  {
    id: 'transit',
    title: "Today's Cosmic Weather (Gochar)",
    icon: Clock,
    color: 'from-amber-600 to-orange-600',
    description: "Hour-by-hour forecast based on Moon transit.",
    questions: [
      "What is my prediction for today based on Gochar?",
      "How is the Moon transit affecting my mood today?",
      "Any auspicious timing (Muhurat) for me today?",
      "Which color should I wear today for luck?",
      "Are there any transit aspects I should watch out for?",
      "Is today good for financial transactions?"
    ]
  },
  {
    id: 'health',
    title: "Health & Vitality (Medical)",
    icon: Activity,
    color: 'from-emerald-700 to-teal-700',
    description: "Physical well-being, ailments, and energy levels.",
    questions: [
      "What does my 6th house say about my health vulnerabilities?",
      "Are there any periods of low vitality I should watch out for?",
      "Which Ayurvedic element (Dosha) dominates my body type?",
      "Remedies for chronic stress or anxiety based on Moon/Mercury?",
      "Any indicators for eye or stomach issues in my chart?",
      "Best dietary habits for my ascendant?"
    ]
  },
  {
    id: 'muhurat',
    title: "Auspicious Timing (Muhurat)",
    icon: CalendarCheck,
    color: 'from-yellow-500 to-amber-600',
    description: "Find the perfect moment for new beginnings.",
    questions: [
      "What is an auspicious date to buy a car next month?",
      "Best Muhurat for Griha Pravesh (House Warming) soon?",
      "When should I start my new business venture?",
      "Is today a good day for signing contracts?",
      "Find a date for marriage or engagement.",
      "Good days for travel in the upcoming month."
    ]
  },
  {
    id: 'travel',
    title: "Foreign Travel & Settlement",
    icon: Plane,
    color: 'from-cyan-600 to-blue-700',
    description: "Visas, relocation, and distant lands.",
    questions: [
      "Does my chart promise foreign settlement (12th House)?",
      "When is a good time to apply for a Visa?",
      "Will I be successful away from my birthplace?",
      "Short trips vs Long journeys: What suits me more?",
      "Is there a relocation indicated in my near future?",
      "Which direction is lucky for my travel?"
    ]
  },
  {
    id: 'career',
    title: "Career & Purpose",
    icon: Briefcase,
    color: 'from-blue-600 to-indigo-600',
    description: "Path to success and professional dharma.",
    questions: [
      "What is my true career path according to my 10th house?",
      "When will I see a breakthrough in my job?",
      "Business or Service: What suits me better?",
      "Am I destined for fame or authority?",
      "Does my chart support a career in Tech or Arts?",
      "How is my relationship with superiors/bosses?"
    ]
  },
  {
    id: 'jackpot',
    title: "Jackpot of Life",
    icon: Crown,
    color: 'from-purple-600 to-fuchsia-600',
    description: "Hidden wealth and sudden gains.",
    questions: [
      "Where is my hidden wealth (8th House) located?",
      "Do I have any Dhana Yogas active right now?",
      "When is my 'Golden Period' for financial gain?",
      "What is my luckiest asset to invest in?",
      "Is crypto or stock market speculation safe for me?",
      "Will I gain through inheritance or partnerships?"
    ]
  },
  {
    id: 'family',
    title: "Family & Children",
    icon: Home,
    color: 'from-rose-600 to-pink-600',
    description: "Domestic peace and lineage.",
    questions: [
      "What does my 4th house say about my home life?",
      "Predict the timeline for childbirth or children's success.",
      "How is my karmic relationship with my mother/father?",
      "Will I settle abroad or stay near my roots?",
      "Remedies for domestic peace and family harmony.",
      "Indicators for property ownership or land purchase."
    ]
  },
  {
    id: 'love',
    title: "Love & Relationships",
    icon: Heart,
    color: 'from-red-600 to-rose-700',
    description: "Soulmates and karmic bonds.",
    questions: [
      "Describe my future spouse based on my 7th house.",
      "Is my current relationship karmic or Dharmic?",
      "When will I meet my soulmate?",
      "Remedies for relationship harmony?",
      "Why do I face repeated patterns in relationships?",
      "Is there a second marriage indication in my chart?"
    ]
  },
  {
    id: 'soul',
    title: "Soul & Karma",
    icon: Star,
    color: 'from-slate-600 to-slate-800',
    description: "Spiritual journey and past life.",
    questions: [
      "What is my Atmakaraka and soul's purpose?",
      "What is my biggest karmic debt in this life?",
      "Which deity (Ishta Devata) should I worship?",
      "Visualize my aura based on my chart.",
      "Why did I incarnate in this specific family?",
      {
        label: "Tell me my top 10 unique traits.",
        prompt: "what are top 10 unique things in me ? ( use d1 to d60 all charts key things or even from ghatak, nbry, shadbal, chalit, retrograde, nakshatra, planet avastha, Ashtakvarga, KP, YOGAS in life, and many more things from database, things should be not hallucinated and all of them individually should be something which user after reading should say WOW, how it knows this about me this is very very unique and i have never discussed this with anyone andit should fianlly create trust on you from user side if 8 are good 2 should be area of improvement or not so good ones but documented in very proper way and motivating encouraging therapist tone)"
      }
    ]
  }
];

const CosmicFAQ: React.FC<Props> = ({ onAsk }) => {
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
          The Cosmic Glossary
        </h2>
        <p className="text-indigo-300/60 text-sm">Select a dimension to reveal your destiny</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map((cat) => (
          <div key={cat.id} className="group relative bg-[#1a1638] rounded-2xl border border-indigo-900/50 overflow-hidden hover:border-amber-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10">
            {/* Header */}
            <div className={`h-28 bg-gradient-to-r ${cat.color} p-6 relative overflow-hidden`}>
               <div className="absolute -right-4 -top-4 text-white/10 rotate-12">
                  <cat.icon className="w-32 h-32" />
               </div>
               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg shadow-inner">
                        <cat.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white font-serif leading-tight">{cat.title}</h3>
                 </div>
                 <p className="text-xs text-white/80 font-medium pl-1 line-clamp-2">{cat.description}</p>
               </div>
            </div>

            {/* Questions List */}
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
               {cat.questions.map((q, i) => {
                 const display = typeof q === 'string' ? q : q.label;
                 const prompt = typeof q === 'string' ? q : q.prompt;
                 return (
                 <button
                    key={i}
                    onClick={() => onAsk(prompt)}
                    className="w-full text-left p-3 rounded-xl bg-[#0f0c29]/50 hover:bg-[#0f0c29] border border-transparent hover:border-indigo-500/30 text-indigo-200 text-xs transition-all flex items-center gap-3 group/btn"
                 >
                    <span className="w-5 h-5 rounded-full bg-indigo-900/50 flex items-center justify-center text-[10px] font-bold text-indigo-400 group-hover/btn:bg-amber-600 group-hover/btn:text-white transition-colors shrink-0">
                      {i + 1}
                    </span>
                    <span className="group-hover/btn:text-white leading-relaxed">{display}</span>
                 </button>
                 );
               })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CosmicFAQ;
