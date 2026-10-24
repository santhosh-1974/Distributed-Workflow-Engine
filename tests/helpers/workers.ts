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

    console.log("Starting workers...");
    await Promise.all(workers.map(worker => worker.waitUntilReady()));
    console.log("Workers ready, resuming...");
    await Promise.all(workers.map(worker => worker.resume()));
    started = true;
    console.log("Workers started");
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
    // Small delay to ensure workers are fully stopped
    await new Promise(resolve => setTimeout(resolve, 100));
    await Promise.all(workers.map(worker => worker.resume()));
    started = true;
    console.log("Workers restarted");
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

export async function closeWorkers(): Promise<void> {
    await Promise.all(workers.map(worker => worker.close()));
    started = false;
}

export { workers, workerMap };
