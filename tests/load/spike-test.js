import { sleep } from "k6";
import { healthCheck, recoveryTime, runWorkflow } from "./helpers.js";

export const options = {
  scenarios: {
    spike: {
      executor: "ramping-vus",
      startVUs: 50,
      stages: [
        { duration: "2m", target: 50 },
        { duration: "10s", target: 1000 },
        { duration: "2m", target: 1000 },
        { duration: "10s", target: 50 },
        { duration: "3m", target: 50 },
        { duration: "30s", target: 0 },
      ],
    },
  },
  thresholds: { http_req_failed: ["rate<0.02"], dropped_requests: ["count<1"], recovery_time: ["p(95)<30000"] },
};

export default function () {
  const start = Date.now();
  runWorkflow({ awaitCompletion: false });
  if (healthCheck()) recoveryTime.add(Date.now() - start);
  sleep(0.1);
}
