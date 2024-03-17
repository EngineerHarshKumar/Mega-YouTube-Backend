import express from "express";
import { verifyJWT } from "../middleware/veriyJWT.middleware.mjs";
import {
        createTweet,
        deleteTweet,
        getUserTweets,
        updateTweet,
} from "../controllers/tweet.controllers.mjs";

const tweetRouter = express.Router();

// creating Tweet
tweetRouter
    .route("/create-tweet")
    .post(
        verifyJWT,
        createTweet
    );

// Updating Tweet
tweetRouter 
    .route("/update-tweet")
    .patch(
        verifyJWT,
        updateTweet
    );

// Getting User Tweet
tweetRouter
    .route("/get-user-tweet")
    .get(
        verifyJWT,
        getUserTweets
    );


tweetRouter
    .route("/delete-tweet")
    .delete(
        verifyJWT,
        deleteTweet
    );


export default tweetRouter ;