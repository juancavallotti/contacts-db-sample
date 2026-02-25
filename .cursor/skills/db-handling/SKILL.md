---
name: db-handling
description: Defines SQLite and Prisma handling conventions for this project. Use when modifying schema, migrations, repositories, connection lifecycle, or persistence logging.
---
# DB Handling

## Scope

Apply this skill for `prisma/` and `src/persistence/`.

## Prisma and SQLite defaults

- Use Prisma with SQLite datasource.
- Keep DB URL in `.env` and example in `.env.example`.
- Store local SQLite file under `prisma/data/`.
- Keep DB artifacts out of git via `.gitignore`.

## Migration workflow

1. Change `prisma/schema.prisma`.
2. Run `npm run db:migrate -- --name <change-name>`.
3. Ensure migration SQL is committed.
4. Regenerate client if needed (`npm run db:generate`).

## Repository conventions

- Expose repository interface in domain layer.
- Implement concrete repository in `src/persistence`.
- Map Prisma entities to domain entities through explicit mapper functions.
- Log persistence operations (`list`, `getById`, `create`, `update`, `delete`) via persistence logger.

## Runtime and Docker

- Ensure runtime can apply migrations with `npm run db:deploy`.
- Mount `prisma/data` as a volume when running containers.
