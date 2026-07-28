import { runWorkflow } from "./helpers.js";
import { collectPlatformMetrics } from "./monitoring.js";

export const options = {
  scenarios: {
    stress: {
      executor: "ramping-vus",
      startVUs: 50,
      stages: [
        { duration: "2m", target: 50 },
        { duration: "3m", target: 100 },
        { duration: "4m", target: 250 },
        { duration: "5m", target: 500 },
        { duration: "6m", target: 1000 },
        { duration: "3m", target: 0 },
      ],
      gracefulRampDown: "60s",
    },
  },
  thresholds: { http_req_failed: ["rate<0.01"], workflow_failed: ["count<1"] },
};

export default function () {
  runWorkflow({ awaitCompletion: false });
  collectPlatformMetrics();
}
