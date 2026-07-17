import { Queue } from "bullmq";
import { bullConnection } from "./bullmq";
import { QUEUE_NAMES } from "./queue.names";

export const queues = {
    inventory: new Queue(QUEUE_NAMES.INVENTORY, {
        connection: bullConnection
    }),

    payment: new Queue(QUEUE_NAMES.PAYMENT, {
        connection: bullConnection
    }),

    invoice: new Queue(QUEUE_NAMES.INVOICE, {
        connection: bullConnection
    }),

    email: new Queue(QUEUE_NAMES.EMAIL, {
        connection: bullConnection
    }),

    user: new Queue(QUEUE_NAMES.USER, {
        connection: bullConnection
    }),

    profile: new Queue(QUEUE_NAMES.PROFILE, {
        connection: bullConnection
    })
};