import { describe, expect, it } from "vitest";
import { redactDatabaseUrl, resolveActiveDatabaseConfig } from "@/persistence/db/config";

describe("resolveActiveDatabaseConfig", () => {
  it("uses sqlite defaults when APP_DB_ENGINE is omitted", () => {
    const result = resolveActiveDatabaseConfig({
      SQLITE_DATABASE_URL: "file:../data/contacts.db",
    });

    expect(result.engine).toBe("sqlite");
    expect(result.url).toBe("file:../data/contacts.db");
    expect(result.sourceEnvKey).toBe("SQLITE_DATABASE_URL");
  });

  it("uses postgres url for postgres engine", () => {
    const result = resolveActiveDatabaseConfig({
      APP_DB_ENGINE: "postgres",
      POSTGRES_DATABASE_URL:
        "postgresql://postgres:example@postgres-rw:5432/postgres?schema=public",
    });

    expect(result.engine).toBe("postgres");
    expect(result.sourceEnvKey).toBe("POSTGRES_DATABASE_URL");
  });

  it("falls back to DATABASE_URL when engine-specific env is missing", () => {
    const result = resolveActiveDatabaseConfig({
      APP_DB_ENGINE: "postgres",
      DATABASE_URL: "postgresql://fallback:5432/postgres",
    });

    expect(result.engine).toBe("postgres");
    expect(result.url).toBe("postgresql://fallback:5432/postgres");
    expect(result.sourceEnvKey).toBe("DATABASE_URL");
  });

  it("throws on invalid APP_DB_ENGINE", () => {
    expect(() =>
      resolveActiveDatabaseConfig({
        APP_DB_ENGINE: "mysql",
      })
    ).toThrow('Invalid APP_DB_ENGINE value "mysql"');
  });
});

describe("redactDatabaseUrl", () => {
  it("masks password from postgres userinfo", () => {
    const result = redactDatabaseUrl(
      "postgresql://postgres:super-secret@postgres-rw:5432/postgres?schema=public"
    );

    expect(result).toBe(
      "postgresql://postgres:***@postgres-rw:5432/postgres?schema=public"
    );
  });

  it("masks password-like query params", () => {
    const result = redactDatabaseUrl(
      "postgresql://postgres@postgres-rw:5432/postgres?password=secret&schema=public"
    );

    expect(result).toBe(
      "postgresql://postgres@postgres-rw:5432/postgres?password=***&schema=public"
    );
  });

  it("leaves sqlite file URL untouched", () => {
    const result = redactDatabaseUrl("file:../data/contacts.db");

    expect(result).toBe("file:../data/contacts.db");
  });
});
