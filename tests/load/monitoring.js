import http from "k6/http";
import { Trend } from "k6/metrics";

const metricsUrl = __ENV.METRICS_URL;
export const databaseResponseTime = new Trend("database_response_time", true);
export const redisResponseTime = new Trend("redis_response_time", true);
export const bullmqThroughput = new Trend("bullmq_throughput", true);
export const observedQueueBacklog = new Trend("observed_queue_backlog", true);

function prometheusValue(body, metricNames) {
  for (const name of metricNames) {
    const match = body.match(new RegExp(`^${name}(?:\\{[^}]*\\})?\\s+([0-9.eE+-]+)$`, "m"));
    if (match) return Number(match[1]);
  }
  return null;
}

/**
 * Samples a Prometheus-compatible telemetry endpoint when METRICS_URL is set.
 * Metric aliases cover common pg/Redis/BullMQ exporters and can be extended for
 * the deployment's observability stack without changing the load scenarios.
 */
export function collectPlatformMetrics() {
  if (!metricsUrl) return;
  const response = http.get(metricsUrl, { tags: { endpoint: "metrics" } });
  if (response.status !== 200) return;
  const body = response.body;
  const db = prometheusValue(body, ["database_query_duration_seconds", "pg_stat_activity_max_tx_duration"]);
  const redis = prometheusValue(body, ["redis_commands_duration_seconds", "redis_ping_latency_seconds"]);
  const throughput = prometheusValue(body, ["bullmq_jobs_completed_total", "bullmq_completed_jobs_total"]);
  const backlog = prometheusValue(body, ["bullmq_jobs_waiting", "bullmq_queue_waiting"]);
  if (db !== null) databaseResponseTime.add(db * 1000);
  if (redis !== null) redisResponseTime.add(redis * 1000);
  if (throughput !== null) bullmqThroughput.add(throughput);
  if (backlog !== null) observedQueueBacklog.add(backlog);
}
