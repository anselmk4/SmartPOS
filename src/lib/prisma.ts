import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getEffectiveDatabaseUrl(): string | undefined {
  // 1. If DIRECT_URL is configured (direct PostgreSQL connection on port 5432), prefer it for serverless environments
  const directUrl = process.env.DIRECT_URL;
  if (directUrl && !directUrl.includes("[YOUR-") && directUrl.startsWith("postgres")) {
    return directUrl;
  }

  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // 2. Supabase PgBouncer (port 6543 or pooler.supabase.com)
  if (url.includes(":6543") || url.includes("pooler.supabase.com") || url.includes("pgbouncer=true")) {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set("pgbouncer", "true");
      urlObj.searchParams.set("connection_limit", "1");
      urlObj.searchParams.set("pool_timeout", "0");
      urlObj.searchParams.set("connect_timeout", "20");
      return urlObj.toString();
    } catch {
      let enhanced = url;
      const hasParams = enhanced.includes("?");
      if (!enhanced.includes("pgbouncer=")) {
        enhanced += (hasParams ? "&" : "?") + "pgbouncer=true";
      }
      if (!enhanced.includes("connection_limit=")) {
        enhanced += "&connection_limit=1";
      }
      if (!enhanced.includes("pool_timeout=")) {
        enhanced += "&pool_timeout=0";
      }
      return enhanced;
    }
  }
  return url;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getEffectiveDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
} else {
  globalForPrisma.prisma = prisma;
}


