import {
    assertShouldSucceed,
    simulateWork,
} from "../../testing/failure-control.js";
import { HandlerContext } from "../../testing/handler.types.js";

export async function paymentHandler(context?: HandlerContext) {
    if (context) {
        await assertShouldSucceed("payment", context);
    }

    console.log("Charging payment...");
    await simulateWork();
}
