import { check, group } from "k6";
import { Rate } from "k6/metrics";
import { assertNoDuplicateExecutionIds, healthCheck, runWorkflow } from "./helpers.js";

const noDuplicateExecutions = new Rate("no_duplicate_executions");

export const options = {
  scenarios: { workflows: { executor: "per-vu-iterations", vus: 100, iterations: 1, maxDuration: "10m" } },
  thresholds: {
    http_req_failed: ["rate==0"],
    workflow_completion_rate: ["rate==1"],
    workflow_failed: ["count==0"],
    duplicate_executions: ["count==0"],
    workflow_latency: ["avg<2000", "p(95)<5000", "p(99)<10000"],
    workflow_completion_latency: ["p(95)<60000", "p(99)<90000"],
  },
};

export default function () {
  group("100 concurrent workflows", () => {
    check(healthCheck(), { "service is healthy": (healthy) => healthy });
    const completed = runWorkflow({ awaitCompletion: true });
    noDuplicateExecutions.add(assertNoDuplicateExecutionIds([`${__VU}-${__ITER}`]));
    check(completed, { "workflow completed without failure": (result) => result });
  });
}
