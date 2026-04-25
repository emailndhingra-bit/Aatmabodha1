# PHASE 2 — ANALYSIS CORE

**Goal:** The system instruction, scaffold services, Gemini integration, `POST /analyze`, result view rendering. By end of phase: can analyse a 3-person team and see a complete result screen.

---

## PRE-FLIGHT

1. View `STARTUP_VIBE_MASTER_CONTEXT.md`. Re-read §5 (role taxonomy), §6 (dimensions), §7 (JSON contract), §8 (system instruction), §11 (acceptance tests A1–A7), §12 (module structure), §13 (UI).
2. Confirm Phase 1 is merged. Run `git log --oneline -10` and `git status`.
3. New branch: `feat/svc-analysis`.
4. **Bump `STARTUP_VIBE_RULES_VERSION` to `V1.0.0` if not already set.** This is the first version that does anything. From this phase onwards, every prompt edit requires a version bump before merge.

## DELIVERABLES

### 1. System instruction

`prompt/system-instruction.ts` — exports a `getSystemInstruction(version: string)` function. Build the prompt per §8 of master context. Inline §5 role taxonomy + §6 dimensions + §7 JSON contract verbatim into the prompt.

`prompt/system-instruction.version.ts` — exports `STARTUP_VIBE_RULES_VERSION` constant read from env, defaulting to `"V1.0.0"`.

`prompt/user-prompt-builder.ts` — exports a `buildUserPrompt(session, people, scaffold)` function. Output shape per §8 last code block of master context.

### 2. Scaffold services

`analysis/role-scorer.service.ts`:
- Method: `scorePerson(chartJson, industryContext): Record<RoleCode, number>`.
- Rule-based scoring per §5 planetary signatures. Each rule contributes points; total clamps to 0–100.
- Industry context modulates weights (e.g. Mercury-strong builder → +5 to BUILDER_CTO in Deeptech, +5 to BRAND_CMO in Healthcare-D2C).
- Returns deterministic scores. Unit-test with at least 3 fixture charts.

`analysis/dasha-classifier.service.ts`:
- Method: `classifyCurrentDasha(chartJson, asOfDate)`.
- Returns `{ mahadasha, antardasha, classification: "expansive"|"contractive"|"volatile"|"mixed", window_until }`.
- Classification rules: Jupiter / Venus / benefic Mercury → expansive. Saturn malefic, Ketu in 12th → contractive. Rahu, Mars in malefic placement → volatile. Otherwise mixed.
- Returns deterministic output. Unit-test with at least 3 fixtures.

Cross-chart yoga detector (inline in `startup-vibe.service.ts` for now, factor out later if it grows):
- Detects across all pairs in the team: Saturn-Rahu cross-aspect, 8th-house cross-activation, Jupiter on partner's Sun/Moon/Lagna, Ketu over partner's 11th, Venus-Jupiter cross-aspect, weak 7th house, Lakshmi/Dhana yoga combinations.
- Output: array of `{ kind, persons: [name, name], severity, basis }` objects.

### 3. Gemini integration

Extend the existing Gemini service (do not create a new one) with a method `runStartupVibeAnalysis(session, people, scaffold)`:
- Cache key: `svc:${STARTUP_VIBE_RULES_VERSION}:${teamChartHash}` where `teamChartHash` is a deterministic hash of the sorted `chart_json` digests + session industry + stage. Two analyses with the same team and same context hit the same cache entry.
- TTL: 30 days.
- Use `cachedContents` for the system instruction. The user prompt is per-request.
- Request JSON output mode.
- Validate response against zod (or class-validator) schema matching §7. On schema failure: retry once with a "your last response failed schema validation, return only valid JSON matching the contract" addendum. On second failure: throw.
- Return `{ result_json, generation_ms, cache_hit, tokens_in, tokens_out }`.

### 4. Analyze endpoint

`POST /admin/api/svc/sessions/:id/analyze`:

