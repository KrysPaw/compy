---
name: web-component-structure
description: >-
  Enforces small, readable React component files in apps/web: one React component
  declaration per .tsx file, soft ~100 lines, hard max 200, grouped in feature
  folders. Use whenever creating, editing, or refactoring feature UI under
  apps/web (components, dialogs, tables, menus, forms, pages)—not for shadcn
  apps/web/components/ui/.
---

# Web component structure

Apply these rules for any new or changed feature UI under `apps/web` that is **not** shadcn `components/ui/`.

## Rules

1. **One component per file** — each `.tsx` feature file declares exactly one React component (including tiny private ones). Name the file after the component in kebab-case (e.g. `SortIcon` → `sort-icon.tsx`).
2. **Size budget** — soft target ~100 lines; hard max **200** lines per feature component file. Prefer extracting child components over growing a parent.
3. **Exclude shadcn** — do **not** split or rewrite `apps/web/components/ui/` (compound primitives stay as vendor packages).
4. **Non-components** — types, constants, and pure helpers may live in the same file as the single component that owns them, or in the same feature folder (or `apps/web/lib/` when shared across features). They do not count as extra components.
5. **Feature folders** — group related components under `components/<feature>/` (e.g. `components/rules/rules-data-table.tsx` + `rules-table.tsx`). Existing folders: `rules`, `criteria`, `entries`, `results`, `comparison`, `sidebar`, `dev`. Put new pieces next to their feature siblings—not flat under `components/`.
6. **Routes** — keep `app/` route files as thin data/composition wrappers; put UI in `components/`.
7. **Tests** — `*.spec.tsx` are exempt from the line budget; colocate them in the same feature folder; update imports after moves.

## When extracting

- Split multi-component files first, then slim any single-component file still over ~100 (especially >200).
- Prefer updating imports to the new path over barrel re-exports, unless a stable public path is required.
- Do not change behavior—structure-only unless the task asks for functional changes.
