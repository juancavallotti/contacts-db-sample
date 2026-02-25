import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  didLogDatabaseUrl?: boolean;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (!globalForPrisma.didLogDatabaseUrl) {
  const databaseUrl = process.env.DATABASE_URL ?? "<undefined>";
  console.log(
    `[startup] NODE_ENV=${process.env.NODE_ENV ?? "unknown"} cwd=${process.cwd()} DATABASE_URL=${databaseUrl}`
  );
  globalForPrisma.didLogDatabaseUrl = true;
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
