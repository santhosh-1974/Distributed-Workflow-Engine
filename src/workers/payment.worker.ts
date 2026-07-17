import { Worker } from "bullmq";

import { bullConnection } from "../queues/bullmq.js";
import { QUEUE_NAMES } from "../queues/queue.names.js";
import { paymentHandler } from "./handlers/payment.handler.js";

export const paymentWorker = new Worker(
    QUEUE_NAMES.PAYMENT,
    async job => {
        return paymentHandler(job.data);
    },
    {
        connection: bullConnection
    }
);