import express from "express";
import { verifyJWT } from "../middleware/veriyJWT.middleware.mjs";
import {
        getChannelVideosAndPlaylist
} from "../controllers/dashBoard.controllers.mjs";

const dashBoardRoute = express.Router();

// get channels videos
dashBoardRoute
    .route("/channel-videos/:channelID")
    .get(
        verifyJWT,
        getChannelVideosAndPlaylist
    );

export default dashBoardRoute ;