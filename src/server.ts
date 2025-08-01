import express from "express";
import cors from "cors";
import userRouter from "./modules/user/user.routes.ts";
import cookieParser from "cookie-parser";
import projectRouter from "./modules/project/project.routes.ts";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(cookieParser());

// Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/project", projectRouter);

export default app;
