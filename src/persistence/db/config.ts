export type DbEngine = "sqlite" | "postgres";

export interface ActiveDatabaseConfig {
  engine: DbEngine;
  url: string;
  sourceEnvKey: "SQLITE_DATABASE_URL" | "POSTGRES_DATABASE_URL" | "DATABASE_URL";
}

type EnvLike = Record<string, string | undefined>;

const REDACTED_VALUE = "***";

export function redactDatabaseUrl(url: string): string {
  if (!url.includes("://")) {
    return url.replace(/(\/\/[^:/?#\s]+:)([^@/?#\s]+)@/g, `$1${REDACTED_VALUE}@`);
  }

  // Handle standard database URLs first (postgresql://user:pass@host/db).
  try {
    const parsed = new URL(url);

    if (parsed.password) {
      parsed.password = REDACTED_VALUE;
    }

    for (const key of parsed.searchParams.keys()) {
      if (/^(password|pass|pwd)$/i.test(key)) {
        parsed.searchParams.set(key, REDACTED_VALUE);
      }
    }

    return parsed.toString();
  } catch {
    // Fallback for non-URL formats while still masking userinfo passwords.
    return url.replace(/(\/\/[^:/?#\s]+:)([^@/?#\s]+)@/g, `$1${REDACTED_VALUE}@`);
  }
}

function parseEngine(raw: string | undefined): DbEngine {
  if (!raw || raw === "sqlite") {
    return "sqlite";
  }

  if (raw === "postgres") {
    return "postgres";
  }

  throw new Error(
    `Invalid APP_DB_ENGINE value "${raw}". Expected "sqlite" or "postgres".`
  );
}

export function resolveActiveDatabaseConfig(
  env: EnvLike = process.env
): ActiveDatabaseConfig {
  const engine = parseEngine(env.APP_DB_ENGINE);

  if (engine === "sqlite") {
    const sqliteUrl = env.SQLITE_DATABASE_URL;
    if (sqliteUrl) {
      return { engine, url: sqliteUrl, sourceEnvKey: "SQLITE_DATABASE_URL" };
    }
  }

  if (engine === "postgres") {
    const postgresUrl = env.POSTGRES_DATABASE_URL;
    if (postgresUrl) {
      return { engine, url: postgresUrl, sourceEnvKey: "POSTGRES_DATABASE_URL" };
    }
  }

  const fallbackUrl = env.DATABASE_URL;
  if (fallbackUrl) {
    return { engine, url: fallbackUrl, sourceEnvKey: "DATABASE_URL" };
  }

  if (engine === "sqlite") {
    throw new Error(
      'Missing database URL. Set SQLITE_DATABASE_URL (or DATABASE_URL fallback).'
    );
  }

  throw new Error(
    'Missing database URL. Set POSTGRES_DATABASE_URL (or DATABASE_URL fallback).'
  );
}
