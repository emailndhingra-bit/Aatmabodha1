import type { AnalysisResult, DashaSystem } from '../types';

export type FAQCategory = {
  category: string;
  questions: string[];
};

function parseDMY(s: string | undefined): number | null {
  if (!s) return null;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(s).trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  const t = d.getTime();
  return Number.isNaN(t) ? null : t;
}

function activeVimshottariLord(dashas: DashaSystem[] | undefined): string {
  if (!dashas?.length) return '';
  const vim = dashas.find((d) => /vimshottari/i.test(d.systemName || ''));
  if (!vim?.periods?.length) return '';
  const now = Date.now();
  for (const p of vim.periods) {
    const start = parseDMY(p.startDate);
    const end = parseDMY(p.endDate);
    if (start != null && end != null && now >= start && now < end) {
      const parts = String(p.name || '')
        .split('-')
        .map((x) => x.trim());
      return parts[0] || '';
    }
  }
  const first = vim.periods[0];
  if (!first?.name) return '';
  return String(first.name).split('-')[0]?.trim() || '';
}

function goodPlanetsList(fp: Record<string, unknown> | undefined): string[] {
  if (!fp) return [];
  const raw = fp.Good_Planets ?? fp.good_planets ?? fp['Good Planets'];
  if (Array.isArray(raw)) return raw.map((x) => String(x)).filter(Boolean);
  if (typeof raw === 'string') return raw.split(/[,/|]/).map((s) => s.trim()).filter(Boolean);
  return [];
}

/**
 * Build personalized FAQ chips from chart summary fields (best-effort keys).
 */
export function generatePersonalizedFAQ(chartData: AnalysisResult | null): FAQCategory[] {
  const av = (chartData?.avkahadaChakra || {}) as Record<string, unknown>;
  const fp = chartData?.favourablePoints as Record<string, unknown> | undefined;

  const pick = (...keys: string[]): string => {
    for (const k of keys) {
      const v = av[k];
      if (v != null && String(v).trim()) return String(v).trim();
    }
    return '';
  };

  const moonSign = pick('Rasi', 'Moon_Rashi', 'Moon Rashi', 'Chandra_Rasi');
  const ascendant = pick('Lagna', 'Ascendant', 'Lagnam');
  const nakName = pick('Nakshatra', 'Birth_Nakshatra', 'Janma_Nakshatra');
  const paya = pick('Paya', 'Paya_Type');
  const balDasa = pick('Bal_Dasa', 'Bal Dasa', 'Bala_Dasa');
  const currentMD = activeVimshottariLord(chartData?.dashas);
  const goodPlanets = goodPlanetsList(fp);
  const goodStr = goodPlanets.length ? goodPlanets.join(' and ') : 'my favourable planets';

  return [
    {
      category: '🧠 My Personality & Soul',
      questions: [
        moonSign
          ? `My Moon is in ${moonSign} — what does this reveal about my emotional nature?`
          : `What does my Moon placement reveal about my emotional nature?`,
        ascendant
          ? `I have ${ascendant} rising — how does this shape how others see me?`
          : `How does my rising sign shape how others see me?`,
        nakName
          ? `My birth nakshatra is ${nakName} — what is my soul's core pattern?`
          : `What is my soul's core pattern from my birth nakshatra?`,
        `What is the one thing my chart says about me that most people misunderstand?`,
      ],
    },
    {
      category: '💼 Career & Purpose',
      questions: [
        currentMD
          ? `I am in ${currentMD} Mahadasha — how does this affect my career right now?`
          : `How does my current Vimshottari period affect my career right now?`,
        paya ? `My Paya is ${paya} — what does this mean for my professional life?` : `What does my Paya say about my professional life?`,
        `Which career directions does my chart most strongly support?`,
        `When is my next major career breakthrough window?`,
      ],
    },
    {
      category: '❤️ Love & Marriage',
      questions: [
        `What kind of partner is written in my chart?`,
        `What is blocking my marriage or relationship right now?`,
        balDasa
          ? `My chart shows ${balDasa} — how does this affect my love life timing?`
          : `How does my chart timing affect my love life?`,
        `What should I absolutely avoid doing in relationships based on my chart?`,
      ],
    },
    {
      category: '💰 Wealth & Money',
      questions: [
        `My lucky planets include ${goodStr} — how do I activate them for wealth?`,
        `What is the biggest money block my chart shows?`,
        `Which years are my peak wealth windows?`,
        `Should I do business or service based on my chart?`,
      ],
    },
    {
      category: '🏥 Health & Energy',
      questions: [
        `What areas of health does my chart flag for attention?`,
        nakName
          ? `My ${nakName} nakshatra — what body areas need extra care?`
          : `What body areas does my nakshatra suggest need extra care?`,
        `When are my energy dips and peaks this year?`,
        `What simple practice would most improve my health based on my chart?`,
      ],
    },
    {
      category: '✈️ Travel & Foreign',
      questions: [
        `Does my chart support foreign travel or settlement?`,
        `Which directions are most favorable for me to travel or relocate?`,
        `When is the best window for international opportunities?`,
        `What does my chart say about foreign income or connections?`,
      ],
    },
    {
      category: '🔮 Spirituality & Karma',
      questions: [
        `What is my soul's primary mission in this lifetime?`,
        `What karmic patterns am I here to resolve?`,
        nakName
          ? `My ${nakName} nakshatra deity — how should I connect with this energy?`
          : `How should I connect with my nakshatra deity energy?`,
        `What is the one spiritual practice my chart most recommends for me?`,
      ],
    },
  ];
}
