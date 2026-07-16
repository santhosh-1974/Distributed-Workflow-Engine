import express from "express";
import routes from "./api/routes/index.js";

const app = express();

app.use(express.json());
app.use("/api/v1", routes)
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Workflow Engine is running",
  });
});

export default app;