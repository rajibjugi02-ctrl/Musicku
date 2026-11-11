import { PrismaClient } from "@prisma/client";

const NEON_DB_URL =
  "postgresql://neondb_owner:npg_EDnaZ1M9fXkl@ep-restless-tooth-b34qegq3-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// Fallback to active Neon DB URL if .env is missing or reverted to template placeholder
const envUrl = process.env.DATABASE_URL;
const activeDbUrl =
  !envUrl || envUrl.includes("localhost:5432") || envUrl.includes("user:password")
    ? NEON_DB_URL
    : envUrl;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: activeDbUrl,
      },
    },
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
