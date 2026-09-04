# Backend progress

## Completed

- [x] CRUD Entry and EntryValue.
- [x] Validate `number`, `rating` bounds, and `enum` options.
- [x] Enforce payload type matches the persisted criterion type.
- [x] Add comparison rename endpoint: `PATCH /comparisons/:id`.
- [x] Add comparison delete endpoint: `DELETE /comparisons/:id`.
- [x] Use the shared `EntryValueUpsertSchema` from `@compy/shared`.
- [x] Return `404 Not Found` when updating a missing criterion.
- [x] Add regression tests for the changes.
- [x] Build `@compy/shared` before `@compy/api` in the root build script.
- [x] Add Swagger UI at `/docs` and OpenAPI JSON at `/docs-json`.

## Current verification

- API tests: 41 passing.
- Lint: passing.
- Root build: passing (`@compy/shared` followed by `@compy/api`).
- Swagger smoke test: `GET /docs-json` returned HTTP 200.

## Next backend follow-up

- [ ] Add HTTP-level tests for comparison, criterion, and entry routes.
- [ ] Add cascade-delete integration coverage against PostgreSQL.
- [ ] Add response schemas or DTO mapping if the frontend needs a stable public response shape.
- [ ] Document local database setup and required environment variables.

## Frontend handoff

The backend now exposes the core v1 data flow:

`Comparison -> Criteria -> Entries -> EntryValues`

The next product-facing step is the Next.js comparison table and its forms for criteria and entries.
