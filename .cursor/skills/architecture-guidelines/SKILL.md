---
name: architecture-guidelines
description: Enforces the project-wide 3-layer architecture and dependency direction. Use when adding features, refactoring modules, or reviewing code boundaries between presentation, application, and persistence.
---
# Architecture Guidelines

## Target architecture

The codebase uses a 3-layer architecture:

1. Presentation (`src/app`, `src/components`, `src/actions`)
2. Application (`src/application`)
3. Persistence (`src/persistence`)

Domain contracts live in `src/domain`.

## Dependency direction

- Presentation -> Application -> Persistence
- Application -> Domain
- Persistence -> Domain

Do not introduce reverse dependencies.

## Rules

1. UI/components never import Prisma directly.
2. Server actions do not contain business rules beyond request parsing and flow control.
3. Business validation lives in application schemas/services.
4. Persistence layer handles DB access and persistence logging.
5. Cross-layer communication should use typed contracts defined in domain/application.

## Feature checklist

- Domain types or repository contracts updated when needed.
- Application service exposes required use-cases.
- Persistence repository implements contract and logging.
- Presentation wires server actions and components without leaking lower-level details.
- Lint and build pass after changes.
