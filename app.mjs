import express from "express";
import userRouter from "./src/routes/user.routes.js";
import cookieParser from "cookie-parser";

const app = express();

// Build-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Third-parties middleware
app.use(cookieParser());

// routes
app.use("/api/v4/users", userRouter);

export default app;
