import { Subscription } from "../models/subscription.model.mjs";
import { Like } from "../models/like.model.mjs";
import { Video } from "../models/video.model.mjs";
import asyncHandler from "../utils/asyncHandler.mjs";
import ApiError from "../utils/apiError.mjs";
import ApiResponse from "../utils/apiResponse.mjs";
import { User } from "../models/user.model.mjs";
import mongoose from "mongoose";

// const getChannelStatus = asyncHandler(async (request, response) => {
//     // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

//     const channelID = request.params;
//     console.log(`channelID: ${ channelID }`);

//     const channel = await User.findById( channelID );
//     if ( !channel ) {
//         throw new ApiError(
//             400,
//             `Not Channel Found`
//         );
//     }

//     await User.aggregate(
//         [
//             {
//                 _id: channel._id
//             },

//             {
//                 $lookup: {
//                     from: "videos",
//                     localField: "_id",
//                     foreignField: "owner",
//                     as: "allVideso",
//                     pipeline: [

//                         {
//                             $lookup: {
//                                 from: "users",
//                                 localField: "owner",
//                                 foreignField: "_id",
//                                 as: "owner"
//                             }
//                         }
//                     ]
//                 }
//             },

//             {
//                 $lookup: {
//                     from: "subscriptions",
//                     localField: "_id",
//                     foreignField: "channel",
//                     as: "subscribersDocs"
//                 }
//             },


//             {
//                 $lookup: {
//                     from : "likes",
//                     localField: "_id",
//                     foreignField: "likedBy",
//                     as: "AllLikesByCurrentUser"
//                 }
//             },

//             {
//                 $lookup: {
//                     from: "likes",
//                     let : {localId: "$_id"},
//                     pipeline: [
//                         {
//                             $match: {
//                                 $expr: {
//                                     $in: ["$$localId", "$likes"]
//                                 }
//                             }
//                         }
//                     ]
//                 }
//             }
//         ]
//     );

// });

const getChannelVideosAndPlaylist = asyncHandler(async (request, response) => {
    // TODO: Get all the videos uploaded by the channel

    const {channelID} =request.params;
    console.log(`ChannelID: ${ channelID }`);
    const channel = await User.findById(channelID);

    if (!channel) {
        throw new ApiError(400, `Channel Not Found/ ID : ${channelID}`);
    }

    console.log(`Channel: ${channel}`);

    const videos = await Video.find(
        {
            owner: channel
        }
    ) ;   

    const aggregateResult = await Video.aggregate(
        [
            {
                $match: {
                    owner: channel._id
                }
            }
        ]
    );

    console.log(`AggregateRsult: ${ aggregateResult}`);
    response
        .status(200)
        .json(
            new ApiResponse(
                200,
                { channelVideos: aggregateResult },
                `Channel all Videos Get Success`,
            ),
        );
});

export { getChannelVideosAndPlaylist };
