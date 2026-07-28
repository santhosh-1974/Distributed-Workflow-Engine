import { runWorkflow } from "./helpers.js";

const duration = __ENV.SOAK_DURATION || "30m";

export const options = {
  scenarios: { soak: { executor: "constant-vus", vus: Number(__ENV.SOAK_VUS || 50), duration, gracefulStop: "60s" } },
  thresholds: { http_req_failed: ["rate<0.01"], workflow_failed: ["count==0"], workflow_completion_rate: ["rate>0.99"] },
};

export default function () {
  runWorkflow({ awaitCompletion: true });
}
