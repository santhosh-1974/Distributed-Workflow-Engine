import { vi } from "vitest";
import * as inventoryHandlers from "../../../src/workers/handlers/inventory.handler.js";
import * as paymentHandlers from "../../../src/workers/handlers/payment.handler.js";
import * as invoiceHandlers from "../../../src/workers/handlers/invoice.handler.js";
import * as emailHandlers from "../../../src/workers/handlers/email.handler.js";

export type WorkerName = "inventory" | "payment" | "invoice" | "email";
export type FailureMode = "always" | "until_attempt" | "never";

type HandlerModule = Record<string, () => Promise<void>>;

const handlers: Record<WorkerName, [HandlerModule, string]> = {
    inventory: [inventoryHandlers, "inventoryHandler"],
    payment: [paymentHandlers, "paymentHandler"],
    invoice: [invoiceHandlers, "invoiceHandler"],
    email: [emailHandlers, "emailHandler"],
};

const injectionSpies: Array<{ mockRestore(): void }> = [];

function injectFailures(worker: WorkerName, failures: number): void {
    const [module, exportName] = handlers[worker];
    const original = module[exportName]!;
    let attempts = 0;
    const spy = vi.spyOn(module, exportName).mockImplementation(async () => {
        attempts += 1;
        if (attempts <= failures) {
            throw new Error(`Simulated ${worker} failure on attempt ${attempts}`);
        }
        await original();
    });
    injectionSpies.push(spy);
}

export async function failWorkerUntilAttempt(
    worker: WorkerName,
    _executionId: string,
    untilAttempt: number
): Promise<void> {
    injectFailures(worker, untilAttempt - 1);
}

export async function failWorkerAlways(
    worker: WorkerName,
    _executionId: string
): Promise<void> {
    injectFailures(worker, Number.MAX_SAFE_INTEGER);
}

export async function clearFailureInjection(): Promise<void> {
    while (injectionSpies.length > 0) {
        injectionSpies.pop()!.mockRestore();
    }
}

