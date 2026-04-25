# Phase 1 — Deployment checklist (SVC foundation)

Use this after code is merged and **before** or **with** the Render backend deploy that ships Phase 1. Replace `https://YOUR_PRODUCTION_API` with your live backend base URL (no trailing slash).

---

## 1. Migration (Neon)

### 1.1 Run SQL

1. Open the Neon project for **production**.
2. Open the **SQL Editor**.
3. Paste the full contents of `backend/migrations/20260425120000_svc_foundation.sql` from the repo commit you are deploying.
4. Execute the script once.

**Alternative:** from a machine with `psql` and network access to Neon:

```text
psql "YOUR_DATABASE_URL" -f backend/migrations/20260425120000_svc_foundation.sql
```

Use the same `DATABASE_URL` (or equivalent) that Render uses for the production service.

### 1.2 Verification queries

Expect **5** tables whose names start with `svc_`:

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'svc\_%' ESCAPE '\'
ORDER BY tablename;
```

Expected names: `svc_chat_messages`, `svc_chat_threads`, `svc_people`, `svc_results`, `svc_sessions`.

Expect **4** indexes whose names start with `idx_svc_`:

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_svc\_%' ESCAPE '\'
ORDER BY indexname;
```

Expected: `idx_svc_chat_msgs_thread`, `idx_svc_chat_threads_sess`, `idx_svc_people_session`, `idx_svc_results_session`.

---

## 2. Render — environment variables

Set or confirm on the **production** backend service:

| Variable | Value / notes |
| --- | --- |
| `STARTUP_VIBE_RULES_VERSION` | `V1.0.0` (bump when prompts/rules change; must match deployed rules discipline) |
| `ADMIN_EMAILS` | Already required — comma-separated allowlist for admin JWT users |
| `CHART_API_TIMEOUT_MS` | Optional — existing tuning for chart HTTP client; set if you rely on non-default timeouts |

Redeploy the backend after changing env vars so the new process picks them up.

---

## 3. Acceptance tests (F1–F6) — after deploy is live

Run these **only after** the Neon migration has been applied **and** the backend with Phase 1 is deployed to Render. Substitute `https://YOUR_PRODUCTION_API` below.

**F1 — Unauthenticated**

```text
curl -s -o NUL -w "%{http_code}" https://YOUR_PRODUCTION_API/api/admin/svc/sessions
```

Expect **401** (adjust `curl` flags on Unix: `-o /dev/null`).

**F2 — Authenticated non-admin**

`GET https://YOUR_PRODUCTION_API/api/admin/svc/sessions` with a valid **non-admin** JWT (user email not in `ADMIN_EMAILS`). Expect **403**.

**F3 — Team size validation**

- Create/update session people so **1** person is submitted where the API expects 2–8 → **400**.
- **9** people → **400**.
- **2–8** people → **200** on successful add flow (exact endpoints per `STARTUP_VIBE_MASTER_CONTEXT.md` §4).

**F4 — TOB required**

Person **without** TOB at submit → **400** (TOB locked mandatory V1.0.1; see `docs/svc_prompts/PROMPT_01_FOUNDATION.md`).

**F5 — POB resolution**

Place of birth that cannot resolve to lat/lon/tz → **400** at submit time.

**F6 — Frontend smoke**

Admin user opens `/admin/startup-vibe`, creates a session, adds **3** people, sees all three in the UI. Browser devtools: API calls go to `/api/admin/svc/...` and succeed only when authenticated as admin.

---

## 4. Rollback (emergency)

If Phase 1 must be reverted **before** meaningful production data exists, you can drop the SVC tables. **This deletes all SVC sessions, people, results, and chat data.**

Run in Neon SQL editor (or `psql`), in this order (respects foreign keys):

```sql
DROP TABLE IF EXISTS svc_chat_messages CASCADE;
DROP TABLE IF EXISTS svc_chat_threads CASCADE;
DROP TABLE IF EXISTS svc_results CASCADE;
DROP TABLE IF EXISTS svc_people CASCADE;
DROP TABLE IF EXISTS svc_sessions CASCADE;
```

Then deploy a backend build **without** Phase 1 SVC code paths, or leave tables absent until you re-run the migration.

---

*Cross-reference: `STARTUP_VIBE_MASTER_CONTEXT.md` §11 (F1–F6), §14 (deployment status).*
