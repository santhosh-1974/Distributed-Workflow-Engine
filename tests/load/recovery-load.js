import { sleep } from "k6";
import { check } from "k6";
import { healthCheck, recoveryTime, runWorkflow } from "./helpers.js";

const workflowCount = Number(__ENV.RECOVERY_WORKFLOW_COUNT || 500);
const outageSeconds = Number(__ENV.RECOVERY_OUTAGE_SECONDS || 30);

export const options = {
  scenarios: {
    recovery: { executor: "shared-iterations", vus: Number(__ENV.RECOVERY_VUS || 50), iterations: workflowCount, maxDuration: "20m" },
  },
  thresholds: { http_req_failed: ["rate==0"], workflow_failed: ["count==0"], workflow_completion_rate: ["rate==1"], duplicate_executions: ["count==0"] },
};

export function setup() {
  if (!healthCheck()) throw new Error("Target is not healthy before recovery test");
  return { startedAt: Date.now() };
}

export default function () {
  // Restart the application after dispatch begins (for Docker: `docker compose restart api`).
  // k6 polls through the outage and validates the recovered execution reaches COMPLETED.
  runWorkflow({ awaitCompletion: true });
}

export function teardown(data) {
  const start = Date.now();
  const deadline = start + outageSeconds * 1000 + 120000;
  while (Date.now() < deadline && !healthCheck()) sleep(1);
  const recovered = healthCheck();
  recoveryTime.add(Date.now() - start);
  check(recovered, { "application recovered after restart": (value) => value });
  check(Date.now() >= data.startedAt, { "recovery test completed": (value) => value });
}
