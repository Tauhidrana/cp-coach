# Smart AI Daily Sheet

Rebuild the Daily Sheet as an adaptive, multi-platform, mentor-style recommender. The current sheet is Codeforces-only with random-ish picks; this replaces it end-to-end.

## What changes

### 1. New server function: `generateSmartSheet`

Replaces `generateSheet`. Inputs: `size` (5 / 10 / 15) and optional `language` (en/bn).

Pipeline:

1. **Load context** — pull all connected platforms via `user_platforms`, fetch CF submissions + problemset (cached), read last 7 `daily_sheet_completions` for adaptive signal.
2. **Determine effective rating tier** — use CF rating if present, else derive a normalized rating from LeetCode/CodeChef. Map to tier: Beginner (0-999) / Pupil (1000-1199) / Specialist (1200-1399) / Expert (1400-1699) / CM (1700+).
3. **Difficulty mix** — per tier, compute easy/medium/hard split exactly as spec (e.g. Specialist 30/50/20).
4. **Adaptive offset** — last 3 days completion rate ≥80% → +50 rating shift; ≤30% → −50 shift.
5. **Topic selection** — 70% weak (lowest-score tags), 20% revision (strong tags last seen >7d ago), 10% challenge (random advanced tag).
6. **Platform distribution** — default 5: 2 CF + 2 CodeChef + 1 LeetCode. For 10 / 15 scale proportionally. Skip platforms not connected and redistribute.
7. **Problem pools**:
   - **Codeforces**: real `problemset.problems` filtered by rating bucket and tag.
   - **CodeChef**: curated static list (`src/lib/sheet/codechef-pool.ts`) of ~120 well-known practice problems tagged by difficulty band (800-1000 / 1100-1400 / 1500-1800 / 1900+) and topic. Each entry: `{ code, name, url, rating, tags }`.
   - **LeetCode**: curated static list (`src/lib/sheet/leetcode-pool.ts`) of ~150 top problems by difficulty (Easy/Medium/Hard) and topic.
   - All pools exclude already-solved sets (CF solved set from submissions; CC/LC tracked in a new `solved_problems` table — see §3).
8. **AI rationale** — single Gemini call returns JSON array `{ id, reasonEn, reasonBn }` for all picks at once (1 request, not N). Uses user's weak/strong topics + each problem's tags/rating for grounding. Cached per (userId, date, size).
9. **Output shape**:
   ```ts
   {
     date: string,
     tier: "Beginner" | ... ,
     adaptiveShift: number,
     estimatedMinutes: number,    // sum(per-problem est)
     focusTopics: string[],
     distribution: { easy:n, medium:n, hard:n },
     platformBreakdown: { codeforces:n, codechef:n, leetcode:n },
     items: Array<{
       platform, title, url, rating, difficulty, tags,
       weak: boolean, estMinutes, reasonEn, reasonBn
     }>,
     weeklyPlan: Array<{ day, focus }>,
     ratingGoal: { current, target, problemsRemaining, etaWeeks } | null
   }
   ```

### 2. Adaptive + weekly plan + rating goal helpers

- `weeklyPlan` is computed locally (deterministic by day-of-week per spec: Mon Greedy, Tue Binary Search+Math, …, Sun Revision).
- `ratingGoal` uses `profiles.target_rating` and a heuristic (≈40 quality problems per 100 rating points, scaled by current vs target gap).

### 3. New table: `solved_problems`

Tracks problems marked solved on non-CF platforms (CF auto-solved via submissions).
Columns: `user_id`, `platform`, `problem_key` (unique per-platform id, e.g. CC code or LC slug), `solved_at`. RLS own-rows.

The Daily Sheet UI gets a per-problem ✓ checkbox that calls `markProblemSolved`. CF problems read from the live submissions cache; no manual marking needed.

### 4. UI overhaul (`src/routes/_authenticated/sheet.tsx`)

- **Today's Goal hero card** — tier badge, estimated time, focus topics, platform distribution chips, adaptive-shift indicator ("difficulty +50 — you crushed yesterday").
- **Grouped sections** by platform with brand-colored headers and platform logos.
- **Problem card** — title, rating chip, difficulty (easy/medium/hard color), tags, est-time, ✓ mark solved, expand for AI rationale (EN/BN toggle).
- **Weekly Plan strip** — 7 day chips with focus, today highlighted.
- **Rating Goal card** — current → target progress bar with ETA.
- Skeletons for all sections; framer-motion stagger preserved.

### 5. Cleanup

- Remove old `generateSheet` once `sheet.tsx` no longer imports it; keep `mark complete` flow (still useful to silence reminders, and is auto-triggered when all items checked).

## Technical notes

- Curated pools live in `src/lib/sheet/` as pure TS arrays — no scraping at request time, keeps response <500ms.
- Single AI call for all rationales using `Output.array` schema with bounded enum-free strings to avoid Gemini state-machine limits.
- Deterministic shuffle (mulberry32 with `userId+date` seed) so the same day always shows the same sheet (until user toggles size).
- All new server work in `src/lib/cp.functions.ts` (no new route boundary needed).
- Migration adds `solved_problems` with GRANTs + RLS following project conventions.

## Out of scope (explicit)

- AtCoder / HackerRank inclusion in the sheet (kept analytics-only this pass — they have no clean rating-tagged problem pool).
- Virtual contest scheduling for Saturday (weekly plan shows the label only).

Approve and I'll ship it.
