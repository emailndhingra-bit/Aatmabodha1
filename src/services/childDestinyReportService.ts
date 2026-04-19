/** Replit / chart API JSON → fields for Child Destiny prompts */

const SIGN_NAMES: Record<number, string> = {
  1: 'Aries',
  2: 'Taurus',
  3: 'Gemini',
  4: 'Cancer',
  5: 'Leo',
  6: 'Virgo',
  7: 'Libra',
  8: 'Scorpio',
  9: 'Sagittarius',
  10: 'Capricorn',
  11: 'Aquarius',
  12: 'Pisces',
};

function degToDecimal(degStr: string | number | undefined): number {
  if (degStr == null) return 0;
  if (typeof degStr === 'number') return degStr;
  const parts = String(degStr).split(/[-:°'"]/).map((x) => parseFloat(x.trim()));
  const d = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;
  return d + m / 60 + s / 3600;
}

function signLabel(p: Record<string, unknown>): string {
  if (typeof p.sign === 'string' && p.sign) return p.sign;
  const r = p.rashi;
  if (typeof r === 'number' && SIGN_NAMES[r]) return SIGN_NAMES[r];
  if (typeof r === 'string' && r) return r;
  return '—';
}

function computeAtmakaraka(d1: Record<string, unknown>[]): string {
  const classical = new Set(['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']);
  let best = { planet: '—', deg: -1 };
  for (const row of d1) {
    const pl = String(row.planet || row.name || '');
    if (!classical.has(pl)) continue;
    const d = degToDecimal((row.degree ?? row.deg) as string | number);
    if (d > best.deg) best = { planet: pl, deg: d };
  }
  return best.planet;
}

export type ProfileHint = { name?: string; gender?: string; dateOfBirth?: string };

export function extractChartData(rawChart: Record<string, unknown>, profile?: ProfileHint) {
  const avkahada = (rawChart.Avakahada_Chakra || rawChart.avkahadaChakra || {}) as Record<string, unknown>;
  const basic = (rawChart.Basic_Details || rawChart.Traditional || {}) as Record<string, unknown>;
  const personal = (rawChart.personal || rawChart.Personal || {}) as Record<string, unknown>;
  const vd = (rawChart.VD || rawChart.vimshottari || []) as Record<string, unknown>[];
  const d1Raw = (rawChart.D1_Rashi || rawChart.D1 || []) as Record<string, unknown>[];

  const childName =
    (profile?.name as string) ||
    (basic.Name as string) ||
    (basic.name as string) ||
    (personal.name as string) ||
    'Child';
  const childDOB =
    (personal.date_of_birth as string) ||
    (personal.Date_of_Birth as string) ||
    (basic.Date_of_Birth as string) ||
    (profile?.dateOfBirth as string) ||
    (rawChart.Varshphal_Details as Record<string, unknown>)?.Date_of_birth ||
    (rawChart.Varshphal_Details as Record<string, unknown>)?.Date_of_Birth ||
    '—';
  const childGender =
    (profile?.gender as string) ||
    (personal.sex as string) ||
    (personal.gender as string) ||
    (basic.Gender as string) ||
    (basic.Sex as string) ||
    '—';

  const planets = Array.isArray(d1Raw)
    ? d1Raw.map((p) => ({
        planet: String(p.planet || p.name || '—'),
        sign: signLabel(p),
        degree: (p.degree ?? p.deg ?? '—') as string | number,
        rashi: p.rashi,
      }))
    : [];

  const dashas = Array.isArray(vd)
    ? vd.slice(0, 12).map((d) => ({
        dasha_lord: String(d.mdLord || d.dasha_lord || '—'),
        start: String(d.startDate || d.start || '—'),
        end: String(d.endDate || d.end || '—'),
      }))
    : [];

  return {
    childName,
    childDOB,
    childGender,
    lagna: String(avkahada.Lagna ?? '—'),
    lagnaLord: String(avkahada.Lagna_Lord ?? '—'),
    moonSign: String(avkahada.Rasi ?? '—'),
    nakshatra: String(avkahada.Nakshatra ?? '—'),
    nakshatraPada: String(avkahada.Nakshatra_Pada ?? '—'),
    nakshatraLord: String(avkahada.Nakshatra_Lord ?? '—'),
    paya: String(avkahada.Paya ?? '—'),
    balDasa: String(avkahada.Bal_Dasa ?? avkahada['Bal Dasa'] ?? avkahada.Bala_Dasa ?? avkahada.Dasa_Balance ?? '—'),
    planets,
    dashas,
    atmakaraka: computeAtmakaraka(d1Raw),
  };
}

export type ChildDestinyChartData = ReturnType<typeof extractChartData>;

const ORACLE_CORE = `You are Aatmabodha's Child Destiny Oracle.
You are generating a premium astrological report for parents about their child.

TONE: Warm, specific, never fear-based.
Write as if speaking directly to the parent.
Every insight must be chart-specific, not generic.
Use Hinglish sparingly — keep report in English.
Format each section with clear headings (Q1, Q2, …).`;

function chartBlock(c: ChildDestinyChartData): string {
  const planetLines =
    c.planets?.map((p) => `${p.planet}: ${p.sign} (${String(p.degree)})`).join('\n') || '(no D1 positions)';
  const vdLines =
    c.dashas
      ?.slice(0, 6)
      .map((d) => `${d.dasha_lord}: ${d.start} to ${d.end}`)
      .join('\n') || '(no VD)';

  return `Name: ${c.childName}
Date of Birth: ${c.childDOB}
Gender: ${c.childGender}
Lagna (Ascendant): ${c.lagna}
Lagna Lord: ${c.lagnaLord}
Moon Sign (Rasi): ${c.moonSign}
Nakshatra: ${c.nakshatra} Pada ${c.nakshatraPada}
Nakshatra Lord: ${c.nakshatraLord}
Paya: ${c.paya}
Balance Dasha at Birth: ${c.balDasa}
Atmakaraka (highest classical longitude): ${c.atmakaraka}

PLANETARY POSITIONS:
${planetLines}

VIMSHOTTARI DASHA SEQUENCE (sample):
${vdLines}`;
}

/** One-shot full prompt (optional); hub uses parts for token limits */
export function buildChildDestinyPrompt(chartData: ChildDestinyChartData): string {
  return `${ORACLE_CORE}

${chartBlock(chartData)}

REPORT FRAMEWORK — Generate ALL 24 sections (Q1–Q24) as specified in the product spec: planetary blueprint, stream/subject, educational environment, academic timing, hobbies, long-term career, parent communication, closing letter. Total ~15,000–18,000 words. Label each section Q1…Q24. Chart-specific only.`;
}

const FW_Q1_Q8 = `
PART 1 OF 3 — Write ONLY Q1 through Q8 in this response (do not write Q9+).

SECTION I — YOUR CHILD'S PLANETARY BLUEPRINT
Q1. Who is this child? (700-900 words) Lagna + Moon + dominant planet; close with "You are someone who…"
Q2. Dominant intelligence type (600-750 words) Name ONE type (Mercury/Moon/Mars/Jupiter/Rahu pattern) + learning environment.
Q3. Five greatest planetary gifts (650-800 words) Five bullets: planet + placement + observable strength; close on adult arc.

SECTION II — STREAM AND SUBJECT SELECTION
Q4. Stream recommendation (700-900 words) ONE primary stream + subjects + second-best + family-expectation mismatch if any.
Q5. Subject-level excellence map (500-650 words) Excel vs support by Mercury/Jupiter/Venus/Mars/Saturn/Rahu.
Q6. Family expectation mismatch (550-700 words) Warm, non-judgmental bridges.

SECTION III — EDUCATIONAL ENVIRONMENT (start only through Q8)
Q7. Boarding school verdict (600-750 words) 4th/Moon vs Saturn/Rahu; verdict catalyst/risk/age-dependent.
Q8. Study abroad potential (550-700 words) 12th/9th/Rahu + dasha window 17-22 or positive reframe.
`;

const FW_Q9_Q16 = `
PART 2 OF 3 — Write ONLY Q9 through Q16 (do not repeat Q1–Q8).

SECTION III (cont.) — EDUCATIONAL ENVIRONMENT
Q9. Teaching style and school type (500-650 words) IB/CBSE/ICSE/Montessori fit + ONE admissions interview question.

SECTION IV — ACADEMIC TIMING AND EXAM STRATEGY
Q10. Dasha sequence school years (700-900 words) Map dashas to age 22; peak vs challenging; strategies.
Q11. Class 10 Dasha strategy (550-700 words) Which dasha at Class 10; parent script.
Q12. Class 12 and entrance exam Dasha (600-750 words) Gap year / second attempt framing.
Q13. Competitive exam format fit (500-650 words) JEE/NEET/UPSC/CAT ranking with planetary reasoning.

SECTION V — HOBBIES AS PLANETARY ACTIVATION
Q14. Hobby recommendations (700-850 words) Five hobbies with planetary links to future capacity.
Q15. Sports or performer potential (500-650 words) Mars/Venus+Moon specifics or positive honest limit.
Q16. The ONE most important hobby (400-500 words) Gift framing + link to career trajectory.
`;

const FW_Q17_Q24 = `
PART 3 OF 3 — Write ONLY Q17 through Q24 (do not repeat earlier sections).

SECTION VI — LONG-TERM CAREER TRAJECTORY
Q17. Top 5 career industries (700-850 words) 10th lord + Atmakaraka + dominant planet; include one non-obvious pick.
Q18. Career peak and trajectory 25-45 (600-750 words) Name peak decade by chart pattern.
Q19. Employment vs entrepreneurship (500-650 words) Clear verdict with life-stage nuance.

SECTION VII — PARENT COMMUNICATION GUIDE
Q20. Planetary communication type (650-800 words) How this child receives feedback (Mercury/Moon/Mars/Jupiter/Saturn/Rahu).
Q21. What lands as criticism when it is love (600-750 words) Deepest emotional section; gentle framing.
Q22. Communication in high-pressure periods (550-700 words) One de-escalation sentence per relevant type.
Q23. Communication evolution across age stages (600-750 words) 6-12, 13-18, 18+ key shifts.
Q24. The closing insight (450-600 words) Letter to parent; open "What your child's chart most wants you to understand is…"; close with hope (raise them toward what they are…).
`;

/** Three prompts for sequential Gemini calls (avoids single-response truncation). */
export function buildChildDestinyPromptParts(chartData: ChildDestinyChartData): string[] {
  const chart = chartBlock(chartData);
  const base = `${ORACLE_CORE}\n\nCHILD'S CHART DATA:\n${chart}\n`;
  return [`${base}\n${FW_Q1_Q8}`, `${base}\n${FW_Q9_Q16}`, `${base}\n${FW_Q17_Q24}`];
}
