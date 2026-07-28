import { vi } from "vitest";
import { TaskStatus } from "@prisma/client";

import * as eventRepository from "../../../src/db/repositories/event.repository.js";
import * as executionRepository from "../../../src/db/repositories/execution.repository.js";
import * as taskRepository from "../../../src/db/repositories/task.repository.js";
import * as taskDispatcher from "../../../src/engine/task.dispatcher.js";

import { disarmCrash, maybeCrash } from "./crash-points.js";

export function installCrashHooks(): void {
    removeCrashHooks();

    const originalCreateExecution = executionRepository.createExecution;
    vi.spyOn(executionRepository, "createExecution").mockImplementation(
        async data => {
            const result = await originalCreateExecution(data);
            maybeCrash("after_create_execution");
            return result;
        }
    );

    const originalCreateTask = taskRepository.createTask;
    vi.spyOn(taskRepository, "createTask").mockImplementation(async data => {
        const result = await originalCreateTask(data);
        maybeCrash("after_create_task");
        return result;
    });

    const originalDispatchTask = taskDispatcher.dispatchTask;
    vi.spyOn(taskDispatcher, "dispatchTask").mockImplementation(async input => {
        await originalDispatchTask(input);
        maybeCrash("after_dispatch_task");
    });

    const originalUpdateExecution = executionRepository.updateExecution;
    vi.spyOn(executionRepository, "updateExecution").mockImplementation(
        async (id, data) => {
            const result = await originalUpdateExecution(id, data);
            maybeCrash("after_update_execution");
            return result;
        }
    );

    const originalCreateEvent = eventRepository.createEvent;
    vi.spyOn(eventRepository, "createEvent").mockImplementation(async data => {
        const result = await originalCreateEvent(data);
        maybeCrash("after_event_creation");
        return result;
    });

    const originalUpdateTask = taskRepository.updateTask;
    vi.spyOn(taskRepository, "updateTask").mockImplementation(async (id, data) => {
        const result = await originalUpdateTask(id, data);

        if (
            typeof data === "object" &&
            data !== null &&
            "status" in data &&
            data.status === TaskStatus.RUNNING
        ) {
            maybeCrash("after_worker_starts");
        }

        if (
            typeof data === "object" &&
            data !== null &&
            "status" in data &&
            data.status === TaskStatus.COMPLETED
        ) {
            maybeCrash("after_task_completion");
            maybeCrash("after_worker_completes");
        }

        return result;
    });
}

export function removeCrashHooks(): void {
    vi.restoreAllMocks();
    disarmCrash();
}

export { armCrashAt, disarmCrash, SimulatedCrashError } from "./crash-points.js";
export type { CrashPoint } from "./crash-points.js";
