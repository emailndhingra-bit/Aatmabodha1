# Aatmabodha — Master Context

## CURRENT VERSION

V5.9.2 FINAL — Shipped Apr 21, 2026 (production verified)  
Quality: 9.5/10 — validated multi-turn on real chart responses  
Status: Live, serving real users, memory continuity proven

---

## NOTE for future sessions

V5.9.2 is production-grade and serving real users as of Apr 21, 2026.  
Real user activity verified — complex financial, legal, and emotional identity queries answered at premium quality level.

**Key architectural locks (do not change without review):**

- Chart data in cached systemInstruction (cost efficiency)
- History summarization preserves memory continuity (verified)
- Pricing constants match real Gemini 3 Pro rates (accuracy)
- Gemini displayName recovery (restart resilience)
- OracleDiag and ContextCache logs (observability)

**Architectural directions to investigate BEFORE changing:**

- Divisional chart payload (D1 to D60) — know structure before optimizing
- DPDPA compliance architecture — legal review required
- Streaming architecture — affects request/response pattern
- Share feature public slug — requires new DB table plus routing

**Do not rush changes that touch:**

- oracleRules.ts (3800 lines, high regression risk)
- Chart assembly or cache keys (stability critical)
- Pricing calculation logic (billing accuracy)
- Memory / history summarization (continuity critical)

---

**LAST UPDATED:** April 21, 2026 (V5.9.2 Launch Day — production verified)

---

## AI PROVIDER

- Model: Google Gemini 3 Pro Preview
- Tier: Prompts ≤ 200k tokens (standard pricing)
- Input (non-cached): $2.00 per 1M tokens
- Input (cached):     $0.20 per 1M tokens (87.5% discount)
- Output (includes thinking tokens): $12.00 per 1M tokens
- Cache storage: $4.50/M tokens/hour (negligible at 1h TTL)
- Cache fallback: Gemini displayName lookup across process restarts
- Source: ai.google.dev/pricing (verified 2026-04-21)

---

## COST ECONOMICS

(verified Apr 21, 2026 production logs)

**Token profile per query (post all optimizations):**

- Cached input: ~36,000 tokens (Oracle rules + chart)
- Dynamic input: ~200-800 tokens (question + history summary)
- Output: ~450-600 tokens

**Cost per query (real rates):**

- Cached:  36,000 × $0.20/M × ₹92 = ₹0.66
- Dynamic: 400 × $2.00/M × ₹92    = ₹0.07
- Output:  525 × $12.00/M × ₹92   = ₹0.58
- Total per query: ~₹1.31

**Follow-up queries with history summary:**

- Dynamic: 1,300-1,400 chars (summary 236-280 + question)
- Cost: ~₹1.34 per follow-up
- Savings vs raw history: 27% on deep conversations

**Deep complex queries (shadow work, multi-engine synthesis):**

- Output: 800-900 tokens (2,500-3,500 chars)
- Cost: ~₹1.70-1.90 per query

**Response time:** 25-45 seconds (3x improvement from session baseline of 70-96s)

**At 150 queries/user/year:**

- Annual cost per user: ~₹196
- Revenue target: ₹1,100/user/year
- Realistic margin: 82%

**At 10,000 users:**

- Annual revenue: ₹1.1 crore
- Annual cost: ~₹19.6 lakh
- Annual profit: ~₹90 lakh
- Margin: 82%

---

## PRODUCTION METRICS

(verified in Render logs Apr 21, 2026)

**Cache behavior:**

- Memory Map hit on same-process repeats: confirmed
- Gemini-side displayName recovery across restarts: confirmed
- Chart in cached systemInstruction: stable 144K chars
- Dynamic payload after history summary: 761-1,419 chars

**Response quality:**

- finishReason STOP consistent
- httpOk true consistent
- outputLength: 1,800-3,500 chars (scales with query complexity)

**Memory continuity (verified multi-turn):**

- Callback phrases preserved across queries
- Timing windows remembered (e.g. 99% wall pattern recalled)
- Yoga detections carry forward
- Veto decisions persist
- Cross-query intrigue hook threading emergent
- Oracle personality voice consistent

**Oracle intelligence engines verified in production:**

- Nakshatra and pada analysis
- SAV and BAV numerical scores
- Shadbala explicit values (cited e.g. 1.60)
- NBRY (Neecha Bhanga Raja Yoga)
- Vakri (retrograde) awareness
- Panchamahapurusha Yogas (Malavya detected)
- Atmakaraka + Amatyakaraka (Jaimini)
- Planetary Avastha (Bal, Kumar, Yuva, Mrita detected)
- Guru-Chandal yoga detection
- Remedy priority system (1 through 5)
- Classical BPHS and JS citations with chapter numbers
- Sanskrit shlokas in Devnagari with transliteration
- Willpower score integration (free will vs destiny)
- Ishta Devata mapping (Nadi method)
- Bhrigu Bindu explicit degree calculation
- KP Krishnamurti Paddhati sub-lord analysis
- D1 through D60 divisional chart awareness
- Tattva integration (Jala, Agni, Prithvi)
- Ghatak Vaar per-chart personalization
- Location personalization (city-specific shrines)

**Real user activity verified:**

