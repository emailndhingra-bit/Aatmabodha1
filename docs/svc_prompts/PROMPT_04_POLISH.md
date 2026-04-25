# PHASE 3 — POLISH

**Goal:** Result history, audit logging, error handling, rate limit UX, accent finalization. Ship-readiness for internal use.

---

## PRE-FLIGHT

1. View `STARTUP_VIBE_MASTER_CONTEXT.md`. Re-read §10 (rate limits, audit), §11 acceptance tests P1–P4.
2. Confirm Phase 2.5 is merged.
3. New branch: `feat/svc-polish`.

## DELIVERABLES

### 1. Result history view

`/admin/startup-vibe/sessions/:id/results` route — list past results for a session, ordered desc by `generated_at`.

Each row shows: date, rules version, `team_archetype.name`, `dasha_timing.collective_state` badge, "View" + "New chat thread" actions.

From the result view, breadcrumb back to history.

### 2. Audit logging panel

`/admin/startup-vibe/usage` route — admin Usage panel.

Two tables side-by-side:

**Analysis log** — last 100 calls. Columns: timestamp, admin user, session label, rules version, generation_ms, cache_hit, tokens_in, tokens_out, estimated cost.

**Chat log** — last 100 messages. Columns: timestamp, admin user, thread title, scope, generation_ms, cache_hit, tokens_in, tokens_out, estimated cost.

Aggregate metrics at top: today's spend, this week's spend, 30-day spend.

If Aatmabodha already has an admin usage panel pattern, match it. Otherwise build from scratch in the same dark-theme primitives.

### 3. Error handling — full pass

Walk through every failure mode and verify graceful UX:

a. **Chart service timeout (>15s).** Person row created with `chart_status: "failed"`. Result view shows person card with "Chart fetch failed — retry" affordance. Retry button calls a new endpoint `POST /people/:id/refetch-chart`.

b. **Gemini timeout / API error during analyze.** Session state preserved. Error toast: "Analysis failed — retry available." Retry button re-runs without re-fetching charts (charts already cached on people rows).

c. **Schema validation failure twice in a row.** Returns 502 with descriptive error. Frontend shows: "The model returned malformed output twice. Please report to engineering with session ID {id}."

d. **Rate limit hit.** 429 response with `Retry-After` header. Frontend disables relevant button, shows countdown: "Rate limit reached. Try again in 14 minutes."

e. **Chat scope validation failure.** 400 response with field-level errors. Frontend highlights the offending field.

f. **Network failure mid-stream (chat).** Frontend shows partial reply + "Connection lost — regenerate?" affordance.

### 4. Rate limit middleware

If not already implemented in Phase 2/2.5, finalize now:
- 5 analyses per admin per hour (configurable via env).
- 30 chat messages per admin per hour (configurable via env).
- Use existing rate limit infrastructure if Aatmabodha has one. Otherwise simple in-memory bucket with a Redis upgrade path noted as TODO.
- Override flag `?force=true` on analyze endpoint, logged in audit.

### 5. Accent color finalization

If Phase 0 confirmed deeper amber/gold (or whatever Nitin chose), apply consistently across the module. If the accent is still TODO, ask Nitin now and apply before merge.

### 6. Loading-state cleanup

Any place that currently shows a generic spinner: replace with skeleton screens or themed loading. Never leave a generic spinner in this module.

### 7. Empty states

- No sessions yet → "Create your first team analysis" CTA.
- No people added yet on a session → "Add 2 to 8 people to begin" hint.
- No chat threads on a result → "Ask a follow-up question about this team" placeholder.
- No past results on a session → handled by hiding history view until first analysis.

### 8. Documentation

Add `backend/src/startup-vibe/README.md` covering:
- Module purpose (one paragraph).
- How to bump `STARTUP_VIBE_RULES_VERSION` and what triggers a bump (any prompt edit).
- Cache key conventions (`svc:` and `svc-chat:`).
- How to run scaffold unit tests.
- Known limits (TOB-missing degradation, max 8 people, no PDF export yet).

## ACCEPTANCE TESTS

§11 tests P1–P4 from master context:

- P1. Loading screen visible minimum 8 seconds even if response faster.
- P2. Result history shows all past results, ordered desc, navigable.
- P3. Chart service timeout → graceful UX, session state intact.
- P4. Rate limit triggered → 429 with retry-after, UI surfaces clearly.

Plus regression run of all earlier tests:
- F1–F6 (foundation).
- A1–A9 (analysis).
- C1–C12 (chat).

Nothing should have regressed.

## DO NOT (in this phase)

- Do not implement PDF export. Defer to Phase 4.
- Do not implement comparison view across past results. Defer.
- Do not implement bulk CSV import of people. Defer.
- Do not implement chat thread export. Defer.

## REPORT WHEN DONE

Reply with:
1. Branch + commit hashes.
2. All acceptance test results (foundation + analysis + chat + polish).
3. Total token cost burned during testing across all phases (rough estimate).
4. List of every file in `backend/src/startup-vibe/` (sanity check structure).
5. Anything still rough that you'd flag before sharing this with a portfolio company.

**Then stop. Phase 4 (PDF export, comparison view, etc.) is on-demand only.**
