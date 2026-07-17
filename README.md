src/
│
├── index.ts
├── app.ts
├── server.ts
│
├── api/
│   ├── routes/
│   │   ├── index.ts
│   │   ├── workflow.routes.ts
│   │   └── execution.routes.ts
│   │
│   ├── controllers/
│   │   ├── workflow.controller.ts
│   │   └── execution.controller.ts
│   │
│   ├── validators/
│   └── middleware/
│
├── config/
│   ├── env.ts
│   ├── logger.ts
│   ├── redis.ts
│   └── prisma.ts
│
├── db/
│   ├── client.ts
│   └── repositories/
│       ├── workflow.repository.ts
│       ├── execution.repository.ts
│       ├── task.repository.ts
│       └── event.repository.ts
│
├── services/
│   ├── workflow.service.ts
│   └── execution.service.ts
│
├── engine/
│   ├── workflow.executor.ts
│   ├── workflow.resume.ts
│   ├── retry.engine.ts
│   └── saga.engine.ts
│
├── queues/
│   ├── bullmq.ts
│   ├── queue.registry.ts
│   └── queue.names.ts
│
├── workers/
│   ├── inventory.worker.ts
│   ├── payment.worker.ts
│   ├── invoice.worker.ts
│   ├── email.worker.ts
│   ├── user.worker.ts
│   └── profile.worker.ts
│
├── workflow-definitions/
│   ├── order.json
│   ├── refund.json
│   └── onboarding.json
│
├── types/
│   ├── workflow.ts
│   ├── task.ts
│   └── execution.ts
│
└── utils/