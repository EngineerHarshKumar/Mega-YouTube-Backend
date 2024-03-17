import express from "express";
import {

    addComment,
    deleteComment,
    updateComment,
    getVideoComments
} from "../controllers/comment.controllers.mjs";
import { verifyJWT } from "../middleware/veriyJWT.middleware.mjs";

const commentRouter = express.Router();



//Creating new Comment 
commentRouter
    .route("/create-comment")
    .post(
        verifyJWT,
        addComment
    );


// Deleting the Comment
commentRouter
    .route("/delete-comment")
    .delete(
        verifyJWT,
        deleteComment
    );


// Upadting comment
commentRouter
    .route("/updating-comment")
    .patch(
        verifyJWT,
        updateComment
    );


// Get all Comment by video
commentRouter
    .route("/get-all-comments/:videoId")
    .get(
        getVideoComments
    );


export default commentRouter;