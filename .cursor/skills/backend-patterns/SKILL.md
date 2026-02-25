---
name: backend-patterns
description: Applies backend conventions for this project using Next.js server actions with explicit application and persistence boundaries. Use when adding mutations/queries, validation, and orchestration logic without API route handlers.
---
# Backend Patterns

## Scope

Apply this skill for `src/actions` and `src/application`.

## Required architecture boundaries

- `src/actions`: transport/presentation boundary for server actions.
- `src/application`: orchestration and validation.
- `src/persistence`: DB implementation details.

Never bypass the application layer from presentation code.

## Server action conventions

1. Keep `"use server"` files focused on request/form parsing and response side-effects.
2. Parse `FormData` in actions, then call application services.
3. Call `revalidatePath` after successful writes.
4. Convert persistence-specific errors into user-safe messages.

## Application service conventions

- Validate input with Zod schemas before repository calls.
- Keep services framework-agnostic (no Next.js imports).
- Return typed domain objects and nullable results for not-found flows.

## Error handling

- Use explicit checks for not-found and unique-constraint failures.
- Keep thrown messages stable and user-readable.
- Avoid leaking raw DB errors to UI.
