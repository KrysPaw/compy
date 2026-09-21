# Comparison templates

## Goal

Let users optionally pick a built-in template when creating a comparison so they get a ready set of criteria (and selective ranking rules) instead of entering everything manually.

## Scope

- Built-in catalog only: `phones`, `cars`, `hotels`, `laptops`
- Seeded at create time after the key criterion
- Criteria: name (locale-aware via web message catalogs), type, config, `is_comparable`
- Partial `ruleConfig` where a sensible default exists
- Weights always remain `0` until the user sets them on the Rules tab
- Blank remains the default; no apply-to-existing, no user-defined templates

## Contract

`CreateComparison` accepts optional:

- `templateId` — one of the catalog ids
- `templateCriteria` — resolved criterion payloads (required with `templateId`); names/options come from `apps/web/messages/{locale}.json` under `comparisonTemplates.*`, resolved on the web before POST

Catalog structure (keys, types, configs, ruleConfigs) lives in `@compy/shared` (`comparison-templates.ts`) and is validated at module load. API rejects `templateCriteria` that do not match the catalog shape.

## UX

Create dialog: name + template select (Blank + four templates) with a short description. After create, users add/remove criteria and adjust rules as today.

## Out of scope

- Save-as-template / user catalogs
- Seeding weights or entries
- Applying a template to an existing comparison
- Admin-managed or DB-backed templates
