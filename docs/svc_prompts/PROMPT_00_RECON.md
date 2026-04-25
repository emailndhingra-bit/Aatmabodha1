# PHASE 0 — RECON

**STATUS (as of V1.0.1 spec revision): COMPLETED.** This file is preserved for reference. Findings and decisions have been folded into `STARTUP_VIBE_MASTER_CONTEXT.md` V1.0.1. If you are running Phase 1, skip directly to `PROMPT_01_FOUNDATION.md`.

---

**Goal:** Verify the codebase before touching anything. Answer 10 open questions. Report findings. **Do not modify any files.**

---

## STEP 1 — Confirm `STARTUP_VIBE_MASTER_CONTEXT.md` exists at repo root

If it does not exist, stop and tell me. I'll add it before we proceed.

If it exists, view it once. Pay special attention to §2 (architectural locks).

## STEP 2 — Aatmabodha context

1. View `AATMABODHA_MASTER_CONTEXT.md` (repo root). Pay attention to SESSION END STATE.
2. Run `git log --oneline -10`.
3. Run `git status`.

## STEP 3 — Codebase verification (5 specific checks)

Check 1 — **Admin auth middleware.** Find it. Tell me:
- Which file/decorator implements it.
- Does it support a role attribute (e.g. `@Roles('admin')`) or is "any logged-in user" considered admin?
- Where is it currently applied?

Check 2 — **Chart service contract.** Find the existing call to the Flask + Swiss Ephemeris chart service. Tell me:
- The endpoint URL pattern.
- Required input shape (date, time, place, lat/lon/tz?).
- Output shape — what does `chart_json` look like? Specifically: planets by sign + house, nakshatras, dashas (Maha + Antar), divisional charts.
- Behavior when TOB is missing — does it return a partial chart, error, or some flag like `time_unknown: true`?

Check 3 — **Gemini service.** Find the existing Gemini call pattern in NestJS backend. Tell me:
- File path of the service.
- How `cachedContents` is created and keyed.
- Current cache key naming convention used by Oracle.
- Confirm we can safely add a new cache namespace (`svc:` and `svc-chat:`) without collision.

Check 4 — **Oracle history-summarization pattern.** Find the file responsible for chat history rolling-summary. Tell me:
- File path.
- Current turn threshold N (after how many turns does summarization kick in?).
- The exact prompt used to generate the summary.
- Whether the Gemini model used for summarization is the same as the main chat model or a smaller one.

Check 5 — **Oracle streaming behavior.** Tell me whether Oracle streams assistant replies (SSE / WebSocket / chunked) or returns them as a single JSON response. Cite the file.

## STEP 4 — Open questions (answer where the codebase makes the answer obvious; flag the rest)

1. Admin auth granularity — fine-grained "tools" permission, or any admin = full access?
2. Accent color for admin tools — deeper amber/gold proposed; confirm or override.
3. TOB-missing degradation — match Oracle's current behavior. What is it?
4. PDF export — phase 3 or defer?
5. Industry list — propose: SaaS / D2C / Deeptech / Services / Healthcare / Fintech / Edtech / Other. Add or remove?
6. Stage list — Idea / MVP / Launched / Scaling / Mature. Confirm.
7. Inline analyst comments on result view — defer to v2?
8. Chat history summarization threshold — match Oracle's N. What is it?
9. Chat hypothetical mode — enable for v1? (Powerful but increases hallucination surface.)
10. Chat streaming — match Oracle's pattern. What is it?

## STEP 5 — Report

Reply with:

1. **Last commit hash + what it did.**
2. **Working tree state.**
3. **Answers to the 5 codebase checks.**
4. **Answers to the 10 open questions** (where the code answers them) plus the questions still needing my call.
5. **Concerns or surprises** — anything in the codebase that conflicts with the spec in `STARTUP_VIBE_MASTER_CONTEXT.md`.

**Then stop. Wait for my go-ahead before Phase 1.**

---

## RULES

- Do NOT modify any files in this phase.
- Do NOT run migrations.
- Do NOT install packages.
- Working dir: `C:\Users\iihpl08190\Downloads\aatmabodha (1)\`
- PowerShell does not support `&&`.
