---
name: plan-and-clarify
description: "Use when the user wants a plan before implementation, or attaches /plan-and-clarify. Clarify open points with questions first, check answers against the current codebase for contradictions, then produce an implementation plan—split into phases when the work is large. Do not implement until the user accepts the plan; then hand off to implement-and-explain."
---

# Plan and Clarify

Turn a user request into a concrete implementation plan. **Do not implement** while this skill is active. When the user accepts the plan and asks to execute it, **stop following this skill** and follow `.agents/skills/implement-and-explain/SKILL.md` for the implementation.

## Workflow

### 1. Understand the request

- Restate the goal in one or two sentences (internally; keep user-facing preamble short).
- Identify the likely owning code paths, docs, and related open TODOs.
- Do a **focused** read of the current implementation (enough to ask good questions—not a full redesign pass).
- List open points: ambiguous behavior, product choices, scope boundaries, and risks of conflicting with existing code or docs.

### 2. Clarify before planning

- Ask clarifying questions **before** writing the plan.
- Prefer **1–3 critical questions** per turn (grouped). Ask more rounds only if answers unlock new blockers.
- Prefer concrete options when choices are discrete (A/B/C), plus a recommended default when one is clearly better.
- Do **not** invent requirements. Do **not** start coding or editing files in this phase.
- Skip questions only when the request is fully unambiguous **and** matches the current codebase with no product fork.

### 3. Check answers against reality

After each round of answers:

- Compare answers to the **current implementation**, schemas, APIs, and feature docs (`context/`, AGENTS.md, existing patterns).
- Flag **contradictions** explicitly: user intent vs code, answer A vs answer B, answer vs locked product decisions.
- If something conflicts, explain the conflict briefly and ask how to resolve it. Do **not** silently pick a side that rewrites existing behavior.
- If an answer is impossible given the architecture, propose the smallest viable alternative and confirm.

### 4. Produce the plan

Only after open points are resolved (or explicitly deferred with a stated default):

- Write an actionable implementation plan tied to real file paths and existing patterns.
- State locked decisions from the Q&A so they are not re-opened mid-implementation.
- Include validation: which tests or checks should prove the change.
- Keep the plan proportional—no gold-plating.

#### Phases for large work

Split into phases when any of these hold:

- Multiple independent surfaces (API + web + docs + migrations)
- More than ~one PR of focused work
- Risky migration / compatibility concerns
- Clear shippable intermediate milestones

For phased plans:

- Each phase has a goal, in-scope files/behavior, out-of-scope, and a done check.
- Later phases may depend on earlier ones; say so.
- Prefer a first phase that delivers a thin vertical slice over a “foundation only” phase when possible.

### 5. Stop for acceptance

- Present the plan and wait for the user to accept, revise, or reject.
- On revision requests, update the plan (and re-clarify if new contradictions appear). Do not implement yet.
- When the user clearly asks to execute the accepted plan: read and follow `implement-and-explain` (`.agents/skills/implement-and-explain/SKILL.md`). Do not implement under this skill alone.

## Question quality

Good clarifying questions target:

- **Scope** — what is in / out for this change
- **Behavior** — edge cases, defaults, failure modes
- **Source of truth** — whose preference/data wins (cookie, profile, caller, server)
- **Compatibility** — existing users, stored data, API contracts
- **UX / copy** — only when user-visible behavior is unspecified

Avoid:

- Trivia or questions answerable only by reading code you have not inspected
- Re-asking locked decisions already documented and still valid
- Implementation micro-choices that do not change the plan (library bikesheds)

## Plan format

Use this structure:

1. **Goal** — one short paragraph
2. **Locked decisions** — bullets from Q&A (and defaults you confirmed)
3. **Current state** — 2–4 bullets on what exists today (with paths)
4. **Approach** — steps or phases with files to touch
5. **Validation** — focused tests / checks
6. **Out of scope** — explicit non-goals for this plan

For phased work, nest **Approach** as `Phase 1`, `Phase 2`, … each with goal, changes, and done check.

## Boundaries

- Clarifying questions first; plan second; implementation only after acceptance via `implement-and-explain`.
- Never ignore contradictions between answers and the codebase.
- Never expand scope beyond the request and confirmed answers.
- Do not edit the plan file the user attached unless they ask; produce or update the plan they will review.
- Prefer project docs and existing patterns over inventing new architecture.
