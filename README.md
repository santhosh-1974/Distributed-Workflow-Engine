 [![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)
 [![Docker Integration Tests](../../actions/workflows/docker-tests.yml/badge.svg)](../../actions/workflows/docker-tests.yml)

# Distributed Workflow Engine

## Testing

Install dependencies and generate the Prisma client before running tests:

```bash
npm ci
npm run prisma:generate
```

The test environment requires PostgreSQL and Redis. Start the project services with `docker compose up -d postgres redis`. The expected variables are `NODE_ENV=test`, `PORT`, `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, and optional `TEST_FAST_MODE=true`; `.env.test` supplies local defaults.

| Suite | Command | Purpose |
| --- | --- | --- |
| All tests | `npm test` | Runs every existing Vitest suite. |
| Unit | `npm run test:unit` | Isolated domain and repository tests. |
| API | `npm run test:api` | Express API contract tests. |
| Integration | `npm run test:integration` | PostgreSQL, Redis, BullMQ, and worker integration tests. |
| Reliability | `npm run test:reliability` | Existing retry, recovery, saga, crash, and chaos tests. |
| Coverage | `npm run test:coverage` | Enforces 90% statements/functions/lines and 85% branches. |
| Watch | `npm run test:watch` | Runs Vitest in watch mode. |

Coverage is written to `coverage/`. Open `coverage/index.html` for line-by-line detail; the command exits non-zero when any configured threshold is missed. Runtime wiring, generated Prisma client setup, logging, and explicit test-control code are excluded because they are not application behaviour under test.

### Load testing

Install [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) separately, start the API and backing services, then run:

```bash
npm run test:load
npm run test:load:stress
npm run test:load:spike
SOAK_DURATION=60m npm run test:load:soak
npm run test:load:recovery
```

All load scripts accept `BASE_URL`, `WORKFLOW_ID`, and `COMPLETION_TIMEOUT_SECONDS`. The soak test also accepts `SOAK_DURATION` (default `30m`) and `SOAK_VUS` (default `50`). k6 reports request rate, average/P95/P99 latency, workflow completion/failure counters, and request failures. Set `METRICS_URL` to a Prometheus-compatible telemetry endpoint during stress tests to collect database response time, Redis response time, BullMQ throughput, and queue backlog. Observe database connections, Redis memory, application CPU/memory, and worker stability in that same deployment telemetry during soak runs.

`recovery-load.js` dispatches 500 workflows by default and waits through an externally initiated restart. After it begins, restart only the application process (for local Docker: `docker compose restart api`); do not restart PostgreSQL or Redis. It verifies recovered completions and fails on workflow failures or duplicate execution IDs. Use `RECOVERY_WORKFLOW_COUNT`, `RECOVERY_VUS`, and `RECOVERY_OUTAGE_SECONDS` to tune it.

### Benchmarks

Run `npm run benchmark` against a non-production environment. It reports workflow and step duration, queue latency, worker processing time, database query duration, Redis ping latency, and BullMQ enqueue/dequeue lookup latency. Set `BENCHMARK_WORKFLOW_ID` to select a workflow definition.

### Continuous integration

`ci.yml` installs dependencies, generates Prisma Client, lint-checks, builds, runs all existing test categories, creates coverage, and uploads the coverage artifact. `docker-tests.yml` starts PostgreSQL and Redis through Docker Compose and executes integration tests. The status badges above derive from those workflows.

src/
│
├── index.ts
├── app.ts
├── server.ts
│
├── api/
│   ├── routes/
│   │   ├── index.ts
│   │   ├── workflow.routes.ts
│   │   └── execution.routes.ts
│   │
│   ├── controllers/
│   │   ├── workflow.controller.ts
│   │   └── execution.controller.ts
│   │
│   ├── validators/
│   └── middleware/
│
├── config/
│   ├── env.ts
│   ├── logger.ts
│   ├── redis.ts
│   └── prisma.ts
│
├── db/
│   ├── client.ts
│   └── repositories/
│       ├── workflow.repository.ts
│       ├── execution.repository.ts
│       ├── task.repository.ts
│       └── event.repository.ts
│
├── services/
│   ├── workflow.service.ts
│   └── execution.service.ts
│
├── engine/
│   ├── workflow.executor.ts
│   ├── workflow.resume.ts
│   ├── retry.engine.ts
│   └── saga.engine.ts
│
├── queues/
│   ├── bullmq.ts
│   ├── queue.registry.ts
│   └── queue.names.ts
│
├── workers/
│   ├── inventory.worker.ts
│   ├── payment.worker.ts
│   ├── invoice.worker.ts
│   ├── email.worker.ts
│   ├── user.worker.ts
│   └── profile.worker.ts
│
├── workflow-definitions/
│   ├── order.json
│   ├── refund.json
│   └── onboarding.json
│
├── types/
│   ├── workflow.ts
│   ├── task.ts
│   └── execution.ts
│
└── utils/
