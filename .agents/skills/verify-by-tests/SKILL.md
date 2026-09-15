---
name: verify-by-tests
description: "Use when the user asks to verify the repository is healthy or asks to run all tests and the build. Runs API unit tests, API e2e tests, web unit tests, web e2e tests, and a full build. Only answer with 'OK' once everything passes."
---

# Verify by Tests

Run the full verification suite and report a single-word result.

## Workflow

Run these commands in order, from the repository root unless noted otherwise. Stop and fix the underlying issue if any command fails; do not skip ahead.

1. Full build (from repository root): `npm run build`
2. Prepare the API test database (from `apps/api`): `npm run db:test:prepare`
3. API unit tests (from `apps/api`): `npm run test`
4. API e2e tests (from `apps/api`): `npm run test:e2e`
5. Web unit tests (from `apps/web`): `npm run test`
6. Web e2e tests (from repository root): `npm run test:e2e`

Use the execution subagent (or terminal) to run each command and inspect its output/exit code.

## Failure handling

- If any step fails, diagnose and fix the root cause (code, test, or config), then re-run that step and all subsequent steps from the beginning of the workflow.
- Do not report "OK" while any step is failing or skipped.
- If a failure cannot be resolved, report what failed and why instead of "OK".

## Response format

- If every step above passes, respond with exactly: `OK`
- Do not add extra commentary, summaries, or explanations when reporting success.
- If something fails and cannot be fixed, briefly explain which step failed and why.
