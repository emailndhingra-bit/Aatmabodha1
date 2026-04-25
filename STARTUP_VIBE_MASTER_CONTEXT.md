# STARTUP_VIBE_MASTER_CONTEXT.md

**Module:** Startup Vibe Check (admin-only, inside Aatmabodha)
**Version:** V1.0.1
**Audience:** Cursor + future-self continuity
**Last updated:** April 25, 2026

This file is the canonical spec. Every per-phase build prompt references it. Do not delete or rename.

**Revision V1.0.1 (post-Phase 0 recon):** Backend path corrected to `backend/src/`. TOB locked mandatory. Summarization aligned to Oracle's deterministic regex pattern (no LLM call). Gemini model name corrected to `gemini-3.1-pro-preview`.

---

## 1 · MISSION

Admin-only module inside Aatmabodha. Accepts birth details of 2 to 8 people (founders, early team, investors, advisors). Produces a structured Jyotish + practical-business chemistry analysis answering:

- Who should lead (CEO / visionary)?
- Who should run product/tech (CTO / builder / operator)?
- Who should bring business (CRO / sales / fundraising)?
- Who fills which gap across the 8-role taxonomy?
- 3 success pathways, 3 disaster pathways.
- What's good, what's not so good.
- Equity + trust risk flags.
- Dasha-window read — launch window or wait-it-out window?

Plus a **chat interface** for follow-up questions grounded in a specific analysis. Scope per message: team / subset / individual / hypothetical.

This is internal tooling. Not a public product. Voice is analyst-to-analyst — direct, forensic, willing to call patterns plainly.

---

## 2 · ARCHITECTURAL LOCKS — DO NOT VIOLATE

- **Do not** modify Oracle rules version, Oracle prompt, or Oracle cache.
- **Do not** expose `/api/admin/svc/*` routes without admin guard. Triple-check the middleware chain.
- **Do not** share Gemini cache namespace with Oracle. Startup Vibe uses its own namespace `svc:` and `svc-chat:`.
- **Do not** introduce a new UI library. Use existing primitives.
- **Do not** introduce a new auth provider. Use existing admin auth.
- **Do not** add new env vars without updating `.env.example`.
- **Do not** ship a public-facing version. If anyone asks, the answer is no.
- **Do not** chain shell commands with `&&` (PowerShell on Windows).
- **Bump `STARTUP_VIBE_RULES_VERSION` before any prompt edit.** Same discipline as Oracle's `ORACLE_RULES_VERSION`. The Apr 22 cache fix in Oracle exists because of a missed bump — do not repeat.

### Phase 0 recon — confirmed implementation details (V1.0.1)

The following are **observed in the actual repo** and should be used verbatim — do not re-derive:

- **Admin auth chain:** `@UseGuards(JwtAuthGuard, AdminGuard)`. `AdminGuard` lives at `backend/src/guards/admin.guard.ts` and compares `request.user.email` against `ADMIN_EMAILS` env (comma-separated allowlist). No DB role table. No `@Roles()` decorator. SVC controllers use this exact chain. **Global API prefix is `api`** — all SVC routes use `/api/admin/svc/*`. The original spec had the prefix order reversed; this is now corrected throughout the document.
- **Chart service:** `POST {CHART_API_URL}/api/chart` with `{ date_of_birth, time_of_birth, latitude, longitude, timezone? }`. Returns `D1`, `D2`, `D9`, `D20`, `D24`, `D27`, `Varshphal_Details`, `Derived_Metrics`, etc. **TOB is required by the DTO** — see §3 schema (TOB locked NOT NULL).
- **Gemini service:** `backend/src/gemini/gemini.service.ts`. Model: `gemini-3.1-pro-preview`. Cache mechanism: Google `cachedContents` keyed by `displayName`. Oracle uses an opaque SHA-256 hex string as `displayName`. SVC uses `displayName` strings prefixed `svc:` and `svc-chat:` — these will never collide with Oracle's 64-char hex keys.
- **Streaming:** Oracle does not stream. SVC does not stream. Single `generateContent` POST, single JSON response.
- **Summarization:** Deterministic regex compaction, not LLM (see §9.4).

### What this module reuses

