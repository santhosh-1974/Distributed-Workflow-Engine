import { execSync } from "node:child_process";
import dotenv from "dotenv";
import path from "node:path";

import pg from "pg";

export default async function globalSetup() {
    // Vitest's setupFiles run after globalSetup. Load the test environment here
    // so database creation and migrations use the same URL as the test workers.
    dotenv.config({ path: path.resolve(process.cwd(), ".env.test"), override: true });
    process.env.NODE_ENV = "test";

    const databaseUrl =
        process.env.DATABASE_URL ??
        "postgresql://postgres:postgres@localhost:5432/workflow_engine_test";

    process.env.DATABASE_URL = databaseUrl;

    const parsed = new URL(databaseUrl);
    const databaseName = parsed.pathname.replace(/^\//, "");
    const adminUrl = `${parsed.protocol}//${parsed.username}:${parsed.password}@${parsed.host}/postgres`;

    const adminClient = new pg.Client({ connectionString: adminUrl });
    await adminClient.connect();

    const existing = await adminClient.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [databaseName]
    );

    if (existing.rowCount === 0) {
        await adminClient.query(`CREATE DATABASE "${databaseName}"`);
    }

    await adminClient.end();

    execSync("npx prisma migrate deploy", {
        stdio: "inherit",
        env: {
            ...process.env,
            DATABASE_URL: databaseUrl,
        },
    });
}
