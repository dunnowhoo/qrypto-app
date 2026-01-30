import { PrismaClient } from "@/app/generated/prisma/client";
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
