# Compy — Project Document

## 1. Overview

**Compy** is a web app for comparing anything in a free-form way: phones, electronics, job offers, hotels, and similar decisions. Users create a **comparison** (a group of things), define **criteria**, add **entries** with values for those criteria, and compare by viewing and sorting a table.

This is primarily a **portfolio / learning project**: clear product thinking, a full-stack TypeScript stack, and a deployable demo. It is not aimed at production multi-tenant SaaS in v1.

**Working name:** Compy

---

## 2. Goals

### Product goals (v1)

- Let one person run useful free-form comparisons in a spreadsheet-like table.
- Support flexible criteria types so real decisions (price, distance, “has balcony”, rating, brand) fit; optional built-in templates can seed a starting set.
- Make comparison usable via **single-column sort** from column headers.

### Learning / portfolio goals

- Practice a monorepo with **Next.js** (UI) + **NestJS** (API) + **Prisma** + **PostgreSQL**.
- Share contracts via **Zod** schemas and a **`packages/shared`** package from day one.
- Ship automated UI coverage with **Playwright**.
- Keep the app easy to run locally and later host as a public demo (empty start, no auth).

### Non-goals (v1)

- User accounts, signup, or multi-tenancy
- Sharing links or permissions
- Real-time multi-user collaboration
- Weighted “best overall” scores
- Multiple view modes (cards, etc.)
- Mobile-native apps
- Seeded demo datasets

---

## 3. Users & access

| Aspect        | v1 decision                                                 |
| ------------- | ----------------------------------------------------------- |
| Who           | Single-user / single instance (whoever has the URL)         |
| Auth          | **None** — open app                                         |
| Privacy       | Data is effectively instance-private; no public share links |
| Hosted demo   | Starts **empty**; visitors can create and edit freely       |
| Collaboration | Not in v1 (planned later: e.g. friends picking a trip stay) |

**Implication:** A public demo can be wiped or filled with junk. Acceptable for portfolio; optional Basic Auth or reset tooling can be added later if needed.

---

## 4. Core concepts

```
Comparison
  └── Criteria (columns)
        ├── is_comparable: false
        │     ├── built-in criterion: is_key = true (always present, not removable)
        │     └── custom: e.g. Offer URL, Source, …
        └── is_comparable: true   e.g. Price, Distance, Rating
  └── Entries (rows)
        └── Values             cell at entry × criterion (including name)
```

- **Comparison** — Named container for one decision (e.g. “Lisbon hotels”, “Junior backend offers”).
- **Criterion** — User-defined (or system) attribute with a **type**, an `is_comparable` flag, an `is_key` flag, and a display name. Becomes a table column. The business roles remain identity (`is_comparable: false`) and comparable (`is_comparable: true`).
- **Built-in identity criterion** — Every comparison has exactly one built-in criterion with `is_key: true`. It is created with the comparison, **cannot be deleted**, and is the canonical row label. Its initial display name is **"Name"** (or **"Nazwa"** in Polish), but the display name may be changed; `is_key`, not the name, identifies it.
- **Entry** — One thing being compared. Becomes a table row. No separate `name` column on `Entry` itself — the display name lives as a **value** of the built-in criterion (`is_key: true`) (keeps one values model). Alternative at implementation: denormalize `Entry.name` synced with that criterion; prefer single values model unless UX requires otherwise.
- **Value** — The datum for one entry on one criterion. Hard-deleted if a **removable** criterion or entry is deleted. Deleting an entry removes its name value with it.

Users may start from an optional **built-in comparison template** (electronics / vehicles / travel categories: phones, laptops, tablets, headphones, TVs, cars, bikes, e-scooters, hotels, flights, short stays) at create time, which seeds criteria and selective `ruleConfig` (not weights). Blank create remains the default. Users may add more identity criteria (URL, source, …) and any comparable criteria after create.

### 4.1 Criterion roles

| `is_comparable` | Purpose                                                                                            | UX (v1)                                                                                                                                                |
| --------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **false**       | Who/what is this row? Built-in criterion plus optional custom fields (offer URL, source, notes, …) | Built-in criterion pinned first; other identity columns follow; render URLs as links when applicable; sort allowed but not the primary “compare” story |
| **true**        | Facts used to decide                                                                               | Normal columns; header click sorts                                                                                                                     |

Same criterion **types** (number, text, boolean, rating, enum) apply to both values of `is_comparable`, except the built-in criterion is always **text** + `is_comparable: false`.

