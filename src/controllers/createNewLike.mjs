import ApiError from "../utils/apiError.mjs";
import asyncHandler from "../utils/asyncHandler.mjs";
import { User } from "../models/user.model.mjs";

// SECURE CONTROLLER
const createNewLike = asyncHandler(async (request, response) => {

    const userID = request.user._id;
    const foundUser = await User.findById(userID);

    if (!foundUser) {
        throw new ApiError(
            401,
            `User Must Be Logid ID: ${userID}`
        );
    }

    // get data as a String
    const { onWhichLikeOccured } = request.body;
    if (!onWhichLikeOccured) {
        throw new ApiError(
            400,
            `onWhichLikedOccured required`
        );
    }

    const { commentID, videoID, tweetID } = request.body;
    if (!commentID || !videoID || !tweetID) {
        throw new ApiError(
            400,
            `Give me Atleast one ID on which Like occured`
        );
    }


    if ((onWhichLikeOccured === "comment") && (!commentID)) {
        throw new ApiError(
            400,
            `Comment Like Occured but not Comment ID Received`
        );
    } else if ((onWhichLikeOccured === "video") && (!videoId)) {
    }

});
