import express from "express";
import cors from "cors";
import userRouter from "./modules/user/user.routes.ts";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// Routes
app.use("/api/v1/user", userRouter);

export default app;
