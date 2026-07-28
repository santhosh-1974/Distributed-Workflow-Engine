import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

export const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";
export const WORKFLOW_ID = __ENV.WORKFLOW_ID || "order";
export const COMPLETION_TIMEOUT_SECONDS = Number(__ENV.COMPLETION_TIMEOUT_SECONDS || 60);

export const workflowLatency = new Trend("workflow_latency", true);
export const workflowCompletionLatency = new Trend("workflow_completion_latency", true);
export const workflowCompleted = new Counter("workflow_completed");
export const workflowFailed = new Counter("workflow_failed");
export const duplicateExecutions = new Counter("duplicate_executions");
export const droppedRequests = new Counter("dropped_requests");
export const workflowCompletionRate = new Rate("workflow_completion_rate");
export const queueBacklog = new Trend("queue_backlog", true);
export const recoveryTime = new Trend("recovery_time", true);

const jsonParams = { headers: { "Content-Type": "application/json" }, tags: { endpoint: "workflow" } };

export function workflowPayload(overrides = {}) {
  return { workflowId: WORKFLOW_ID, ...overrides };
}

export function startWorkflow(payload = workflowPayload()) {
  const response = http.post(`${BASE_URL}/api/v1/workflows/start`, JSON.stringify(payload), jsonParams);
  const valid = check(response, {
    "workflow accepted": (r) => r.status === 201,
    "execution id returned": (r) => Boolean(r.json("id")),
  });
  if (!valid) {
    workflowFailed.add(1);
    droppedRequests.add(1);
    return null;
  }
  return response.json("id");
}

export function executeWorkflow(executionId) {
  const startedAt = Date.now();
  const response = http.post(
    `${BASE_URL}/api/v1/executions/start`,
    JSON.stringify({ executionId }),
    { ...jsonParams, tags: { endpoint: "execution-start" } },
  );
  workflowLatency.add(Date.now() - startedAt);
  const valid = check(response, { "execution dispatched": (r) => r.status === 200 && r.json("success") === true });
  if (!valid) workflowFailed.add(1);
  return valid;
}

export function waitForCompletion(executionId, timeoutSeconds = COMPLETION_TIMEOUT_SECONDS) {
  const startedAt = Date.now();
  const deadline = startedAt + timeoutSeconds * 1000;
  while (Date.now() < deadline) {
    const response = http.get(`${BASE_URL}/api/v1/executions/${executionId}`, { tags: { endpoint: "execution-status" } });
    if (response.status === 200) {
      const status = response.json("status");
      if (status === "COMPLETED") {
        workflowCompletionLatency.add(Date.now() - startedAt);
        workflowCompleted.add(1);
        workflowCompletionRate.add(true);
        return true;
      }
      if (status === "FAILED") {
        workflowFailed.add(1);
        workflowCompletionRate.add(false);
        return false;
      }
    } else {
      droppedRequests.add(1);
    }
    sleep(0.25);
  }
  workflowFailed.add(1);
  workflowCompletionRate.add(false);
  return false;
}

export function runWorkflow({ awaitCompletion = true } = {}) {
  const executionId = startWorkflow();
  if (!executionId) return false;
  if (!executeWorkflow(executionId)) return false;
  return awaitCompletion ? waitForCompletion(executionId) : true;
}

export function healthCheck() {
  const response = http.get(`${BASE_URL}/health`, { tags: { endpoint: "health" } });
  return response.status === 200;
}

export function assertNoDuplicateExecutionIds(ids) {
  const unique = new Set(ids);
  const duplicates = ids.length - unique.size;
  if (duplicates > 0) duplicateExecutions.add(duplicates);
  return duplicates === 0;
}

export function randomWorkflowPayload() {
  return workflowPayload({
    requestId: `${__VU}-${__ITER}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    metadata: { source: "k6", virtualUser: __VU, iteration: __ITER },
  });
}
