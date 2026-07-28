import {
    assertShouldSucceed,
    simulateWork,
} from "../../testing/failure-control.js";
import { HandlerContext } from "../../testing/handler.types.js";

export async function inventoryHandler(context?: HandlerContext) {
    if (context) {
        await assertShouldSucceed("inventory", context);
    }

    console.log("Reserving inventory...");
    await simulateWork();
}
