# PHASE 2.5 — CHAT MODULE

**Goal:** Follow-up Q&A grounded in a specific analysis. Analyst-to-analyst voice. Scope per message: team / subset / individual / hypothetical. By end of phase: can ask "Why does Priya rank low on CEO?" on a result screen and get a chart-grounded answer in <8 seconds.

---

## PRE-FLIGHT

1. View `STARTUP_VIBE_MASTER_CONTEXT.md`. Re-read §9 (chat module) thoroughly + §11 acceptance tests C1–C12.
2. Confirm Phase 2 is merged. `git status` clean.
3. New branch: `feat/svc-chat`.
4. **Phase 0 recon answers locked into spec V1.0.1 (re-read master context §9.4):**
   - Oracle does NOT use LLM summarization. Deterministic regex compaction over `history.slice(-6)`.
   - Oracle does NOT stream. Single `generateContent` POST.
   - Match both exactly. Zero new Gemini calls beyond the per-message generation.

## DELIVERABLES

### 1. Chat system instruction

`prompt/chat-system-instruction.ts` — exports `buildChatSystemInstruction(session, people, scaffold, resultJson, version)`.

The function returns the full prompt per §9.5 of master context, with all team data inlined. This is what gets cached per (rules_version, result_id) tuple.

**Critical:** voice rules are non-negotiable. The prompt MUST forbid:
- "great question," "as an AI," "hope this helps"
- exclamation points
- emoji
- closing pleasantries
- section headers unless user explicitly asks for structure

If you find yourself softening any of these to feel more "polite," stop. The whole point of this voice is that it is NOT Oracle.

### 2. Chat services

`chat/chat-context-builder.ts`:
- Method: `buildOrFetchCachedInstruction(threadId)`.
- Resolves thread → result → session → people → scaffold.
- Cache key: `svc-chat:${rules_version}:${result_id}`.
- TTL: 30 days.
- Returns the cached content reference for use in the per-turn Gemini call.

`chat/chat-history-summarizer.ts`:
- **Match Oracle's `buildHistorySummary()` in `backend/src/gemini/gemini.service.ts` exactly.** No LLM calls.
- Take `history.slice(-6)`. Run the same regex set Oracle uses (reference tags, % predictions, veto-like phrases, trailing questions). If anything matches, build a `[Prior conversation summary] ... [End summary]` block (max 1500 chars) and prepend to the user turn. If nothing matches, prepend nothing.
- Reuse Oracle's helper if it can be made generic; otherwise copy the exact regex set with a comment citing the source line in `gemini.service.ts`.
- The `svc_chat_threads.summary` column stays in the schema for forward compatibility but is **not written by V1**. Leave it null.

`chat/chat-scope-resolver.ts`:
- Method: `formatScopeForPrompt(scopeKind, scopePersonIds, hypotheticalNote, people)`.
- Returns the scope marker block for the user prompt envelope per §9.6 of master context.
- Validates: SUBSET requires ≥1 person ID belonging to the session. HYPOTHETICAL requires non-empty `hypothetical_note`.

`chat/chat.service.ts`:
- Method: `sendMessage(threadId, content, scopeKind, scopePersonIds?, hypotheticalNote?)`.
- Flow:
  1. Load thread + recent N message history.
  2. Validate scope.
  3. Resolve scope into prompt envelope.
  4. Get cached instruction reference from `chat-context-builder`.
  5. Build user message: scope marker + user content + summary (if exists) + recent N turns.
  6. Call Gemini with cached instruction + this user message. Match Oracle's streaming pattern (from Phase 0 recon Check 5).
  7. On response: persist user message + assistant message rows. Update `message_count`, `last_message_at`.
  8. Run voice-constraint regex check on assistant content. If "great question" / "as an AI" / "hope this helps" appears → log warning (do not fail the request).
  9. Call `maybeUpdateSummary`.
  10. Return assistant message.

### 3. Chat endpoints

```
POST   /api/admin/svc/sessions/:id/chat/threads          # create thread, anchored to latest result by default
GET    /api/admin/svc/sessions/:id/chat/threads          # list threads on session
GET    /api/admin/svc/chat/threads/:threadId             # fetch thread + all messages
POST   /api/admin/svc/chat/threads/:threadId/messages    # send message, return/stream reply
DELETE /api/admin/svc/chat/threads/:threadId
POST   /api/admin/svc/chat/threads/:threadId/regenerate  # regenerate last assistant message
```

