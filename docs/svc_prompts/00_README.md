# Startup Vibe Check — Cursor Prompt Set

**Purpose:** Build the Startup Vibe Check admin module inside Aatmabodha across 5 sequential Cursor sessions, each ≤200 lines of prompt. Splits the original 1014-line spec so Cursor doesn't choke.

---

## How to use

### Step 1 — Drop the master context into the repo

Copy `STARTUP_VIBE_MASTER_CONTEXT.md` to the **root of the aatmabodha repo**, alongside `AATMABODHA_MASTER_CONTEXT.md`. Commit it:

```
git add STARTUP_VIBE_MASTER_CONTEXT.md
git commit -m "docs: add Startup Vibe Check master context"
```

This file is the canonical spec. Every per-phase prompt references it by filename. Cursor will `view` it on every prompt — same pattern as your Aatmabodha resume protocol.

### Step 2 — Run prompts in order

Paste each prompt into a fresh Cursor chat. **Do not skip ahead.** Each phase has a "report when done, wait for go-ahead" gate.

| # | File | Phase | Sprint estimate |
| --- | --- | --- | --- |
| 0 | `PROMPT_00_RECON.md` | Recon — read, verify, answer 10 open questions, no code | <1 day |
| 1 | `PROMPT_01_FOUNDATION.md` | DB, auth, sessions CRUD, add-people, chart fetcher | 1 sprint |
| 2 | `PROMPT_02_ANALYSIS.md` | System instruction, scaffold, Gemini, analyze endpoint, result view | 1 sprint |
| 3 | `PROMPT_03_CHAT.md` | Chat module — threads, scopes, drawer UI | 1 sprint |
| 4 | `PROMPT_04_POLISH.md` | History, audit, error handling, rate limits, docs | 0.5 sprint |

### Step 3 — Between phases

Read Cursor's report. If anything looks off, fix it before starting the next phase. The acceptance tests in each phase prompt are non-negotiable gates.

---

## Why this split

- **Each prompt fits comfortably in Cursor's working memory.** Largest is ~200 lines.
- **Single source of truth in the repo.** Master context can be edited once and all subsequent prompts reflect the change.
- **Mirrors your Aatmabodha resume protocol.** Cursor already knows this pattern from `AATMABODHA_MASTER_CONTEXT.md`.
- **Acceptance gates per phase.** Easy to back up and re-run a phase without unwinding everything.

---

## If Cursor hits the wall again

If even a single phase prompt is too much (most likely Phase 2 — analysis core), the next subdivision is:

- **Phase 2a:** System instruction + scaffold services + unit tests.
- **Phase 2b:** Gemini integration + `POST /analyze` + JSON validation.
- **Phase 2c:** Result view rendering + loading screen.

Same pattern works for Phase 2.5 if needed:

- **Phase 2.5a:** Chat system instruction + chat services + endpoints.
- **Phase 2.5b:** Frontend chat panel + scope chip + suggested prompts.

Master context doesn't change — only the phase prompts get sliced thinner.

---

## Architectural locks (worth re-reading every time)

From master context §2:

1. Don't touch Oracle.
2. Don't share Gemini cache namespace with Oracle. Use `svc:` and `svc-chat:`.
3. Don't expose any route without admin guard.
4. Bump `STARTUP_VIBE_RULES_VERSION` before any prompt edit.
5. PowerShell does not support `&&`.

---

## Open questions parked for Nitin's call

The recon phase will surface answers to most of these from the codebase. Two will need taste calls from you:

- **Accent color** — propose deeper amber/gold for admin tools.
- **Hypothetical chat mode** — enable in v1? Powerful for advisory work, increases hallucination surface.

Decide before Phase 1 (accent) and Phase 2.5 (hypothetical).