**Rules for the built-in criterion:**

- Created automatically with each comparison
- Initially named `name`; the display name may be changed by the user
- Identified exclusively by `is_key: true`
- **Cannot be removed** or change `is_comparable`/type
- Required value when creating/updating an entry? _(see open decisions — recommendation: required non-empty)_
- Additional identity criteria: user-defined, removable, hard-delete values on remove

**Row label:** always the value belonging to the built-in criterion (`is_key: true`) (fallback “Untitled entry” only if empty values are allowed).

---

## 5. Criterion types (v1)

| Type        | Example                             | Notes                         |
| ----------- | ----------------------------------- | ----------------------------- |
| **number**  | Price, distance, storage GB         | Numeric compare / sort        |
| **text**    | Brand, city, notes                  | Free text; lexicographic sort |
| **boolean** | Has balcony, remote OK              | Yes/no                        |
| **rating**  | 1–5 (or fixed scale)                | Numeric-like sort             |
| **enum**    | Contract type: B2B / UoP / contract | User-defined option list      |

Exact UX for defining enum options and rating scale bounds should follow a simple, consistent form (see §8). Every criterion has `is_comparable` — see §4.1. The built-in criterion is always text + `is_comparable: false` and is identified by `is_key: true`.

---

## 6. Feature scope

### 6.1 v1 — Must have

**Comparisons**

- Create, rename, delete a comparison
- List all comparisons
- Open one comparison into its table

**Criteria**

- Each new comparison is created with a built-in identity criterion **`Name`** (text, not removable)
- Add custom criterion (**name + type + `is_comparable`**; enum options / rating bounds as needed)
- Edit criterion (name for custom criteria only; type/`is_comparable` locked after create — see open decisions)
- Delete **custom** criterion → **hard-delete** its values; **cannot delete** the criterion with `is_key: true`
- Users may add further identity fields (e.g. offer link) as custom identity criteria

**Entries**

- Add entry (must supply **name** value for the built-in criterion if required; other values optional/partial as allowed)
- Edit entry values (including name)
- Delete entry → **hard-delete** its values

**Comparison (table)**

- Spreadsheet-like **table**: rows = entries, columns = criteria (built-in criterion + custom identity + comparable)
- Built-in criterion (`is_key: true`) column first/pinned; other identity columns grouped with it
- **Sort by one column** via column header click (asc/desc toggle)
- No multi-column sort, filters, or weighted scores in v1

**Persistence**

- All comparisons, criteria, entries, and values stored in PostgreSQL via Prisma

### 6.2 Later — Explicit backlog

| Theme           | Ideas                                                         |
| --------------- | ------------------------------------------------------------- |
| Sharing         | Private by default; shareable links (view / edit)             |
| Collaboration   | Multiple people on one comparison (e.g. trip planning)        |
| Ranking         | User-defined **weighted score** / “best overall”              |
| Views           | Cards and other layouts beyond the table                      |
| Auth / accounts | Real multi-user ownership                                     |
| i18n            | English + Polish UI chrome; cookie + switcher (see [`features/i18n.md`](features/i18n.md)) |
| Hosting         | **Vercel** (Next.js) + **Railway** (NestJS + PostgreSQL)      |
| Demo hygiene    | Seed data, reset button, or light protection if abuse appears |

---

## 7. User flows (v1)

1. **Start a comparison**  
   User creates a comparison (built-in **Name** column already present) → adds more identity/comparable criteria as needed → adds entries (with names) → sorts by a comparable column to decide.

2. **Refine**  
   User edits values, renames things, adds/removes criteria or entries; removed criteria/entries wipe related values.

3. **Return later**  
   User opens the app, sees the list of comparisons, opens one, continues editing/sorting.

No onboarding wizard required for v1; empty states with clear CTAs are enough.

---

## 8. UX guidelines (v1)

- **Primary UI:** table inside a comparison.
- **Density:** comfortable for ~3–50 rows; no virtualization required for v1.
- **Empty states:** explain next step (add criterion / add entry).
- **Sorting:** click header to sort; indicate active column and direction.
- **Destructive actions:** confirm before deleting a comparison, criterion, or entry (hard delete).
- **Styling:** Tailwind; keep UI simple and readable (portfolio clarity over novelty).

Scale assumption: on the order of **~3–50 entries** per comparison; modest number of criteria per comparison (roughly up to ~15 is enough to design for).

---

## 9. Technical architecture

