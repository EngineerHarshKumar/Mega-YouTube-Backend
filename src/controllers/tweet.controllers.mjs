// import mongoose from "mongoose";
// import { Tweet } from "../models/tweet.model.mjs";
// import  from "../utils/apiError.mjs";
// import ApiResponse from "../utils/apiResponse.mjs";
// import { User } from "../models/user.model.mjs";

import mongoose  from "mongoose";
import ApiError from "../utils/apiError.mjs";
import ApiResponse from "../utils/apiResponse.mjs";
import { User } from "../models/user.model.mjs";
import asyncHandler from "../utils/asyncHandler.mjs";
import { Tweet } from "../models/tweet.model.mjs";

// SECURE CONTROLLER
const createTweet = asyncHandler(async (request, response) => {
    //TODO: create tweetx

    if (!request.user) {
        throw new ApiError(401, "Unauthorized User");
    }

    const { tweetContent } = request.body;
    console.log(`tweetContent: ${ tweetContent }`);
    const userID =request.user._id;
    const loginUser = await User.findById(userID);

    if (!loginUser) {
        throw new ApiError(401, `User not Found ID: ${userID}`);
    }

    const newTweetCreated = await Tweet.create({
        owner: loginUser,
        content: tweetContent,
    });

    if (!newTweetCreated) {
        throw new ApiError(500, `New Tweet Creation Failed`);
    }

    console.log(`Newly Created Tweet: ${newTweetCreated}`);

    response
        .status(201)
        .json(
            new ApiResponse(
                201,
                { newTweet: newTweetCreated },
                `New Tweet Create Success`,
            ),
        );
});

// SECURE CONTROLLER
const getUserTweets = asyncHandler(async (request, response) => {
    // TODO: get user tweets
    const userID = request.user._id;
    const foundUser = await User.findById(userID);
    console.log(`LogiendUSr: ${ foundUser }`);

    if (!foundUser) {
        throw new ApiError(401, `Unauthorized user ID: ${userID}`);
    }

    // aggregation Query
    const aggregationQuery = [
        // Aggregation Stage 1: Filtering
        {
            $match: {
                owner: foundUser._id,
            },
        },

        // Little bit more filtering
        // Aggregation Stage 2: Extra Filtering
        {
            $project: {
                content: 1,
            },
        },
    ];

    const aggregationResult = await Tweet.aggregate(aggregationQuery);
    console.log(`Aggregation Result: ${aggregationResult}`);

    response
        .status(200)
        .json(
            new ApiResponse(
                200,
                { allTweets: aggregationResult },
                `All Tweets Gets Success UserID: ${foundUser._id}`,
            ),
        );
});

// SECURE CONTROLLER
const updateTweet = asyncHandler(async (request, response) => {
    //TODO: update tweet

    const userID = await request.user?._id;
    const { updatedContent, tweetID } = request.body;
    const loginedUser = await User.findById(userID);

    if (!loginedUser) {
        throw new ApiError(401, `Unauthorized User ID: ${userID}`);
    }

    if (!updatedContent || !tweetID) {
        throw new ApiError(400, `All Fields are required`);
    }

    const oldTweet = await Tweet.findById(tweetID);

    if (!oldTweet) {
        throw new ApiError(200, `oldTweet Not Found ID: ${tweetID}`);
    }

    oldTweet.content = updatedContent;
    const updatedTweet = await oldTweet
        .save({ validateBeforeSave: false })
        .then((updatedSaved) => {
            if (updatedSaved !== oldTweet) {
                throw new ApiError(500, `Tweet Updation Failed`);
            } else {
                return updatedSaved;
            }
        })
        .catch((errro) => {
            throw new ApiError(
                500`Error While Updating Tweet ID: ${oldTweet._id}`,
            );
        });

    console.log(`Updated Tweet: ${updatedTweet}`);
    response
        .status(200)
        .json(
            new ApiResponse(
                200,
                { updatedTweet },
                `Tweet ID :${tweetID} Updated Success`,
            ),
        );
});

// SECURE CONTROLLER
const deleteTweet = asyncHandler(async (request, response) => {
    //TODO: delete tweet

    const userID = await request.user._id;
    const loginedUser = await User.findById(userID);
    const { tweetID } = request.body;

    if (!tweetID) {
        throw new ApiError(400`Tweet ID required`);
    }

    console.log(`Logined User: ${loginedUser}`);

    const foundTweet = await Tweet.findById(tweetID);
    if (!foundTweet) {
        throw new ApiError(400, `No Tweet Found`);
    }

    await Tweet.findByIdAndDelete(tweetID);
    const isDelete = await Tweet.findById(tweetID);

    if (isDelete) {
        throw new ApiError(500, `Tweet ID: ${isDelete._id} Deletion Failed`);
    }

    response
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                `Tweet ID: ${tweetID} Delete Successfully`,
            ),
        );
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
