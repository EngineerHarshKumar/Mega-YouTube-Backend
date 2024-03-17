import express from "express";
import userRouter from "./src/routes/user.routes.js";
import cookieParser from "cookie-parser";
import videoRoute from "./src/routes/video.routes.js";
import playlistRoute from "./src/routes/playlist.routes.js";
import subscriptionRoute from "./src/routes/subscription.routes.js";
import commentRouter from "./src/routes/comment.routes.js";
import likeRoute from "./src/routes/like.routes.js";
import corsOptinos from "./config/cors.config.mjs";
import cors from "cors";
import healthCheckRoute from "./src/routes/heatlhCheck.routes.js";
import dashBoardRoute from "./src/routes/dashBoard.routes.js";
import tweetRouter from "./src/routes/tweet.routes.js";

const app = express();

// Build-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Third-parties middleware
app.use(cookieParser());
app.use(cors(corsOptinos));

// routes
app.use("/api/v4/users", userRouter);
app.use("/api/v4/videos", videoRoute);
app.use("/api/v4/playlist", playlistRoute);
app.use("/api/v4/subscriptions", subscriptionRoute);
app.use("/api/v4/comments",commentRouter );
app.use("/api/v4/likes", likeRoute);
app.use("/api/v4/dashBoard", dashBoardRoute);
app.use("/api/v4", healthCheckRoute);
app.use("/api/v4/tweets", tweetRouter);

export default app;
