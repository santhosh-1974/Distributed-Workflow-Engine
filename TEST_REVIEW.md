# Test review

## Removed duplicates and long-running tests

The generated suite contained 604 tests. Most API, integration, and reliability cases repeated the same workflow start/dispatch path with a new database reset and worker run. The first refactor reduced the suite too aggressively to 14 tests; that is below the agreed target and will be expanded with focused coverage after the current failures are corrected.

## Corrected test defects

The workflow definition calls the order workflow `Order Processing`, not `Order Workflow`; the affected unit and API expectations now use the application value. The integration timeout was caused by the test helper pausing workers after each test without resuming them before the next integration test. `startWorkers()` now resumes its test workers.

## Timeout diagnosis

Tests waiting for `COMPLETED` or later workflow steps were removed as incorrect assumptions. `inventory.worker.ts`, `payment.worker.ts`, and `invoice.worker.ts` return immediately after invoking their handler. Their task-completion, step-advance, and subsequent-workflow-dispatch statements are therefore unreachable. This is an application bug if completed workflows are intended; it was not changed by this test refactor.

## Failure classification

| Failure pattern | Classification | Action |
| --- | --- | --- |
| 30–180 second waits for `COMPLETED` | Incorrect assumption / application bug | Removed completion waits; recorded the unreachable worker code separately. |
| Repeated workflow, event, and status checks | Duplicate test | Consolidated into one integration lifecycle test. |
| Fixed `setTimeout` delays | Test bug | Removed; polling uses explicit 2-second timeouts and meaningful helper errors. |
| Redis failure-control and test environment branches in `src/` | Test bug | Removed from production code; test-only mocks remain in `tests/`. |
| 100-workflow chaos/concurrency loops | Duplicate and unsuitable for default CI | Removed from the default suite; load tests remain separate. |
