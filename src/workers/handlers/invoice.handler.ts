import {
    assertShouldSucceed,
    simulateWork,
} from "../../testing/failure-control.js";
import { HandlerContext } from "../../testing/handler.types.js";

export async function invoiceHandler(context?: HandlerContext) {
    if (context) {
        await assertShouldSucceed("invoice", context);
    }

    console.log("Generating invoice...");
    await simulateWork();
}
