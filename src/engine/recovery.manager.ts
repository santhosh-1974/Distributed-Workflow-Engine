import { getRunningExecutions } from "../db/repositories/execution.repository.js";
import { executeWorkflow } from "./workflow.executor.js";

export async function recoverExecutions() {
    const executions = await getRunningExecutions();

    console.log(`Recovering ${executions.length} execution(s)`);

    for (const execution of executions) {
        console.log(`Recovering execution ${execution.id}`);

        await executeWorkflow(execution.id);
    }
}