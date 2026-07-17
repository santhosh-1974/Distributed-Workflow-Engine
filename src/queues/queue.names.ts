export const QUEUE_NAMES = {
    INVENTORY: "inventory",
    PAYMENT: "payment",
    INVOICE: "invoice",
    EMAIL: "email",
    USER: "user",
    PROFILE: "profile"
} as const;

export type QueueName =
    typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];