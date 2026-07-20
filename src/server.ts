import http from "node:http";

import app from "./app.js";
import { config } from "./config/env.js";
import { connectDatabase } from "./db/prisma.js";
import { recoverExecutions } from "./engine/recovery.manager.js";
import { logger } from "./utils/logger.js";

const server = http.createServer(app);

async function bootstrap() {
    try {
        await connectDatabase();
        logger.info("✅ PostgreSQL connected");

        await import("./workers/index.js");
        logger.info("✅ Workers started");

        await recoverExecutions();
        logger.info("✅ Recovery completed");

        server.listen(config.PORT, () => {
            logger.info("========================================");
            logger.info("🚀 Distributed Workflow Engine");
            logger.info(`Environment : ${config.NODE_ENV}`);
            logger.info(`Port        : ${config.PORT}`);
            logger.info("========================================");
        });
    } catch (error) {
        logger.error(error, "Failed to start application");
        process.exit(1);
    }
}

bootstrap();

const gracefulShutdown = (signal: NodeJS.Signals) => {
    logger.info(`${signal} received. Shutting down gracefully...`);

    server.close(error => {
        if (error) {
            logger.error(error, "Error while shutting down server");
            process.exit(1);
        }

        logger.info("HTTP server closed.");
        process.exit(0);
    });
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

export default server;