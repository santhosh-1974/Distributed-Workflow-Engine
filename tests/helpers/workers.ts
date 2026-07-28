import type { Worker } from "bullmq";

import { emailWorker } from "../../src/workers/email.worker.js";
import { inventoryWorker } from "../../src/workers/inventory.worker.js";
import { invoiceWorker } from "../../src/workers/invoice.worker.js";
import { paymentWorker } from "../../src/workers/payment.worker.js";

const workerMap = {
    inventory: inventoryWorker,
    payment: paymentWorker,
    invoice: invoiceWorker,
    email: emailWorker,
} as const;

const workers: Worker[] = Object.values(workerMap);

let started = false;

export async function startWorkers(): Promise<void> {
    if (started) {
        return;
    }

    await Promise.all(workers.map(worker => worker.waitUntilReady()));
    started = true;
}

export async function stopWorkers(): Promise<void> {
    if (!started) {
        return;
    }

    await Promise.all(workers.map(worker => worker.pause(true)));
    started = false;
}

export async function restartWorkers(): Promise<void> {
    await stopWorkers();
    await Promise.all(workers.map(worker => worker.resume()));
    started = true;
}

export async function stopWorker(
    workerName: keyof typeof workerMap
): Promise<void> {
    await workerMap[workerName].pause(true);
}

export async function startWorker(
    workerName: keyof typeof workerMap
): Promise<void> {
    await workerMap[workerName].resume();
}

export { workers, workerMap };
