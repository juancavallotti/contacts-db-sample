import { PrismaClient as PostgresPrismaClient } from "@/generated/prisma-postgres";
import { PrismaClient as SqlitePrismaClient } from "@/generated/prisma-sqlite";
import { redactDatabaseUrl, resolveActiveDatabaseConfig } from "@/persistence/db/config";

export type AppPrismaClient = SqlitePrismaClient | PostgresPrismaClient;

const globalForPrisma = globalThis as unknown as {
  prisma?: AppPrismaClient;
  didLogDatabaseUrl?: boolean;
};

const activeDatabase = resolveActiveDatabaseConfig();

function createPrismaClient(): AppPrismaClient {
  if (activeDatabase.engine === "postgres") {
    return new PostgresPrismaClient({
      datasources: { db: { url: activeDatabase.url } },
      log: ["error", "warn"],
    });
  }

  return new SqlitePrismaClient({
    datasources: { db: { url: activeDatabase.url } },
    log: ["error", "warn"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!globalForPrisma.didLogDatabaseUrl) {
  const redactedDatabaseUrl = redactDatabaseUrl(activeDatabase.url);
  console.log(
    `[startup] NODE_ENV=${process.env.NODE_ENV ?? "unknown"} cwd=${process.cwd()} APP_DB_ENGINE=${activeDatabase.engine} ${activeDatabase.sourceEnvKey}=${redactedDatabaseUrl}`
  );
  globalForPrisma.didLogDatabaseUrl = true;
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
