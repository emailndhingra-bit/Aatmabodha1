# PHASE 1 — FOUNDATION

**Goal:** Database, auth, sessions CRUD, add-people flow, chart fetching. No Gemini, no analysis, no chat yet.

---

## PRE-FLIGHT

1. View `STARTUP_VIBE_MASTER_CONTEXT.md`. Re-read §2 (architectural locks), §3 (data model), §4 (API surface), §12 (module structure).
2. Confirm Phase 0 recon was completed. If you don't have notes from it in your context, tell me — I'll re-run recon.
3. Run `git status`. Working tree must be clean before starting.
4. Create a new branch: `feat/svc-foundation`.

## DELIVERABLES

### 1. Database migrations

Create a new migration adding the 5 tables from §3 of master context:
- `svc_sessions`
- `svc_people`
- `svc_results`
- `svc_chat_threads`
- `svc_chat_messages`

Plus the 4 indexes. Use the SQL in §3 verbatim.

Run the migration locally. Verify tables exist via `\dt svc_*` or equivalent.

### 2. NestJS module skeleton

Create `apps/backend/src/startup-vibe/` with structure from §12 of master context. **Only create the files needed for Phase 1:**

- `startup-vibe.module.ts`
- `startup-vibe.controller.ts`
- `startup-vibe.service.ts`
- `dto/create-session.dto.ts`
- `dto/add-person.dto.ts`
- `entities/svc-session.entity.ts`
- `entities/svc-person.entity.ts`
- `entities/svc-result.entity.ts` (entity only, no logic yet)
- `entities/svc-chat-thread.entity.ts` (entity only, no logic yet)
- `entities/svc-chat-message.entity.ts` (entity only, no logic yet)
- `analysis/chart-fetcher.service.ts`

Wire the module into the root `AppModule`.

### 3. Admin auth guard

Apply existing admin auth middleware to **every** route on the new controller. Use the exact decorator/guard you found in Phase 0 recon. Verify by manually testing one endpoint with no auth → 401, non-admin auth → 403.

### 4. Endpoints (Phase 1 subset)

Implement these and only these:

```
POST   /admin/api/svc/sessions
GET    /admin/api/svc/sessions
GET    /admin/api/svc/sessions/:id
POST   /admin/api/svc/sessions/:id/people
DELETE /admin/api/svc/sessions/:id/people/:personId
DELETE /admin/api/svc/sessions/:id
```

Validation per §3 schema. Use class-validator on DTOs.

Constraints:
- Min 2, max 8 people per session (enforced server-side).
- DOB required, TOB optional.
- POB requires `pob_city`; if `pob_lat`/`pob_lon`/`pob_tz` not provided, attempt resolution server-side (use existing geocoding util if Aatmabodha has one — flag if it doesn't and we'll decide whether to add one).

### 5. Chart fetcher service

`analysis/chart-fetcher.service.ts`:
- Method: `fetchChartForPerson(person: SvcPerson): Promise<ChartJson>`.
- Calls the existing Flask chart service using the contract you documented in Phase 0 recon.
- On success, stores `chart_json` on the `svc_people` row.
- On TOB missing, calls service with the documented degraded mode and stores result.
- On chart service timeout (>15s), throws a typed error the controller can map to a clear UI message.

`POST /sessions/:id/people` should call this synchronously before returning. If chart fetch fails, the person row is still created (so the user can retry) but `chart_json` is null and the response includes a `chart_status: "failed"` flag.

### 6. Frontend — Sessions list + New session screens

Route: `/admin/startup-vibe`. Admin-guarded.

Screens for Phase 1:
- **Sessions list** — table view (label, industry, stage, team_size, last_analysed=null for now, actions). "New session" CTA. Empty state.
- **New / Edit session** — 3-step stepper from §13 of master context, but **stop at step 2 (people)**. Step 3 (Review & analyze) renders a disabled "Run analysis" button with tooltip "Available in Phase 2."

Use existing dark-theme primitives. Don't introduce new component libraries. Confirm accent color choice from Phase 0 before finalising — if not yet confirmed, use the existing primary accent and leave a TODO.

Sidebar: add "Startup Vibe Check" entry under "Admin Tools" (create the section if it doesn't exist).

## ACCEPTANCE TESTS

Run all of these. They are F1–F5 from §11 of master context:

- F1. Unauthenticated `GET /admin/api/svc/sessions` → 401.
- F2. Authenticated non-admin → 403.
- F3. Submit 1 person → 400. 9 → 400. 2–8 → 200.
- F4. Person without TOB → row created, chart fetch succeeds with degraded mode, `chart_json.time_unknown` flag set.
- F5. POB with no resolvable lat/lon/tz → 400 at submit.

Plus:
- F6 (foundation-specific). Frontend can create a session, add 3 people, see them all in the list. Browser dev tools show the API calls go through the admin guard.

## DO NOT (in this phase)

- Do not call Gemini. No analysis logic.
- Do not create the chat tables' service files (`chat/*.ts`). Entities only, no logic.
- Do not write the system instruction. That's Phase 2.
- Do not bump `STARTUP_VIBE_RULES_VERSION` — there's nothing to version yet. Add the env var to `.env.example` with value `V1.0.0` but do not read it anywhere yet.
- Do not modify Oracle anything.

## REPORT WHEN DONE

Reply with:
1. Branch name + commit hashes (one or several).
2. Migration filename.
3. Acceptance test results (F1–F6, pass/fail with notes).
4. Anything that surprised you or didn't match the spec.
5. Open questions for Phase 2.

**Then stop. Wait for my go-ahead before Phase 2.**