Flow per §10 of master context (was §10 in original; locate flow steps in master context §11 acceptance tests + §8):
1. Load session + people.
2. For each person without `chart_json`, call `chart-fetcher.service`.
3. Build scaffold: role scores per person + dasha classifications + cross-chart yogas.
4. Build user prompt.
5. Call `runStartupVibeAnalysis`.
6. Persist `svc_results` row with `result_json`, `rules_version`, `generation_ms`, `cache_hit`.
7. Return the persisted row.

Plus `GET /admin/api/svc/sessions/:id/results` — list past results for a session, paginated, ordered desc by `generated_at`.

Rate limit: 5 analyses per admin per hour. Header `X-RateLimit-*` set on responses.

### 5. Result view (frontend)

Render the result_json into the screens per §13 of master context. Order:

1. **Hero** — `team_archetype.name` + `tagline` + `two_sentence_read`. Big.
2. **The one thing** — `the_one_thing` as italic pull-quote.
3. **Role recommendations grid** — one card per person: name, top 2 roles with score-bars, role-preference match indicator (icon: ✓ strong / ~ weak / ✗ mismatch / — none), expandable drawer showing all 8 role scores.
4. **Role collisions + uncovered roles** — two compact panels side-by-side.
5. **10 dimensions** — visual bars, hover shows score + read. Sub-headers "Inherited (5)" and "Startup-specific (5)."
6. **Success pathways** — 3 cards, expandable, show `narrative` + `chart_basis` + `strategic_implication`.
7. **Disaster pathways** — 3 cards, expandable, visually distinct (border treatment, restrained, NOT garish red). Show `narrative` + `chart_basis` + `typical_timeline` + `mitigation`.
8. **Equity & trust flags** — list. Severity icon: 🚨 red / ⚠️ amber / 💡 yellow. Each: `title` + `chart_citation` + `mitigation`.
9. **Hidden strengths + Blind spots** — two columns.
10. **Dasha timing** — per-person mini-cards + collective state badge (green/amber/red) + launch-window callout if present + avoidance-window callout if present.
11. **Re-run analysis** button (creates new result row, keeps history). **Export to PDF** button is stubbed but disabled with "Phase 4" tooltip.

Step 3 of the New Session stepper now becomes functional — "Run analysis" button enabled.

### 6. Loading screen

When `POST /analyze` is in flight, show a themed loading screen (NOT a generic spinner). Cycles through messages:

- "Computing charts for {N} people..."
- "Reading dasha windows..."
- "Mapping role-fitness vectors..."
- "Detecting equity-trust patterns..."
- "Crossing partnership houses..."
- "Naming the team archetype..."

Minimum visible duration 8 seconds even if backend response is faster.

## ACCEPTANCE TESTS

Run §11 tests A1–A7 from master context:

- A1. Schema validation retry on missing field.
- A2. Cache hit on second call with same team + rules.
- A3. Rules version bump → cache miss → new analysis.
- A4. Role collision detection on synthetic team.
- A5. Uncovered role detection on synthetic team.
- A6. Disaster pathway grounding (each pathway cites ≥2 indicators present in input).
- A7. Voice constraints (`the_one_thing` exactly one sentence; no `dimensions[*].read` >3 sentences).

Plus integration:
- A8. End-to-end: from a session with 3 people, click "Run analysis" → see complete result screen with all 11 sections rendering.
- A9. Re-run analysis → new `svc_results` row, history view shows both.

## DO NOT (in this phase)

- Do not build chat. That's Phase 2.5.
- Do not implement PDF export. Stub only.
- Do not modify Oracle anything.
- Do not share Gemini cache namespace with Oracle. Cache key must start with `svc:`.
- Do not skip the `STARTUP_VIBE_RULES_VERSION` discipline — every prompt edit before merge requires a bump.

## REPORT WHEN DONE

Reply with:
1. Branch + commit hashes.
2. `STARTUP_VIBE_RULES_VERSION` final value.
3. Acceptance test results (A1–A9).
4. Token usage / cost estimate per analysis (run 2–3 real analyses on test teams to get a number).
5. Anything in the prompt that needs Nitin's voice/taste pass before Phase 2.5.

**Then stop. Wait for go-ahead before Phase 2.5 (chat).**
