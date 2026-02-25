---
name: frontend-patterns
description: Implements frontend UI patterns for this project using Next.js App Router, Tailwind, and reducer-driven client state. Use when building forms, cards, modals, client interactions, and server action wiring in the presentation layer.
---
# Frontend Patterns

## Scope

Apply this skill for files in `src/app`, `src/components`, and `src/actions` when the task is UI/presentation related.

## Required patterns

1. Use server components by default.
2. Add `"use client"` only when local interaction state or event handlers are required.
3. Prefer server actions for form submissions over custom fetch flows.
4. Keep UI state in reducer-based modules using `@eetr/react-reducer-utils` when state has multiple transitions (modal open/close, selected item, edit mode).
5. Use Tailwind utility classes with consistent spacing (`p-4`, `p-6`, `gap-2`, `gap-4`, `rounded-md`, `rounded-lg`).

## Form and modal conventions

- Keep action handlers in `src/actions`.
- Keep reusable view components in `src/components/<feature>/`.
- For edit dialogs, prefill fields from selected entity state and close dialog on successful action completion.
- Include hidden `id` fields in update/delete forms.

## Card list pattern

- Use responsive card grids for entity collections:
  - `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`
- Card footer should expose primary actions (`Edit`, `Delete`).
- Keep destructive actions visibly distinct (`bg-red-600`).

## Reducer pattern template

```tsx
import { ReducerAction, bootstrapProvider } from "@eetr/react-reducer-utils";

enum ActionType {
  OPEN = "OPEN",
  CLOSE = "CLOSE",
}

interface State {
  selectedId: string | null;
}

type Action =
  | ReducerAction<ActionType.OPEN, { id: string }>
  | ReducerAction<ActionType.CLOSE>;

const initialState: State = { selectedId: null };

function reducer(state: State = initialState, action: Action): State {
  switch (action.type) {
    case ActionType.OPEN:
      return { ...state, selectedId: action.payload.id };
    case ActionType.CLOSE:
      return { ...state, selectedId: null };
    default:
      return state;
  }
}

const { Provider, useContextAccessors } = bootstrapProvider<State, Action>(
  reducer,
  initialState
);
```
