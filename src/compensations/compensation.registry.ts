import { releaseInventory } from "./inventory.compensation.js";
import { refundPayment } from "./payment.compensation.js";
import { deleteInvoice } from "./invoice.compensation.js";
import { cancelEmail } from "./email.compensation.js";
import { CompensationHandler } from "./compensation.types.js";

export const compensationRegistry: Record<string, CompensationHandler> = {
    "release-inventory": releaseInventory,
    "refund-payment": refundPayment,
    "delete-invoice": deleteInvoice,
    "cancel-email": cancelEmail
};