### 9.1 Stack (required)

| Layer                         | Choice                                                          |
| ----------------------------- | --------------------------------------------------------------- |
| Frontend                      | Next.js + Tailwind                                              |
| Backend                       | NestJS                                                          |
| Validation / shared contracts | **Zod** + **`nestjs-zod`** (API)                                |
| Shared package                | **`@compy/shared`** (from day one; schemas reused by web + api) |
| ORM / DB                      | Prisma + **PostgreSQL**                                         |
| E2E tests                     | Playwright                                                      |
| Package management            | **npm** monorepo (npm workspaces; no Turborepo required)        |

### 9.2 Monorepo layout (proposed)

```
Compy/
  apps/
    web/          # Next.js
    api/          # NestJS
  packages/
    shared/       # Zod schemas + inferred types (API contracts, domain enums)
  context/        # Product & project docs
  package.json    # workspaces root
```

Exact folder names can be adjusted at scaffold time; keep **web**, **api**, and **shared** clearly separated.

### 9.3 Responsibilities

- **Next.js:** UI, client-side table interactions, calls Nest API; **reuses Zod schemas from `shared` for client-side form/UI validation** in v1.
- **NestJS:** REST JSON API; request validation via **`nestjs-zod`** against schemas from `shared`; Prisma access.
- **`packages/shared`:** Single source of truth for request/response shapes and domain unions (e.g. criterion types). Export Zod schemas and TypeScript types via `z.infer`.
- **Zod:** Runtime validation + static types on both sides of the HTTP boundary. Not a replacement for Prisma; Prisma owns persistence, Zod owns HTTP/domain contracts.
- **Prisma:** schema, migrations, PostgreSQL access. Map between Prisma models and shared DTOs in the API layer.
- **Playwright:** critical paths (create comparison → criteria → entries → sort).

### 9.4 Shared package + Zod conventions

- **Day-one package:** `@compy/shared` depended on by both `web` and `api`.
- **Schemas first:** define Zod schemas for create/update/list payloads (comparisons, criteria, entries, values); export types with `z.infer<typeof Schema>`.
- **Criterion discrimination:** use Zod discriminated unions (or equivalent) so value payloads match criterion type (number / text / boolean / rating / enum). Include **`is_comparable: boolean`** on criterion schemas; `is_key` is server-managed and the built-in criterion is not creatable/deletable via normal client APIs (server ensures one on comparison create).
- **NestJS integration:** use **`nestjs-zod`** (pipes/DTOs as per library patterns) so controllers validate with the same schemas as the client.
- **Web integration:** import the same schemas in Next.js for form and client-side checks before/alongside API calls.
- **Boundary:** `shared` must not import Nest, Next, Prisma, React, or `nestjs-zod` — Zod schemas and pure helpers only.
- **Build:** shared package compiled or consumed so both apps resolve types cleanly under npm workspaces (exact setup at scaffold).

### 9.5 Deployment roadmap

| Phase | Target                                             |
| ----- | -------------------------------------------------- |
| Now   | **Local only** (Docker Postgres or local Postgres) |
| Later | **Vercel** for Next.js frontend                    |
| Later | **Railway** for NestJS API + PostgreSQL            |

Document CORS, env vars (`DATABASE_URL`, `NEXT_PUBLIC_API_URL`, etc.) when scaffolding. NestJS is **not** assumed to run on Vercel.

---

## 10. Data model (logical)

```
Comparison
  id, name, createdAt, updatedAt

Criterion
  id, comparisonId, name, type, is_comparable, is_key,
  config (JSON: enum options, rating min/max, …), createdAt, updatedAt

Entry
  id, comparisonId, createdAt, updatedAt
  # display name = value of the built-in criterion (is_key: true), not a separate Entry.name field, unless denormalized later

Value
  id, entryId, criterionId, (typed payload or unified storage), updatedAt
  unique (entryId, criterionId)
```

**Delete behavior:** deleting a **custom** `Criterion` or an `Entry` hard-deletes related `Value` rows (DB cascade). The criterion with `is_key: true` **cannot** be deleted. Deleting `Comparison` cascades to all criteria (including the built-in criterion), entries, and values.

**Value storage:** either separate nullable columns per type or a single JSON/value column discriminated by criterion type — choose one approach at implementation time and keep API types consistent.

---

## 11. API surface (v1 sketch)

Illustrative only; refine during implementation.

