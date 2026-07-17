
import { Worker } from "bullmq";

import { bullConnection } from "../queues/bullmq.js";
import { QUEUE_NAMES } from "../queues/queue.names.js";
import { inventoryHandler } from "./handlers/inventory.handler.js";

export const inventoryWorker = new Worker(
    QUEUE_NAMES.INVENTORY,
    async job => {
        return inventoryHandler(job.data);
    },
    {
        connection: bullConnection
    }
);