Admin auth on all routes. Rate limit: 30 messages per admin per hour, separate from analysis rate limit.

POST messages should match Oracle's streaming pattern. If Oracle uses SSE, this uses SSE. If Oracle returns a single JSON response, this does too.

### 4. Frontend chat panel

Lives **inside the result view as a right-side drawer** per §9.7 of master context. Layout:
- Result view shrinks to left 60–65% when chat drawer is open.
- Drawer toggle button in result view header.
- On narrow screens (<1024px width), drawer becomes full-screen overlay.

Chat panel layout (top to bottom):
1. **Thread header** — auto-generated title (editable on hover), thread switcher dropdown, "New thread" button.
2. **Anchored-result indicator** — small label: "Anchored to analysis from {date}, rules {version}." If newer analysis exists on this session, subtle "newer analysis available — start fresh thread?" prompt.
3. **Message list** — scrollable, sticky-bottom. User right-aligned, assistant left. Markdown-rendered (lists, bold, code) but no images.
4. **Scope chip + input box at bottom.** Chip clickable → popover for changing scope. Multi-line textarea. Cmd/Ctrl-Enter to send.
5. **Suggested prompts** on a fresh thread — three context-aware chips:
   - "Why does {top-collision-person} score so close to {other-person} on CEO?"
   - "Walk me through disaster pathway 2 in detail."
   - "What's the strongest synergy nobody on this team has noticed?"

Suggested prompts after each assistant reply: defer to Phase 4 if budget tight. Ship without them in v1 if needed.

Hover affordances on assistant messages: copy button. Skip "show reasoning" expander — defer to v2.

## ACCEPTANCE TESTS

Run §11 tests C1–C12 from master context:

- C1. Thread creation without `result_id` → anchors to latest result.
- C2. "Why does Priya rank low on CEO?" → reply cites ≥1 specific chart indicator from Priya's chart present in input.
- C3. Subset scope → reply does not introduce a third founder unless directly relevant.
- C4. Individual scope → reply stays focused.
- C5. Hypothetical → reasons structurally without inventing a person; projects directional dimension changes.
- C6. Missing-person guard → states plainly, does not invent.
- C7. Cache hit on messages 2, 3.
- C8. Summarization: when `history.slice(-6)` contains a turn with reference tags / % predictions / veto phrases / trailing questions, the user prompt sent to Gemini contains a `[Prior conversation summary]` block. When none of those patterns match, no summary block is prepended. `svc_chat_threads.summary` column remains null in V1.
- C9. Rules version bump → existing thread readable; new message rebuilds cache.
- C10. Voice constraint regex check passes (no banned phrases in any assistant message during test run).
- C11. Auth: 401 / 403 as expected.
- C12. Scope validation: SUBSET with foreign person ID → 400.

## DO NOT (in this phase)

- Do not modify Oracle's chat code or summarization service.
- Do not share Gemini cache namespace with Oracle. Cache key must start with `svc-chat:`.
- Do not let chat trigger a re-analysis. Chat is read-only on `svc_results`.
- Do not soften the voice rules. If Cursor wants to add "I'd be happy to help you think through this..." to make replies feel friendlier, push back. The audience is an analyst.
- Do not add content moderation beyond what's in §9.5 (no romantic predictions, no legal/tax/equity-percentage advice). The user is admin; trust them.

## REPORT WHEN DONE

Reply with:
1. Branch + commit hashes.
2. `STARTUP_VIBE_RULES_VERSION` final value (bumped if chat prompt changed analysis prompt's version namespace? — should be no, but confirm).
3. Acceptance test results (C1–C12).
4. Token cost per chat turn (run 5–10 real turns on a test thread to get a number).
5. Side-by-side comparison: pick one question and run it through Oracle vs Startup Vibe Chat with the same chart data. Confirm voice is distinctly more direct/forensic in Startup Vibe Chat.
6. Any voice drift you noticed during testing — places where the model wanted to be friendly and you had to push back in the prompt.

**Then stop. Wait for go-ahead before Phase 3.**
