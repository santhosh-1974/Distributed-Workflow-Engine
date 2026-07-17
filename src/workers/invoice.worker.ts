import { Worker } from "bullmq";

import { bullConnection } from "../queues/bullmq.js";
import { QUEUE_NAMES } from "../queues/queue.names.js";
import { invoiceHandler } from "./handlers/invoice.handler.js";

export const invoiceWorker = new Worker(
    QUEUE_NAMES.INVOICE,
    async job => {
        return invoiceHandler(job.data);
    },
    {
        connection: bullConnection
    }
);