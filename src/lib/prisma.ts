import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPooledDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // Supabase PgBouncer (port 6543 or pooler.supabase.com)
  if (url.includes(":6543") || url.includes("pooler.supabase.com") || url.includes("pgbouncer=true")) {
    const hasParams = url.includes("?");
    let enhanced = url;
    if (!enhanced.includes("pgbouncer=")) {
      enhanced += (hasParams ? "&" : "?") + "pgbouncer=true";
    }
    if (!enhanced.includes("connection_limit=")) {
      enhanced += "&connection_limit=5";
    }
    if (!enhanced.includes("pool_timeout=")) {
      enhanced += "&pool_timeout=30";
    }
    return enhanced;
  }
  return url;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getPooledDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
} else {
  globalForPrisma.prisma = prisma;
}