- Chart service (Flask + Swiss Ephemeris on Replit) — same endpoint Oracle uses (`POST /api/chart`). No changes.
- Gemini `gemini-3.1-pro-preview` via existing NestJS `gemini.service.ts`. Add new methods, do not edit existing Oracle methods.
- PostgreSQL (Neon) — new tables only.
- Frontend shell, dark theme, admin auth guard (`JwtAuthGuard + AdminGuard` chain via email allowlist) — reused.

### What this module ships fresh

- Backend module: `backend/src/startup-vibe/`
- Frontend route: `/admin/startup-vibe`
- DB tables: `svc_sessions`, `svc_people`, `svc_results`, `svc_chat_threads`, `svc_chat_messages`
- Cached system instructions: `STARTUP_VIBE_RULES_VERSION` namespace (analysis + chat sub-namespaces)
- Env vars: `STARTUP_VIBE_RULES_VERSION` (independent of Oracle's)

---

## 3 · DATA MODEL

```sql
CREATE TABLE svc_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id   UUID NOT NULL,
  label           TEXT NOT NULL,
  industry        TEXT,                    -- "SaaS" | "D2C" | "Deeptech" | "Services" | "Healthcare" | "Fintech" | "Edtech" | "Other"
  stage           TEXT,                    -- "Idea" | "MVP" | "Launched" | "Scaling" | "Mature"
  funding_status  TEXT,                    -- "Bootstrap" | "Pre-seed" | "Seed" | "Series A+" | "Series B+"
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE svc_people (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES svc_sessions(id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL,
  dob             DATE NOT NULL,
  tob             TIME NOT NULL,           -- mandatory; chart service requires it (locked V1.0.1)
  pob_city        TEXT NOT NULL,
  pob_lat         NUMERIC,
  pob_lon         NUMERIC,
  pob_tz          TEXT,                    -- IANA tz, e.g. "Asia/Kolkata"
  role_preference TEXT,                    -- "CEO" | "CTO" | "CRO" | "Open" | etc.
  chart_json      JSONB,                   -- cached output from chart service
  position_index  INT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE svc_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES svc_sessions(id) ON DELETE CASCADE,
  rules_version   TEXT NOT NULL,
  result_json     JSONB NOT NULL,
  generated_at    TIMESTAMPTZ DEFAULT now(),
  generation_ms   INT,
  cache_hit       BOOLEAN DEFAULT FALSE
);

CREATE TABLE svc_chat_threads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID REFERENCES svc_sessions(id) ON DELETE CASCADE,
  result_id       UUID REFERENCES svc_results(id) ON DELETE CASCADE,
  rules_version   TEXT NOT NULL,
  title           TEXT,
  summary         TEXT,                    -- rolling summary, refreshed every N turns
  message_count   INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE svc_chat_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id         UUID REFERENCES svc_chat_threads(id) ON DELETE CASCADE,
  role              TEXT NOT NULL,         -- 'user' | 'assistant'
  content           TEXT NOT NULL,
  scope_person_ids  UUID[],
  scope_kind        TEXT,                  -- 'team' | 'subset' | 'individual' | 'hypothetical'
  hypothetical_note TEXT,
  tokens_in         INT,
  tokens_out        INT,
  cache_hit         BOOLEAN DEFAULT FALSE,
  generation_ms     INT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_svc_people_session    ON svc_people(session_id);
CREATE INDEX idx_svc_results_session   ON svc_results(session_id, generated_at DESC);
CREATE INDEX idx_svc_chat_threads_sess ON svc_chat_threads(session_id, last_message_at DESC);
CREATE INDEX idx_svc_chat_msgs_thread  ON svc_chat_messages(thread_id, created_at);
```

---

## 4 · API SURFACE

```
# Sessions + people + analysis
POST   /api/admin/svc/sessions
GET    /api/admin/svc/sessions
GET    /api/admin/svc/sessions/:id
POST   /api/admin/svc/sessions/:id/people
DELETE /api/admin/svc/sessions/:id/people/:personId
POST   /api/admin/svc/sessions/:id/analyze
GET    /api/admin/svc/sessions/:id/results
DELETE /api/admin/svc/sessions/:id

# Chat
POST   /api/admin/svc/sessions/:id/chat/threads
GET    /api/admin/svc/sessions/:id/chat/threads
GET    /api/admin/svc/chat/threads/:threadId
POST   /api/admin/svc/chat/threads/:threadId/messages
DELETE /api/admin/svc/chat/threads/:threadId
POST   /api/admin/svc/chat/threads/:threadId/regenerate
```

All routes guarded by admin middleware. 401 if unauthenticated, 403 if non-admin.

---

## 5 · ROLE TAXONOMY (8 archetypes)

The model scores each person 0–100 on each role. Surface top 2 per person. Flag role collisions (top role contested within 10 points) and uncovered roles (no one >60).

| Code | Role | Vedic signature | Practical translation |
| --- | --- | --- | --- |
| `VISIONARY_CEO` | Visionary / CEO | Strong Sun (Atmakaraka or in Lagna/10th); Sun–Jupiter yoga; strong Lagna lord; Leo/Aries emphasis; benefic 10th | Carries the narrative. The face. Makes the unilateral call when consensus stalls. |
| `EXECUTOR_COO` | Operator / COO | Strong Saturn + Mars yoga (controlled execution); strong 6th; Capricorn emphasis; Mars in earth/fixed | Turns vision into shipped reality. Holds the timeline. Says no. |
| `BUILDER_CTO` | Builder / CTO | Strong Mercury (earth signs preferred); Mercury–Saturn yoga; strong 6th; Virgo/Aquarius emphasis; Rahu well-placed for deeptech | Designs and ships. Comfortable with depth + abstraction simultaneously. |
| `HUSTLER_CRO` | Hustler / CRO | Strong Venus + Mercury; strong 3rd; strong 7th; 11th house; Jupiter aspect on Mercury | Closes deals. Builds the network. Brings the cheque. Tolerates rejection. |
| `BRAND_CMO` | Brand / CMO | Strong Mercury–Venus; 3rd + 5th emphasis; Jupiter for narrative weight; Moon for audience empathy | Tells the story so the market believes it. Owns positioning, voice, taste. |
| `STEWARD_CFO` | Steward / CFO | Strong Jupiter; 2nd house strength; Saturn for discipline; Mercury in earth signs | Owns runway math. The adult in the room. The "no" before "yes" gets too expensive. |
| `MAGNET_CULTURE` | People / Culture | Strong Moon; Venus; 4th house; Jupiter for mentorship; benefic 7th | Holds the team together. The first to notice morale slipping. |
| `RAINMAKER_FUNDRAISER` | Capital Magnet | Lakshmi yogas; Dhana yogas (2/5/9/11 lord interrelations); Jupiter–Venus; Atmakaraka in benefic placement; strong 11th lord | Pulls capital and signals. Investor-facing, distinct from CRO (customer-facing). |

---

## 6 · DIMENSION FRAMEWORK (10 dimensions)

Each scored 0–100 with a 2–3 sentence read.

**Inherited from VibeCheck (re-voiced for startup):**

1. **Vision Alignment** — *Do they actually want the same company?* Sun-Sun, Jupiter cross-activation, 9th house cross-activation, Atmakaraka comparison.
2. **Communication Velocity** — *Can they make decisions in a 30-minute call?* Mercury match, 3rd house cross-activation, Mercury–Mercury aspect, Jupiter–Mercury cross-aspect.
3. **Execution Pace Compatibility** — *Will one always feel the other is too slow / too fast?* Mars match, Mars–Mars angle, Lagna cross-activation, Saturn vs Mars dominance.
4. **Trust Architecture** — *Can they handle a hard conversation about equity at month 18?* Saturn cross-aspect, 8th house cross-activation, Ketu–Moon, 11th lord vs 6th lord interplay.
5. **Cultural Chemistry** — *Will they enjoy 70-hour weeks together for three years?* 5th house cross-activation, Venus–Jupiter cross-aspect, Moon-element compatibility.

**Startup-specific (new):**

6. **Decision Velocity Under Uncertainty** — Sun strength differentials, Lagna lord differentials, Saturn placement, Mars–Mercury yoga.
7. **Crisis Resilience** — 6th house strength per person, 8th house tolerance, Saturn maturity, Mars–Saturn yoga, Rahu placements.
8. **Capital Magnetism** — Lakshmi yogas across team, Dhana yogas, 2nd/11th house strength, Jupiter–Venus, current Mahadasha periods.
9. **Equity Trust Stability** — Saturn–Rahu yogas across charts (the equity-fight signature), 6th–8th–12th cross-tensions, Ketu over partner's 11th, weak 7th in two or more founders.
10. **Dasha-Window Alignment** — Current Maha+Antar per person classified expansive/contractive/volatile/mixed, collective dasha state.

---

## 7 · OUTPUT JSON CONTRACT

```ts
type StartupVibeResult = {
  schema_version: "1.0.0";
  rules_version: string;
  generated_at: string;
  session_label: string;
  team_size: number;

  team_archetype: {
    name: string;                        // e.g. "The Vertical Specialists"
    tagline: string;
    two_sentence_read: string;
  };

  dimensions: {
    [key in DimensionKey]: {
      score: number;
      band: "low" | "medium" | "high";
      read: string;                      // 2-3 sentences
      key_indicators: string[];
    };
  };
  // DimensionKey = vision_alignment | communication_velocity |
  //   execution_pace | trust_architecture | cultural_chemistry |
  //   decision_velocity | crisis_resilience | capital_magnetism |
  //   equity_trust_stability | dasha_window_alignment

  role_recommendations: Array<{
    person_id: string;
    person_name: string;
    role_scores: Record<RoleCode, number>;
    top_roles: Array<{ code: RoleCode; score: number; planetary_basis: string }>;
    role_preference_match: "strong_match" | "weak_match" | "mismatch" | "not_specified";
    role_preference_note?: string;
  }>;

  role_collisions: Array<{
    role: RoleCode;
    contesting_people: string[];
    score_delta: number;
    note: string;
  }>;

  uncovered_roles: Array<{
    role: RoleCode;
    severity: "critical" | "important" | "nice_to_have";
    note: string;
  }>;

  success_pathways: Array<{
    title: string;
    narrative: string;                   // 3-5 sentences
    chart_basis: string[];
    strategic_implication: string;
  }>;

  disaster_pathways: Array<{
    title: string;
    narrative: string;
    chart_basis: string[];
    typical_timeline: string;            // e.g. "month 12-18"
    mitigation: string;
  }>;

  equity_trust_flags: Array<{
    severity: "red" | "amber" | "yellow";
    title: string;
    chart_citation: string;
    mitigation: string;
  }>;

  hidden_strengths: string[];
  blind_spots: string[];

  dasha_timing: {
    individual: Array<{
      person_name: string;
      mahadasha: string;
      antardasha: string;
      classification: "expansive" | "contractive" | "volatile" | "mixed";
      window_until: string;
      one_line_read: string;
    }>;
    collective_state: "green" | "amber" | "red";
    recommended_launch_window: { start: string; end: string; rationale: string } | null;
    avoidance_window: { start: string; end: string; rationale: string } | null;
  };

  the_one_thing: string;                 // exactly one sentence
};
```

---

## 8 · ANALYSIS SYSTEM INSTRUCTION (cached)

Lives in `prompt/system-instruction.ts`, versioned by `STARTUP_VIBE_RULES_VERSION`. Outline:

```
You are the Startup Vibe Check analyst — Vedic-Jyotish + practical-business chemistry
reader for founder teams (2 to 8 people).

Your job is NOT to predict outcomes. Your job is to describe the texture of the team
— natural strengths, structural weaknesses, where to consciously compensate, where
stated intent and natural disposition mismatch.

Audience: an analyst, not the subjects. You can be more direct than a consumer-facing
astrology product.

RULES:
1. Translate every Jyotish indicator into a practical business consequence.
2. Cite specific chart elements by name and house.
3. Avoid fatalism. Every red flag has a mitigation. Every disaster pathway has a
   preventative action.
4. Avoid hedging into uselessness. If the chart says someone is the visionary, say it.
5. Acknowledge limits. "The chart suggests" / "the indicator points to" — yes.
   "This will happen" — no.

[Insert §5 role taxonomy verbatim]
[Insert §6 dimension framework verbatim]

OUTPUT: only valid JSON matching the contract. No preamble, no postamble, no
markdown fences.

[Insert §7 JSON contract verbatim]

VOICE:
- Each dimension read: 2–3 sentences.
- Each pathway narrative: 3–5 sentences.
- the_one_thing: exactly one sentence. Poetic but grounded. No proper nouns required.
- Use both names whenever citing a cross-chart indicator.
- Never invent chart facts. If the team has 6 people, analyse 6.
- Industry context (SaaS / D2C / Deeptech / Healthcare / etc.) influences role
  recommendations.

DO NOT:
- Predict romantic outcomes.
- Give legal, tax, or specific equity-percentage advice.
- Break character into "as an AI."
- Produce content for the people themselves to read.
```

The user-message-per-request is structured (session context + people summaries + scaffold). Scaffold pre-computes cross-chart yogas, role-fitness vectors, dasha classifications **before** Gemini sees them — so Gemini's job is interpretation, not arithmetic.

Cache key: `svc:${STARTUP_VIBE_RULES_VERSION}:${team_chart_hash}`. TTL 30 days.

---

## 9 · CHAT MODULE

### 9.1 Mission

Follow-up Q&A grounded in a specific analysis. NOT Oracle. Oracle's voice is devotional-conversational. Startup Vibe Chat is **analyst-to-analyst** — direct, forensic.

### 9.2 Grounding

Each thread anchors to a specific `result_id`. The cached system instruction contains:
- Session metadata (label, industry, stage, funding).
- All people's chart summaries + current dashas.
- The full `result_json` of the anchored analysis.
- The scaffold (cross-chart yogas, role-fitness vectors, dasha classifications).
- Analyst-mode voice rules.

Cache key: `svc-chat:${rules_version}:${result_id}`. One cached instruction per (rules_version, result_id) tuple. TTL 30 days.

### 9.3 Scope per message

| Scope | UX | Effect |
| --- | --- | --- |
| **Team** (default) | Pill: "All N founders" | No filter. |
| **Subset** | Multi-select chips | Focus on cross-chart dynamics between selected people. |
| **Individual** | Single chip | Focus on one person; others are context only. |
| **Hypothetical** | Text field | Reason structurally about a counterfactual without inventing a person. |

Sent to backend with each message; inserted into the user prompt envelope.

### 9.4 History management (LOCKED V1.0.1 — match Oracle exactly)

**Oracle does NOT use LLM summarization.** Phase 0 recon confirmed: Oracle takes `history.slice(-6)` (last 6 turns) and runs a deterministic regex-based compaction looking for reference tags, % predictions, veto-like phrases, and trailing questions. If anything matches, a `[Prior conversation summary] ... [End summary]` block (max 1500 chars) is prepended to the user turn. If nothing matches, no summary is prepended. **Zero Gemini calls for summarization.**

**Startup Vibe Check matches this exactly:**

- Window: `history.slice(-6)` — last 6 turns sent verbatim with each message.
- Compaction: same regex patterns as Oracle's `buildHistorySummary()` in `backend/src/gemini/gemini.service.ts`. Reuse the function if it can be made generic; otherwise copy the exact regex set into `chat/chat-history-summarizer.ts` and document the source.
- The `svc_chat_threads.summary` column **is not a stored LLM summary** — it is unused in V1.0.1 and reserved for V2 if we later want true rolling summarization. Keep the column in the schema for forward compatibility.
- Cost lock: chat must add **zero additional Gemini calls** beyond the per-message generation. No summarizer model, no smaller model, no second pass.

This decision is locked. Do not introduce LLM-based summarization without bumping `STARTUP_VIBE_RULES_VERSION` and explicit approval.

### 9.5 Chat system instruction outline

```
You are the Startup Vibe Check chat analyst. NOT Oracle. NOT a generic astrology
chatbot. Audience: the analyst.

[Inserted at thread creation, frozen for the cached instruction:
 - session metadata
 - all people + chart summaries + dashas + role preferences
 - complete result_json
 - scaffold]

HOW TO ANSWER:
1. Ground every claim in a specific chart fact OR an element of the analysis.
2. When the analysis already answers the question, surface that plainly first,
   THEN add depth. Do not make the user re-derive what they already paid for.
3. When the question pushes beyond the analysis, reason from underlying chart
   facts. Be explicit when extrapolating.
4. For hypotheticals: state the structural answer (which dimensions shift, which
   direction, roughly how much) without inventing a specific person.
5. Missing data: say so plainly. Do not invent.
6. Never predict outcomes. Reframe to "what does the chart say about the team's
   risk surface in this scenario?"

SCOPE HANDLING: each message includes scope marker (TEAM / SUBSET / INDIVIDUAL /
HYPOTHETICAL). Honor it.

VOICE:
- Direct. The analyst can handle a hard answer.
- Specific. Cite planets, houses, nakshatras, dashas by name.
- Restrained. Three sentences > a paragraph.
- No emoji. No exclamation. No "great question." No "as an AI." No "hope this
  helps." Just answer.
- Plain prose by default. Markdown lists only if user asks for structure or 3+
  parallel items genuinely need separation.
- Reply length matches question. One-line question → 2–4 sentences. "Walk me
  through" → 3–5 paragraphs. Never pad.

DO NOT:
- Predict romantic / financial / legal outcomes.
- Give legal, tax, or specific equity-percentage advice.
- Invent chart facts. Person not in session → say so.
- Contradict the anchored analysis without explicit reasoning.
- Break character into helpful-assistant mode.
```

### 9.6 User message envelope (built by `chat-context-builder.ts`)

```
[SCOPE: TEAM | SUBSET(Priya, Arjun) | INDIVIDUAL(Meera) | HYPOTHETICAL]
[HYPOTHETICAL_NOTE: "if we replaced Arjun with a Saturn-strong builder"]

USER MESSAGE:
{user question}

[CONVERSATION SUMMARY: {rolling summary if any}]
[RECENT TURNS: last N turns]
```

### 9.7 Frontend placement

Chat lives **on the result view** as a right-side drawer. Result occupies left 60–65%, chat right 35–40%. Narrow screens: chat becomes full-screen overlay toggled by button.

Chat panel layout (top to bottom):
1. Thread header — title (auto-gen + editable), thread switcher, "New thread."
2. Anchored-result indicator — "Anchored to analysis from {date}, rules {version}."
3. Message list — scrollable, sticky-bottom. User right-aligned, assistant left.
4. Scope chip + multi-line input. Cmd/Ctrl-Enter to send.
5. Suggested prompts — three context-aware chips on fresh thread; replaced by server-generated follow-ups after each assistant reply (defer to Phase 4 if budget tight).

---

## 10 · GUARDRAILS, RATE LIMITS, AUDIT

- Analysis: 5 per admin per hour. Override with `?force=true` (logged).
- Chat: 30 messages per admin per hour, separate limit.
- Audit log per analysis call: admin user, session, rules version, generation ms, cache hit/miss, token usage, cost estimate.
- Audit log per chat message: thread, scope, tokens in/out, cache hit, generation ms, rules version.
- Surface in admin Usage panel.

---

## 11 · ACCEPTANCE TESTS (full suite)

### Foundation (Phase 1)

F1. Unauthenticated request to `/api/admin/svc/sessions` → 401.
F2. Authenticated non-admin → 403.
F3. Submit 1 person → 400. Submit 9 → 400. 2 to 8 → 200.
F4. Person without TOB → analysis runs, dasha confidence flagged "low" in output.
F5. POB without resolved lat/lon/tz → 400 at submit time.

### Analysis (Phase 2)

A1. Schema validation: mock Gemini response missing `the_one_thing` → server retries once → on second failure, 502 with descriptive error.
A2. Cache hit: two analyses on same team, same rules_version → second `cache_hit: true`, much lower `generation_ms`.
A3. Rules version bump: same team → cache miss → new analysis runs.
A4. Role collision detection: synthetic team with two visionary-CEO scores within 5 points → `role_collisions` populated.
A5. Uncovered role detection: team where no person scores >50 on `STEWARD_CFO` → `uncovered_roles` includes it with `critical` severity.
A6. Disaster pathway grounding: every disaster pathway references at least 2 chart indicators present in input.
A7. Voice constraints: `the_one_thing` exactly one sentence; no `dimensions[*].read` exceeds 3 sentences.

### Chat (Phase 2.5)

C1. Thread creation: POST without `result_id` → thread anchored to latest result on session.
C2. Grounded answer: "Why does Priya rank low on CEO?" → reply cites at least one specific chart indicator from Priya's chart present in input.
C3. Subset scope: ask about Arjun and Meera with scope set to those two → reply does not introduce a third founder unless directly relevant.
C4. Individual scope: "Tell me more about Priya" with INDIVIDUAL scope → reply stays focused on Priya.
C5. Hypothetical: "What if we replaced Arjun with a Saturn-strong builder?" → reply reasons structurally without inventing a specific person; projects directional dimension changes.
C6. Missing-person guard: ask about person not in session → reply states this plainly, does not invent a chart.
C7. Cache hit: send 3 messages quickly to same thread → message 2, 3 show `cache_hit: true` and lower `generation_ms`.
C8. Summarization: beyond turn threshold → thread `summary` non-null, captures conversational arc.
C9. Rules version bump: existing thread readable; new message → cache miss on first, hits subsequently.
C10. Voice constraint: no assistant message contains "great question," "as an AI," "hope this helps." Regex check in post-processor; on match, log warning.
C11. Auth: unauthenticated POST to `/svc/chat/*` → 401. Non-admin → 403.
C12. Scope validation: SUBSET with person ID not in session → 400.

### Polish (Phase 3)

P1. Loading screen visible minimum 8 seconds even if response faster.
P2. Result history view shows all past results for a session, ordered desc.
P3. Chart service timeout → graceful UX, does not corrupt session state.
P4. Rate limit triggered → 429 with retry-after header, UI surfaces clearly.

---

## 12 · NESTJS MODULE STRUCTURE

**Real backend path** is `backend/src/startup-vibe/` (confirmed in Phase 0 recon — the repo does not use a monorepo `apps/backend/` layout).

```
backend/src/startup-vibe/
├── startup-vibe.module.ts
├── startup-vibe.controller.ts
├── startup-vibe.service.ts
├── prompt/
│   ├── system-instruction.ts
│   ├── system-instruction.version.ts
│   ├── chat-system-instruction.ts
│   └── user-prompt-builder.ts
├── analysis/
│   ├── chart-fetcher.service.ts
│   ├── role-scorer.service.ts
│   └── dasha-classifier.service.ts
├── chat/
│   ├── chat.controller.ts
│   ├── chat.service.ts
│   ├── chat-context-builder.ts
│   ├── chat-history-summarizer.ts
│   └── chat-scope-resolver.ts
├── dto/
│   ├── create-session.dto.ts
│   ├── add-person.dto.ts
│   ├── analysis-result.dto.ts
│   ├── send-message.dto.ts
│   └── chat-thread.dto.ts
└── entities/
    ├── svc-session.entity.ts
    ├── svc-person.entity.ts
    ├── svc-result.entity.ts
    ├── svc-chat-thread.entity.ts
    └── svc-chat-message.entity.ts
```

---

## 13 · UI / FRONTEND SPEC (summary)

- Route: `/admin/startup-vibe`. Admin-guarded.
- Sidebar: new entry "Startup Vibe Check" under "Admin Tools."
- Dark theme matching Aatmabodha. Use existing primitives. Confirm distinguishing accent (proposed: deeper amber/gold).
- Screens: Sessions list → New/Edit session (3-step stepper) → Loading → Result view (with chat drawer right) → Result history.
- Session stepper: details → people (2–8, dynamic) → review & analyze.
- Loading: themed, cycling messages, minimum 8s visible.
- Result view sections in order: archetype hero → the_one_thing pull-quote → role recommendations grid → role collisions + uncovered roles → 10 dimensions (grouped Inherited 5 / Startup 5) → success pathways → disaster pathways → equity flags → hidden strengths + blind spots → dasha timing → re-run + export.

---

## 14 · DEPLOYMENT STATUS

- **Phase 1:** Code-complete on commit `1235c9b`. SQL migration `backend/migrations/20260425120000_svc_foundation.sql` is **pending** a manual run against the Neon production database (not executed by the deploy pipeline). Checklist: `docs/svc_prompts/PHASE_1_DEPLOYMENT_CHECKLIST.md`.
- **Rule:** Acceptance tests for any phase run **after** the corresponding migration has been applied to Neon **and** the backend is deployed to Render.

---

*END OF MASTER CONTEXT*
