import { Worker } from "bullmq";

import { bullConnection } from "../queues/bullmq.js";
import { QUEUE_NAMES } from "../queues/queue.names.js";
import { emailHandler } from "./handlers/email.handler.js";

export const emailWorker = new Worker(
    QUEUE_NAMES.EMAIL,
    async job => {
        return emailHandler(job.data);
    },
    {
        connection: bullConnection
    }
);