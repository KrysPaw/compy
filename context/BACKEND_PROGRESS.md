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
- [x] Keep criterion creation owned by a single controller route.
- [x] Require the built-in name value when creating an entry.
- [x] Return `404 Not Found` when deleting a missing entry value.
- [x] Enable configurable CORS with the `WEB_ORIGIN` environment variable.
- [x] Add Supertest HTTP coverage for health, comparisons, validation, Swagger, and CORS.
- [x] Share application configuration between production bootstrap and HTTP tests.

## Current verification

- API tests: 42 passing.
- HTTP tests: 8 passing.
- Lint: passing.
- Root build: passing (`@compy/shared` followed by `@compy/api`).
- Swagger smoke test: `GET /docs-json` returned HTTP 200.

## Next backend follow-up

- [ ] Extend HTTP-level tests to criteria and entry CRUD/value routes.
- [ ] Add cascade-delete integration coverage against PostgreSQL.
- [ ] Add response schemas or DTO mapping if the frontend needs a stable public response shape.
- [ ] Document local database setup and required environment variables.

## Frontend handoff

The backend now exposes the core v1 data flow:

`Comparison -> Criteria -> Entries -> EntryValues`

The next product-facing step is the Next.js comparison table and its forms for criteria and entries.
