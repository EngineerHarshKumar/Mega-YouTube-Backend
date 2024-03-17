import express from "express";
import {
    getLikedVideos,
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    createNewLike
}
from "../controllers/like.controllers.mjs";
import { verifyJWT } from "../middleware/veriyJWT.middleware.mjs";

const likeRoute = express.Router();


// creating Like
likeRoute
    .route("/create-like")
    .post(
        verifyJWT,
        createNewLike
    );

// Toggling Commnet Like
likeRoute
    .route("/comment-like-toggling/:commentId")
    .patch(
        verifyJWT,
        toggleCommentLike
    );


// Toggling Video Like
likeRoute   
    .route("/vide-like-toggling/:videoId")
    .patch(
        verifyJWT,
        toggleVideoLike
    );


// Toggling Tweet Like
likeRoute   
    .route("/tweet-like-toggling")
    .patch(
        verifyJWT,
        toggleTweetLike
    );

export default likeRoute;