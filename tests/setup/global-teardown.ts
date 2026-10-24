export default async function globalTeardown() {
    const [{ closeWorkers }, { disconnectRedis }, { disconnectDatabase }, { queues }] = await Promise.all([
        import("../helpers/workers.js"),
        import("../helpers/redis.js"),
        import("../helpers/database.js"),
        import("../../src/queues/workflow.queue.js"),
    ]);

    await Promise.allSettled([
        closeWorkers(),
        disconnectRedis(),
        disconnectDatabase(),
        ...Object.values(queues).map(queue => queue.close()),
    ]);
}
