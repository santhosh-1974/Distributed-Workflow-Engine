import {
    assertShouldSucceed,
    simulateWork,
} from "../../testing/failure-control.js";
import { HandlerContext } from "../../testing/handler.types.js";

export async function emailHandler(context?: HandlerContext) {
    if (context) {
        await assertShouldSucceed("email", context);
    }

    console.log("Sending confirmation email...");
    await simulateWork();
}
