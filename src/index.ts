import "./server.js";
import "./workers/index"

import { config } from "./config/env.js";
import { logger } from "./utils/logger.js";

logger.info("========================================");
logger.info("🚀 Distributed Workflow Engine");
logger.info(`Environment : ${config.NODE_ENV}`);
logger.info(`Port        : ${config.PORT}`);
logger.info("========================================");