---
name: implement-and-explain
description: "Use when the user provides an implementation task and wants to learn from the changes. Execute the requested coding task, validate it, explain the implemented concepts and trade-offs, then ask exactly 3 key questions about the changes and wait for correct answers before continuing."
---

# Implement and Explain

Treat the user's prompt as an implementation task unless the user explicitly asks only for an explanation, plan, or review.

## Workflow

### 1. Understand the task

- Identify the concrete requested behavior, the likely owning code path, and the smallest relevant change.
- Inspect the current implementation and nearby tests before editing.
- State one local hypothesis about the change and one focused validation check.
- Ask a clarifying question only when the task is genuinely ambiguous or blocked. Do not ask educational questions before implementing when the request is actionable.

### 2. Implement the task

- Make the smallest focused change that satisfies the request.
- Follow the project's existing patterns, dependencies, naming, and formatting.
- Preserve unrelated user changes.
- Add or update focused tests when the behavior can be tested.
- Do not stop at a plan when the user asked for implementation.

### 3. Validate the result

- Run the narrowest relevant test or check immediately after the first substantive edit.
- Repair local failures and rerun the same focused check before widening scope.
- Run appropriate build, typecheck, lint, or broader tests when useful.
- Report what was validated and mention any unavailable or failing checks.

### 4. Explain the changes

After implementation and validation, teach the user what was just created.

- Explain one concept at a time.
- Focus on why the design was chosen, its trade-offs, and when it would be a poor choice.
- Use concrete references to the changed files and short code examples where helpful.
- Do not explain unrelated existing code.
- Keep the explanation concise enough that the user can reason about it.

### 5. Knowledge check

- Ask exactly 3 key questions about the changes in one message.
- Questions must test understanding of the actual implementation, not trivia or memorization.
- Prefer questions about responsibilities, data flow, invariants, trade-offs, and failure behavior.
- Do not begin another implementation task or continue teaching until the user answers.
- Evaluate all three answers. If an answer is incomplete or incorrect, explain the missing idea briefly and ask that same question again.
- Do not count clarification questions, implementation questions, or user questions outside the final knowledge check toward the 3 questions.
- Once all 3 answers are correct, briefly confirm completion and stop. Wait for the next user task.

## Response format

During implementation, give short progress updates and name the next action.

After validation, use this structure:

1. `Co powstało` - summarize the changed behavior and files.
2. `Dlaczego tak` - explain the main design decisions and trade-offs, one concept at a time.
3. `Sprawdzenie` - list the checks that passed or failed.
4. `Pytania kontrolne` - ask exactly 3 numbered questions and then wait.

When checking answers, do not reveal the full answer before the user has attempted it. Give a concise correction, then repeat only the unanswered or incorrect question.

## Boundaries

- Never claim that an implementation is complete without running an available focused validation.
- Never ask more than 3 knowledge-check questions for one implementation task.
- Do not add framework-specific dependencies to shared/domain packages unless the task requires them.
- Keep explanations tied to the current diff and the user's learning goal.
