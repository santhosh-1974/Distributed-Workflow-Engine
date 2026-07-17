import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { logger } from "../utils/logger.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({ connectionString });

export const db = new PrismaClient({
  adapter,
  log: ["warn", "error"],
});

export async function connectDatabase(): Promise<void> {
  try {
    await db.$connect();
    logger.info("✅ Connected to PostgreSQL");
  } catch (error) {
    logger.error(error, "Failed to connect to PostgreSQL");
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await db.$disconnect();
  logger.info("Disconnected from PostgreSQL");
}
