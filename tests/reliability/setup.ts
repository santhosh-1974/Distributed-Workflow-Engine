import { beforeEach, afterEach } from "vitest";

import {
    drainAllQueues,
    flushRedis,
    initializeTestApp,
    resetDatabase,
    startWorkers,
    stopWorkers,
} from "../helpers/index.js";
import { clearFailureInjection } from "./helpers/failure-injector.js";
import { removeCrashHooks } from "./helpers/crash-injector.js";

beforeEach(async () => {
    await resetDatabase();
    await flushRedis();
    await drainAllQueues();
    await clearFailureInjection();
    removeCrashHooks();
    await initializeTestApp();
    await startWorkers();
});

afterEach(async () => {
    removeCrashHooks();
    await clearFailureInjection();
    await stopWorkers();
    await drainAllQueues();
    await flushRedis();
});