- `GET/POST /comparisons`
- `GET/PATCH/DELETE /comparisons/:id`
- `GET/POST /comparisons/:id/criteria`
- `PATCH/DELETE /criteria/:id`
- `GET/POST /comparisons/:id/entries`
- `PATCH/DELETE /entries/:id`
- Values included in entry create/update payloads and/or nested resources

Validation: NestJS validates bodies/params with **`nestjs-zod`** using **Zod schemas from `packages/shared`**. The web app uses the same schemas for client-side validation. Criterion type constraints apply on both sides (boolean true/false; enum ∈ options; rating within bounds; etc.).

---

## 12. Testing strategy

- **Playwright:** happy path + delete confirmations + sort toggles.
- Prefer stable selectors (roles/labels) over brittle CSS.
- API can gain unit/e2e tests later; v1 priority is UI flows that prove the product story.

---

## 13. Success criteria (v1 done)

- [ ] User can create a free-form comparison that always includes one built-in criterion (`is_key: true`), plus custom criteria of all five types with `is_comparable: false` or `true`.
- [ ] The built-in criterion cannot be removed; custom criteria can; deletes hard-remove dependent values.
- [ ] User can add ~3–50 entries with editable values in a table (name + other identity + comparable columns).
- [ ] User can sort by one column via header click.
- [ ] App runs locally with Next.js, NestJS, Prisma, PostgreSQL, Zod, `nestjs-zod`, and `@compy/shared`.
- [ ] API validates via `nestjs-zod`; web reuses the same shared Zod schemas for UI validation — no duplicated DTO types.
- [ ] At least one Playwright flow covers create → fill → sort.
- [ ] README explains how to run the monorepo locally.

---

## 14. Open decisions (resolve at implementation)

1. **Custom criterion type/`is_comparable` change after create** — Disallow always, or allow only when no values exist? _(Recommendation: disallow; user deletes and recreates. Built-in criterion never changes type or `is_comparable`.)_
2. **Partial values** — Empty cells allowed for custom criteria (recommended: yes). **Name** value: required non-empty vs allow empty with “Untitled entry”? _(Recommendation: required non-empty.)_
3. **Criterion name uniqueness** — Must criterion display names be unique within a comparison? _(Decision: ignore duplicate names for now; criteria are identified by `id`, and the built-in criterion by `is_key`.)_
4. **Criterion / entry order** — Manual reorder in v1 or creation order only? _(The criterion with is_key: true is always first/left.)_
5. **API style** — REST JSON only for v1 (recommended).
6. **URL / link fields** — Extra identity links as plain **text**, or dedicated **`url`** criterion type? _(Recommendation: dedicated `url` type if links are common; otherwise text + linkify.)_
7. **Storage of name** — Value-only via built-in criterion (consistent model) vs also `Entry.name` denormalized for convenience?

**Closed:** criterion roles represented by `is_comparable`; one built-in non-removable criterion (`is_key: true`) on every comparison; users may add more identity criteria; duplicate criterion names are currently allowed; `@compy/shared` + Zod + `nestjs-zod`; row label = value of the built-in criterion.

---

## 15. Summary of decisions

| Topic            | Decision                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| Purpose          | Portfolio / learning                                                                               |
| Name             | Compy                                                                                              |
| v1 users         | Single instance, no auth, empty start                                                              |
| Categories       | Free-form; optional built-in templates at create (electronics / vehicles / travel)                 |
| Criteria         | Number, text, boolean, rating, enum; each uses `is_comparable`                                     |
| Entry identity   | Built-in non-removable criterion (`is_key: true`) + optional custom identity criteria              |
| Compare in v1    | Table + single-column header sort                                                                  |
| Deletes          | Hard delete (cascade values)                                                                       |
| UI               | Table only                                                                                         |
| Scale            | ~3–50 entries per comparison                                                                       |
| Stack            | Next.js, NestJS, Prisma, PostgreSQL, Playwright, Tailwind, Zod, **nestjs-zod**                     |
| Shared contracts | **`@compy/shared`** from day one; schemas reused by API (`nestjs-zod`) and web (client validation) |
| Repo             | npm workspaces monorepo                                                                            |
| Hosting now      | Local                                                                                              |
| Hosting later    | Vercel (web) + Railway (api + DB)                                                                  |
| Later product    | Share links, collaboration, weighted scores, more views, accounts                                  |

---

_Source notes: `context/base_idea.txt` plus clarification Q&A. Update this doc when scope changes._
