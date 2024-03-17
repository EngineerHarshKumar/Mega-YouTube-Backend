// import mongoose, { isValidObjectId } from "mongoose";
// import { Like } from "../models/like.model.js";
// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { asyncHandler } from "../utils/asyncHandler.js";

import ApiResponse from "../utils/apiResponse.mjs";
import ApiError from "../utils/apiError.mjs";
import asyncHandler from "../utils/asyncHandler.mjs";
import { User } from "../models/user.model.mjs";
import { Video } from "../models/video.model.mjs";
import { Like } from "../models/like.model.mjs";
import { Tweet } from "../models/tweet.model.mjs";
import { Comment } from "../models/comment.model.mjs";
import mongoose from "mongoose";

// SECURE CONTROLLER
const toggleVideoLike = asyncHandler(async (request, response) => {
    //TODO: toggle like on video
    const { videoId } = request.params;
    const userID = await request.user._id;
    const loginedUser = await User.findById(userID);

    if (!videoId) {
        throw new ApiError(400, `VideoID required`);
    }

    if (!loginedUser) {
        throw new ApiError(401, `Unauthorized user/ UserID: ${userID}`);
    }

    const videoFile = await Video.findById(videoId);

    const videoLike = await Like.findOne(
        {
            videoFile: videoFile._id,
            likedBy: loginedUser._id
        }
    );
    
    if ( videoLike ) {

        // if we are found the videoFile its mean their is like and we have to delete that like

        await Like.deleteOne({
            _id: videoLike._id
        });

        const isToggled = await Like.findById( videoLike._id );
        if  ( isToggled ) {
            throw new ApiError(
                500,
                `Toggling Failed (UnLike)`
            );
        }

        return response
                    .status(200)
                    .json(
                        new ApiResponse(
                            200,
                            {},
                            `Toggling Success (UnLike)`
                        )
                    );
    } else {
        // Now their is not Like we have to create the new Like

        const newlyCreatedVideoLike = await Like.create(
            {
                likedBy: loginedUser,
                videoFile
            }
        );

        if ( !newlyCreatedVideoLike ) {
            throw new ApiError(
                500,
                `Toggling Failed ( Like )`
            );
        }

        return response
                    .status(201)
                    .json(
                        new ApiResponse(
                            200,
                            {newlyCreatedVideoLike},
                            `Toggling Success ( Like )`
                        )
                    );
    }
});

// SECURE CONTROLLER
const toggleCommentLike = asyncHandler(async (request, response) => {
    //TODO: toggle like on comment
    const { commentId } = request.params;

    console.log(`CommentId: ${commentId}`);
    
    const userID = request.user._id;
    const foundUser = await User.findById( userID ) ;

    if ( !foundUser ) {
        throw new ApiError(
            401,
            `Unauthorized User/ Login First`
        );
    }

    if (!commentId) {
        throw new ApiError(400, `CommentID required`);
    }

    const foundComment = await Comment.findById(commentId);
    const loginedUser = await User.findById(userID);

    if (!foundComment) {
        throw new ApiError(400, `Comment Not Found ID: ${commentId}`);
    }

    if (!loginedUser) {
        throw new ApiError(401, `Unauthorized User/ ID : ${userID}`);
    }

   const foundLike = await Like.findOne(
        {
            likedBy: loginedUser._id,
            comment: foundComment._id
        }
   );

   console.log(`foudLike: ${ foundLike }`);

    if ( foundLike ) {

        // If we have the Instance It mean that we are have to delete that instance

        await Like.deleteOne({
            _id: foundLike._id
        });

        const isToggled = await Like.findById( foundLike._id );
        if ( isToggled ) {
            throw new ApiError(
                500,
                `Error While Deleting Instance ( Toggling )`
            );
        }

        return response
                    .status(200)
                    .json(
                        new ApiResponse(
                            200,
                            {},
                            `Comment Toggling Success (UnLike)`
                        )
                    );

    } else {
        // if we are not getting any instance then we have to create new

        const newlyCreatedCommentLike = await Like.create({
            likedBy: foundUser,
            comment: foundComment
        });

        if ( !newlyCreatedCommentLike ) {
            throw new ApiError(
                500,
                `Server Error/ Like Creation Failed`
            );
        }

        return response
                        .status(201)
                        .json(
                            new ApiResponse(
                                201,
                                {newlyCreatedCommentLike},
                                `Toggling Success (Like)`
                            )
                        );
    }    
});

// SECURE CONTROLLER
const toggleTweetLike = asyncHandler(async (request, response) => {
    //TODO: toggle like on tweet
    const { tweetId } = request.params;
    const userID = await request.user._id;
    const loginedUser = await User.findById(userID);

    if (!tweetId) {
        throw new ApiError(400, `Tweet ID required`);
    }

    if (!loginedUser) {
        throw new ApiError(401, `Unauthorized user/ ID: ${userID}`);
    }

    const foundTweet = await Tweet.findById(tweetId);

    if (!foundTweet) {
        throw new ApiError(400, `Tweet Not Found/ ID :${tweetId}`);
    }

    const aggregateResult = await Like.aggregate([
        {
            $match: {
                tweet: foundTweet,
                likedBy: loginedUser,
            },
        },
    ]);

    console.log(`AggregateResult: ${aggregateResult}`);

    if (aggregateResult.length) {
        //  if its have the length it mean that the user is like the tweet And our task to delete that document

        await Like.findOneAndDelete({
            tweet: foundTweet,
            likedBy: loginedUser,
        });

        const isToggled = await Like.findById(tweetId);
        if (isToggled) {
            throw new ApiError(500, `Exists: Toggling Failed`);
        }

        return response
            .status(204)
            .json(new ApiResponse(204, {}, `Exists Toggled Success`));
    } else {
        // Their is no any liked now we have to create new like
        const newlyCreatedLiked = await Like.create({
            tweet: foundTweet,
            likedBy: loginedUser,
        });

        if (!newlyCreatedLiked) {
            throw new ApiError(500, `Create: Toggling Failed`);
        }

        return response
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    { newTweetLike: newlyCreatedLiked },
                    `Create: Toggling Success`,
                ),
            );
    }
});

