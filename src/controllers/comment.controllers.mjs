import mongoose from "mongoose";
import ApiError from "../utils/apiError.mjs";
import ApiResponse from "../utils/apiResponse.mjs";
import asyncHandler from "../utils/asyncHandler.mjs";
import { User } from "../models/user.model.mjs";
import { Comment } from "../models/comment.model.mjs";
import { Video } from "../models/video.model.mjs";

// UNSECURE CONTROLLER
const getVideoComments = asyncHandler(async (request, response) => {
    //TODO: get all comments for a video
    const { videoId } = request.params;
    const { page = 1, limit = 10 } = request.query;
    const videoFile = await Video.findById(videoId);

    if (!videoFile) {
        throw new ApiError(400, `Invalid VidoeID :${videoId}`);
    }

    // Aggregation Query
    const aggregateQuery = await Comment.aggregate([
        // Aggregation Stage 1 : Filtering
        {
            $match: {
                videoFile: videoFile._id,
            },
        },

        {
            $lookup: {
                from: "users",
                localField: "commentBy",
                foreignField: "_id",
                as: "commentBy"
            }
        },

        // Aggregation Stage 2: projecting entities
       {
            $project: {
                content: 1,
                commentBy: 1 
            }
       }
    ]);

    console.log(`Comment Aggregation Result: ${ aggregateQuery }`);

    const options = {
        page,
        limit,
    };

    const callBack = function (err, result) {
        if (err) {
            throw new ApiError(500, `Aggregate Paginate Failed in callBack`);
        }

        console.log(`aggregatePaginateResult : ${result}`);

        return result;
    };

    const aggregatePaginateResult = await Comment.aggregatePaginate(
        aggregateQuery,
        options,
        callBack,
    );


    if (!aggregatePaginateResult) {
        throw new ApiError(500, `Aggregate Paginate Failed`);
    }

    response
        .status(200)
        .json(
            new ApiResponse(
                200,
                { comments: aggregatePaginateResult },
                `All Comments Received Video ID : ${videoFile._id}`,
            ),
        );
});

// SECURE CONTROLLER
const addComment = asyncHandler(async (request, response) => {
    // TODO: add a comment to a video

    if (!request.user) {
        throw new ApiError(400, "User Not Login. Please Login First");
    }

    const userID = await request.user._id;

    const user = await User.findById(userID);

    console.log(`User in addComment: ${user}`);

    if (!user) {
        throw new ApiError(400, "Not User Found/ Invalid Id");
    }

    const { comment, video_ID } = request.body;

    if (!comment || !video_ID) {
        throw new ApiError(400, "All Fields are required");
    }

    const videoFile = await Video.findById(video_ID);

    if (!videoFile) {
        throw new ApiError(400, "No Video Found");
    }

    const newComment = await Comment.create({
        commentBy: user,
        content: comment,
        videoFile,
    });

    console.log(`NewComment in addComment: ${newComment}`);

    if (!newComment) {
        throw new ApiError(500, "Comment Creation Failed");
    }

    response
        .status(201)
        .json(
            new ApiResponse(
                201,
                { newComment },
                "New Comment created Successfully",
            ),
        );
});

// SECURE CONTROLLER
const updateComment = asyncHandler(async (request, response) => {
    // TODO: update a comment

    if (!request.user) {
        throw new ApiError(401, "User Not Login. Please Login First");
    }

    const userID = await request.user._id;
    const user = await User.findById(userID);

    if (!user) {
        throw new ApiError(400, "User Not Found");
    }

    const { newCommentMessage, comment_ID } = await request.body;

    if (!newCommentMessage || !comment_ID) {
        throw new ApiError(400, "All Fields are required");
    }

    const commentInstance = await Comment.findById(comment_ID);

    if (!commentInstance) {
        throw new ApiError(400, "Not Comment Found For Updation");
    }

    console.log(`commentInstance: ${commentInstance}`);

    commentInstance.content = newCommentMessage;
    await commentInstance
        .save({ validateBeforeSave: false })
        .then((updatedComment) => {
            if (updatedComment !== commentInstance) {
                throw new ApiError(200, "Comment Updation Failed");
            } else {
                return response
                    .status(200)
                    .json(
                        new ApiResponse(
                            200,
                            { updatedComment },
                            `CommentID: ${commentInstance._id} is updated successfully`,
                        ),
                    );
            }
        })
        .catch((error) => {
            console.log(
                `Error while updating the comment\nERROR: ${error.message}`,
            );
            throw new ApiError(500, `commentId: ${comment_ID} is not updated.`);
        });
});

// SECURE CONTROLLER
const deleteComment = asyncHandler(async (request, response) => {
    // TODO: delete a comment

    if (!request.user) {
        throw new ApiError(401, "User Not Login. Please Login First");
    }

    const { comment_ID } = await request.body;

    if (!comment_ID) {
        throw new ApiError(400, "All Field are required");
    }

    const commentInstance = await Comment.findById(comment_ID);

    if (!commentInstance) {
        throw new ApiError(400, `Comment Not Found With ID: ${comment_ID}`);
    }

    await commentInstance.deleteOne();
    const isDeleted = await Comment.findById(commentInstance._id);

    if (isDeleted) {
        throw new ApiError(
            500,
            `CommentId: ${commentInstance._id} Deletion Failed`,
        );
    }

    response
        .status(200)
        .json(
            new ApiError(
                200,
                {},
                `CommentId: ${commentInstance._id} Delete Successfully`,
            ),
        );
});

export { getVideoComments, addComment, updateComment, deleteComment };
