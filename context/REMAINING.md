# Remaining requirements

Open gaps relative to `PROJECT.md` and the Rules/ranking feature plans. Items already shipped (Rules tab, pairwise weights, enum rule editor, i18n, Results scoring, comparison rename) are intentionally omitted.

## Product gaps

### Incomplete-data warning on Results

From `features/rules_and_weights.md` §9 and `RULES_TAB_FEATURE.md`:

- Comparison-level banner when comparable criteria with weight > 0 have missing entry values (e.g. “Incomplete data may distort ranking”)
- Row-level indicators for incomplete entries
- Warning text should name affected criteria and their weights
- Scoring already treats missing values as neutral `0.5`; the warning makes that visible

### Home empty / landing state

- Replace placeholder muted boxes on the app home page with a clear empty state and CTA to create a comparison

## Quality / portfolio gaps (v1 success criteria)

### Playwright e2e

- At least one flow: create comparison → add criterion/entry values → sort by column header
- Prefer role/label selectors; cover delete confirmations if practical
- Wire a real `test:e2e` script (root currently points at a missing web Playwright setup)

### Monorepo README

- Root README: how to run Postgres (Docker), API, web, env vars (`DATABASE_URL`, `NEXT_PUBLIC_API_URL`, `WEB_ORIGIN`)
- Replace or supersede the default create-next-app `apps/web/README.md` story

## Explicit later backlog (unchanged)

These were never v1 must-haves; keep as backlog unless prioritized:

| Theme        | Notes                                              |
| ------------ | -------------------------------------------------- |
| Hosting      | Vercel (Next.js) + Railway (NestJS + PostgreSQL)   |
| Auth         | Accounts / ownership                               |
| Sharing      | Shareable view/edit links                          |
| Collaboration| Multi-user on one comparison                       |
| Views        | Cards and layouts beyond the table                 |
| Demo hygiene | Seed data, reset, or light protection if abused    |

## Optional / low priority

- Prefer documenting that validation uses a custom `ZodValidationPipe` + `@compy/shared`, or migrate to `nestjs-zod` as originally written in `PROJECT.md`
- Backend follow-ups from `BACKEND_PROGRESS.md`: HTTP coverage for criteria/entries, cascade-delete integration tests against PostgreSQL
- Criterion create UI still narrows identity → text and comparable → number/boolean/rating/enum (no comparable text / typed identity); expand only if product wants full matrix from `PROJECT.md`

---

_Last reviewed against the codebase gap analysis (2026-09-14)._
