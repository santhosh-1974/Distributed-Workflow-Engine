import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        setupFiles: ["./tests/setup/env.ts", "./tests/reliability/setup.ts"],
        globalSetup: ["./tests/setup/global-setup.ts"],
        globalTeardown: ["./tests/setup/global-teardown.ts"],
        testTimeout: 180_000,
        hookTimeout: 120_000,
        fileParallelism: false,
        sequence: {
            concurrent: false,
        },
        include: ["tests/**/*.test.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "html", "json", "lcov"],
            reportsDirectory: "coverage",
            all: true,
            include: ["src/**/*.ts"],
            exclude: [
                "src/server.ts",
                "src/config/**",
                "src/db/prisma.ts",
                "src/utils/logger.ts",
                "src/testing/**",
                "**/*.d.ts",
            ],
            thresholds: {
                statements: 90,
                branches: 85,
                functions: 90,
                lines: 90,
            },
        },
    },
});
