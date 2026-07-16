import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger.js";

export const db = new PrismaClient({
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