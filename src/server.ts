import http from "node:http";

import app from "./app.js";
import { config } from "./config/env.js";
import { logger } from "./utils/logger.js";

const server = http.createServer(app);

server.listen(config.PORT, () => {
  logger.info(`🚀 Server is running on port ${config.PORT}`);
});

const gracefulShutdown = (signal: NodeJS.Signals) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  server.close((error) => {
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