- Complex financial queries (debt restructuring, legal cases)
- Emotional identity queries (soul work, mask vs self)
- Multi-turn consultations (7+ queries per session)

---

## ORACLE RULES VERSION HISTORY

**V5.9.1 DEPLOYED (Apr 2026):**

- Premium Hinglish wise-elder Oracle templates; definitive language tier
- User respect guardrails — strict multi-point length cap (V5.9)
- Dynamic name placeholder in multi-question templates

**V5.9.2 DEPLOYED (Apr 21, 2026):**

   ├─ QuestionSelector UI (click-based multi-question)
   ├─ Cache tier-2 recovery via Gemini displayName lookup
   ├─ Timeout cascade corrected (180s > 175s > 160s > 150s)
   ├─ Chart data in cached systemInstruction (per natal fingerprint)
   ├─ History 12 to 6 turns
   ├─ History summarization (topics, predictions, vetoes, hooks)
   ├─ Pricing constants aligned to Gemini 3 Pro official rates
   ├─ maxOutputTokens explored and reverted (thinking tokens issue)
   └─ OracleDiag and ContextCache observability live

---

## CURRENT PRIORITIES

### SHIPPED APR 21 (V5.9.2 Launch Day — 18 commits)

**Features:**

- V5.9.1 premium Hinglish wise-elder templates
- V5.9.2 QuestionSelector UI
- name placeholder substitution across templates

**Infrastructure:**

- Backend build unblocked (chromium type fix)
- Timeout cascade (180 > 175 > 160 > 150 Gemini)
- Gemini cache recovery across process restarts
- Chart in cached systemInstruction per natal fingerprint
- History trim 12 to 6 turns
- History summarization with fallback-safe extractor

**Observability:**

- OracleDiag Gemini lifecycle logs
- ContextCache multi-tier tracking memory vs Gemini-recovered vs created
- MAX_TOKENS warning log (retained for monitoring)

**Accuracy:**

- Pricing constants match Gemini 3 Pro official rates
- Logged cost equals actual Google Cloud bill

**Verified Performance (production metrics):**

- Response time 70-96s to 25-45s (3x faster)
- Dynamic payload 10-13K to 1-2K chars (6-10x smaller)
- Deep follow-up cost reduction 27%
- Cache hit rate near 100% on 2nd+ same-chart queries
- Cache persistence verified across Render restarts
- Memory continuity verified multi-turn

### KNOWN BACKLOG (V5.9.3 or V6.0)

**Critical (V5.9.3):**

- Investigate httpOk false silent failures on some queries
- Billing reconciliation 7-day window vs Google Cloud Console
- Cache hit rate telemetry in admin dashboard
- Divisional chart payload investigation (D1 to D60 architecture)

**V6.0 architectural:**

- Transit staleness fix — split static natal vs daily transits
- Pre-computed chart interpretation pipeline (informed by D-chart investigation)
- Streaming responses — SSE backend plus frontend reader
- Share feature full implementation — public slug plus open graph
- Pricing tier restructure — free trial plus 3 paid tiers
- Voice mode integration (ElevenLabs or Sarvam TTS)
- Multi-language Oracle (Hindi, Tamil, Bengali)
- Follow-up question intelligence (clarification vs new reading)

**Compliance (DPDPA 2023):**

- Granular consent UI with per-purpose checkboxes
- Consent log table with 7-year audit trail
- Field-level encryption for DOB and birth data
- Pseudonymization before Gemini API calls
- Data principal rights dashboard (access, correct, erase, portability)
- Cross-border transfer disclosure for US-hosted Gemini
- Data Processor Agreements with Google, Neon, Render
- Breach notification workflow 72-hour
- Privacy policy and terms legal review

**Nice-to-have:**

- Stray Menu log source investigation (cosmetic)
- Remove OracleDiag logs after 1 week stable
- Oracle rules audit (3800 lines, potential trim after 1 month)
- Automated regression test suite
- Admin analytics dashboard enhancements
- Cache TTL optimization (1h to 2h candidate)
- In-flight deduplication for concurrent same-key requests
- Soft prompt-based length cap (since hard cap reverted)

---

## GIT COMMIT HISTORY

### April 21, 2026 — V5.9.2 Launch Day (18 commits)

- perf(cost): replace raw history with compact summary
- fix(cost): revert maxOutputTokens cap (thinking tokens counted)
- perf(cost): cap output 600 tokens (reverted)
- fix(cost): correct Gemini 3 Pro pricing constants to official rates
- perf(cost): trim conversation history from 12 to 6 turns
- perf(cost): move natal chart to cached systemInstruction per-user
- fix(cache): recover Gemini cachedContents across restarts via displayName
- fix(timeout): correct cascade ordering frontend 180 Render 175 backend 160
- fix(backend): resolve chromium type error blocking backend build
- chore(oracle): diagnostic logs for cache and Gemini timeout
- feat(ui): V5.9.2 QuestionSelector UI click-based multi-question
- fix(oracle): V5.9.1 dynamic name placeholder in multi-question templates
- fix(oracle): V5.9.1 corrected templates definitive premium language
- feat(oracle): V5.9 user respect guardrails length strict multi-point cap
- (plus 4 earlier session commits from the V5.9 build-up)

---

*End of master context — align future edits with this document.*
