import { db } from "../../src/db/prisma.js";

const TABLE_NAMES = ["events", "tasks", "executions", "workflows"] as const;

export async function resetDatabase(): Promise<void> {
    await db.$executeRawUnsafe(`
        TRUNCATE TABLE ${TABLE_NAMES.map(name => `"${name}"`).join(", ")}
        RESTART IDENTITY CASCADE;
    `);
}

export async function disconnectDatabase(): Promise<void> {
    await db.$disconnect();
}

export { db };
