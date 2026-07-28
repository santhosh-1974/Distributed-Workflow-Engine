export default async function globalTeardown() {
    const { disconnectFailureControl } = await import(
        "../../src/testing/failure-control.js"
    );

    await disconnectFailureControl();
}