// About Controller: This Controller is secure controller and and it return the all videos whose owner is loginedUser and that video which have the like  does't matter by who user is liked
const getLikedVideos = asyncHandler(async (request, response) => {
    //TODO: get all liked videos

    const userID = await request.user._id;
    const user = await User.findById(userID);

    if (!user) {
        throw new ApiError(401, `Unauthorized/ ID :${userID}`);
    }

    const aggregateQuery = [
        {
            $match: {
                owner: user,
            },
        },

        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "videoFile",
                as: "likes",
            },
        },

        {
            $project: {
                _id: 1,
                description: 1,
                title: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                likedBy: "$likes.likedBy",
            },
        },
    ];

    const aggregateResult = await Video.aggregate(aggregateQuery);

    console.log(`AggregationResult: ${aggregateResult}`);

    if (!aggregateResult) {
        throw new ApiError(500, `Aggregation Process Failed`);
    }

    response
        .status(200)
        .json(
            new ApiResponse(
                200,
                { likedVideo: aggregateResult },
                `Get All Liked Video Success`,
            ),
        );
});


// SECURE CONTROLLER
const createNewLike = asyncHandler( async (request, response) => {

    const userID = request.user._id ;
    const foundUser = await User.findById( userID ) ;

    if ( !foundUser ) {
        throw new ApiError(
            401,
            `User Must Be Logid ID: ${ userID }`
        );
    }

    // get data as a String
    const { onWhichLikeOccured } = request.body ;
    if ( !onWhichLikeOccured ) {
        throw new ApiError(
            400,
            `onWhichLikedOccured required`
        );
    }

    const { commentID, videoID, tweetID } = request.body
    if ( !commentID && !videoID &&  !tweetID ) {
        throw new ApiError(
            400,
            `Give me Atleast one ID on which Like occured`
        );
    }


    if ( (onWhichLikeOccured === "comment") && (!commentID) ) {
        throw new ApiError(
            400,
            `Comment Like Occured but not Comment ID Received`
        )
    } else if ( (onWhichLikeOccured === "video") && (!videoID) ) {
        throw new ApiError(
            400,
            `Video Like Occured but not Video ID Received`
        )
    } else if ( (onWhichLikeOccured === "tweet") && (!tweetID) ) {
        throw new ApiError(
            400,
            `Tweet Like Occured but not Tweet ID Received`
        )
    }


    if ( onWhichLikeOccured === "comment") {

        const comment = await Comment.findById( commentID );
        if ( !comment ) {
            throw new ApiError(
                400,
                `No Comment Found ID : ${ commentID }`
            );
        }
        
        const newlyCreatedCommentLike = await Like.create({
            likedBy: foundUser,
            comment
        });

        if ( !newlyCreatedCommentLike) {
            throw new ApiError(
                500,
                `Comment Like Creationg Failed`
            );
        }

        return response
                        .status(201)
                        .json(
                            new ApiResponse(
                                201,
                                {newlyCreatedCommentLike},
                                `New Comment Like Created Successfully`
                            )
                        );
    } else if ( onWhichLikeOccured === "video") {

        const video = await Video.findById( videoID ) ;
        if ( !video ) {
            throw new ApiError(
                400,
                `Video Not Found ID: ${ videoID }`
            );
        }

        const newlyCreatedVideoLike = await Like.create({
            likedBy: foundUser,
            videoFile: video
        });

        if ( !newlyCreatedVideoLike ) {
            throw new ApiError(
                500,
                `New Video Like Creation Failed`
            );
        }

        return response
                        .status(201)
                        .json(
                            new ApiResponse(
                                201,
                                {newlyCreatedVideoLike},
                                `New Video Like Created Successfully`
                            )
                        );
    } else {
        // Here mean that we have to create the like for the tweet as we already check for the 2 ( comment & video )

        const tweet = await Tweet.findById( tweetID ) ;
        if ( !tweet ) {
            throw new ApiError(
                400,
                `Tweet Not Found ID: ${ tweet }`
            );
        }

        const newlyCreatedTweetLike = await Like.create({
            likedBy: foundUser,
            tweet
        });

        if ( !newlyCreatedTweetLike ) {
            throw new ApiError(
                500,
                `New Tweet Like Creation Failed`
            )
        }

        return response
                        .status(201)
                        .json(
                            new ApiResponse(
                                201,
                                {newlyCreatedTweetLike},
                                `New Tweet Created Successfully`
                            )
                        );
    }
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos , createNewLike};
