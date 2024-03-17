// import mongoose, { isValidObjectId } from "mongoose";
import mongoose from "mongoose";
import { Playlist } from "../models/playList.model.mjs";
import ApiError from "../utils/apiError.mjs";
import ApiResponse from "../utils/apiResponse.mjs";
import asyncHandler from "../utils/asyncHandler.mjs";
import { User } from "../models/user.model.mjs";
import { uploadOnCloudinary } from "../utils/uploadingCloudinary.mjs";
import { Video } from "../models/video.model.mjs";

// SECURE CONTROLLER
const createPlaylist = asyncHandler(async (request, response) => {
    //TODO: create playlist

    if (!request.user) {
        throw new ApiError(401, "Unauthorized/ Please Login First");
    }

    const user_ID = await request.user._id;
    const user = await User.findById(user_ID);

    if (!user) {
        throw new ApiError(400, "No User Found");
    }

    // Now we have to get requirement from the user
    const { playlistName, playlistDescription, videoTitle, videoDescription } =
        await request.body;

    if (
        !playlistName ||
        !playlistDescription ||
        !videoTitle ||
        !videoDescription
    ) {
        throw new ApiError(400, "All Fields are required");
    }

    // Now we ensure that we got the videoFile and the thumbnail Image
    if (!request.files) {
        throw new ApiError(400, "Request.files are not accessible");
    }

    const videoFileLocalPath = await request.files.videoFile[0].path;
    const thumbnailLocalPath = await request.files.thumbnail[0].path;

    if (!videoFileLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Vidoe and Thumbnail Required");
    }

    console.log(`videoFileLocalPath: ${videoFileLocalPath}`);
    console.log(`thumnailLocalPath: ${thumbnailLocalPath}`);

    // Now try to uploading the videoFile and thumbnail Image on the cloudinary

    const videoFileCloudinaryInstance = await uploadOnCloudinary(
        videoFileLocalPath,
        "video",
    );
    const thumbnailCloudinaryInstance = await uploadOnCloudinary(
        thumbnailLocalPath,
        "image",
    );

    if (!videoFileCloudinaryInstance?.url) {
        throw new ApiError(500, "VideoFile Upload Cloudinary Failed");
    }

    if (!thumbnailCloudinaryInstance?.url) {
        throw new ApiError(500, "Thumbnail Image Upload Cloudinary Failed");
    }

    console.log(`videoFileCloudinaryInstance: ${videoFileCloudinaryInstance}`);
    console.log(
        `ThumbnailImageCloudinaryInstance: ${thumbnailCloudinaryInstance}`,
    );

    const newlyCreatedVideo = await Video.create({
        videoFile: videoFileCloudinaryInstance.url,
        thumbnail: thumbnailCloudinaryInstance.url,
        owner: user,
        title: videoTitle,
        description: videoDescription,
        duration: videoFileCloudinaryInstance.duration,
    });

    if (!newlyCreatedVideo) {
        throw new ApiError(500, "VieoFile Creation Failed");
    }

    console.log(`created Video: ${newlyCreatedVideo}`);

    // Now we are ready for creating the plyalist

    const newlyPlaylistCreated = await Playlist.create({
        name: playlistName,
        description: playlistDescription,
        owner: user,
        videos: [newlyCreatedVideo],
    });

    if (!newlyPlaylistCreated) {
        throw new ApiError(500, "Playlist Creation Failed");
    }

    console.log(`NewlyCreatedPlaylist: ${newlyPlaylistCreated}`);

    response
        .status(201)
        .json(
            new ApiResponse(
                201,
                { newPlaylist: newlyPlaylistCreated },
                `Playlist's ${newlyPlaylistCreated.name} is created Successfull`,
            ),
        );
});

// SECURE CONTROLLER
const getUserPlaylists = asyncHandler(async (request, response) => {
    //TODO: get user playlists

    if (!request.user) {
        throw new ApiError(401, "Unauthorized User/ Please Login First");
    }

    const { userId } = request.params;
    const isUser_IDValid = mongoose.isValidObjectId(userId);

    if (!isUser_IDValid) {
        throw new ApiError(400, "UserID not valid");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(401, "Unauthorized/ user Not Found");
    }

    console.log(`User in getting All Playlist: ${user}`);

    // Aggregate Result
    const aggregateResult = await Playlist.aggregate([
        // First Stage Aggregation: Fitlering

        {
            $match: {
                owner: user._id,
            },
        },

        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
            },
        },

        {
            $project: {
                name: 1,
                description: 1,
                owner: 1,
                videos: {
                    $filter: {
                        input: "$videos",
                        as: "video",
                        cond: {
                            $eq: ["$$video.isPublished", true],
                        },
                    },
                },
            },
        },
    ]);

    // const aggregateResult = await User.aggregate(
    //     [
    //         {
    //             $lookup: {
    //                 from: "$playlists",
    //                 localField: user._id,
    //                 foreignField: "owner",
    //                 as: "allPlaylists"
    //             },
    //         },

    //         {
    //             $first: "$allPlaylists"
    //         }
    //     ]
    // );

    console.log(`Aggregation Result: ${aggregateResult}`);

    if (!aggregateResult && !(aggregateResult.length > 0)) {
        throw new ApiError(500, "Aggregation Failed");
    }

    response
        .status(200)
        .json(
            new ApiResponse(
                200,
                { playlists: aggregateResult },
                "User's All Playlists Get Successfully",
            ),
        );
});

const getPlaylistById = asyncHandler(async (request, response) => {
    //TODO: get playlist by id
    const { playlistID } = request.params;

    if (!playlistID) {
        throw new ApiError(400, "PlayList ID required.");
    }

    const isPlaylistIDValid = mongoose.isValidObjectId(playlistID);

    if (!isPlaylistIDValid) {
        throw new ApiError(400, `Playlist Id: ${playlistID} Not Valid`);
    }

    const foundPlaylist = await Playlist.findById(playlistID);
    if (!foundPlaylist) {
        throw new ApiError(500, "N0 Playlist Found");
    }

    const aggregateResult = await Playlist.aggregate([
        {
            $match: {
                _id: foundPlaylist._id,
            },
        },

        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
            },
        },

        {
            $project: {
                name: 1,
                description: 1,
                isPublished: 1,
                videos: {
                    $filter: {
                        input: "$videos",
                        as: "eachVideo",
                        cond: {
                            $eq: ["$$eachVideo.isPublished", true],
                        },
                    },
                },
            },
        },
    ]);

    response
        .status(200)
        .json(
            new ApiResponse(
                200,
                { playlist: aggregateResult },
                `Playlist Found Success With ID: ${foundPlaylist._id}`,
            ),
        );
});

// SECURE CONTROLLER
const addVideoToPlaylist = asyncHandler(async (request, response) => {
    if (!request.user) {
        throw new ApiError(401, "Unauthorized User/ Please Login First");
    }

    const { playlistID, videoID } = request.params;

    console.log(`PlaylistID: ${playlistID}`);
    console.log(`VideoID: ${videoID}`);

    if (!playlistID || !videoID) {
        throw new ApiError(400, "PlaylistId && videoId required");
    }

    const foundPlaylist = await Playlist.findById(playlistID);
    const foundVideo = await Video.findById(videoID);

    if (!foundPlaylist) {
        throw new ApiError(500, `Playlist With ID: ${playlistID} Not Found`);
    }

    if (!foundVideo) {
        throw new ApiError(500, `Vidoe With ID: ${videoID} Not Found`);
    }

    // VERY VERY IMPORTANT STATEMENT FOR THE ENTIRE FUNCTION
    await foundPlaylist.videos.push(foundVideo);

    const updatedPlaylist = await foundPlaylist
        .save({ validateBeforeSave: false })
        .then((savedPlaylist) => {
            if (savedPlaylist !== foundPlaylist) {
                return null;
            } else {
                return savedPlaylist;
            }
        })
        .catch((error) => {
            throw new ApiError(
                500,
                `Adding Video PlayList's ID: ${foundPlaylist._id} Failed`,
            );
        });

    if (!updatedPlaylist) {
        throw new ApiError(
            500,
            `Adding Video PlayList's ID: ${foundPlaylist._id} Failed`,
        );
    }

    response
        .status(200)
        .json(
            new ApiResponse(
                200,
                { updatedPlaylist },
                `PlayList With ID: ${updatedPlaylist._id} Updated With Video ID: ${updatedPlaylist.videos[1]._id}`,
            ),
        );
});

const removeVideoFromPlaylist = asyncHandler(async (request, response) => {
    const { playlistID, videoID } = request.params;
    // TODO: remove video from playlist

    console.log(`PlaylistID: ${playlistID}`);
    console.log(`videoID: ${videoID}`);

    if (!playlistID || !videoID) {
        throw new ApiError(400, "All Fielda are required");
    }

    const foundPlaylist = await Playlist.findById(playlistID);
    const foundVideo = await Video.findById(videoID);

    if (!foundPlaylist) {
        throw new ApiError(400, `Playlist with ID: ${playlistID} Not Found`);
    }

    if (!foundVideo) {
        throw new ApiError(400, `Vidoe With ID: ${videoID} Not Found`);
    }

    const aggregationResult = await Playlist.aggregate([
        {
            $match: {
                _id: foundPlaylist._id,
            },
        },

        {
            $project: {
                videos: {
                    $filter: {
                        input: "$videos",
                        as: "eachVideo",
                        cond: {
                            // Here "$$" is used to reference the variable created within the aggregation Pipeline
                            $ne: ["$$eachVideo", foundVideo._id],
                        },
                    },
                },
            },
        },
    ]);

    await Playlist.updateOne(
        { _id: foundPlaylist._id },
        { $pull: { videos: foundVideo._id } },
    );

    if (!aggregationResult) {
        throw new ApiError(500, "Aggregation Result Failed");
    }

    console.log(`Aggregation result: ${aggregationResult}`);

    response
        .status(200)
        .json(
            new ApiResponse(
                200,
                { updatedPlaylist: aggregationResult },
                `Video ID: ${videoID} Remove From Playlist's ID: ${foundPlaylist._id}`,
            ),
        );
});

const deletePlaylist = asyncHandler(async (request, response) => {
    const { playlistID } = request.params;
    // TODO: delete playlist

    const playList = await Playlist.findById(playlistID);

    if (!playList) {
        throw new ApiError(400, `No Playlist Found With ID: ${playlistID}`);
    }

    await playList.deleteOne();

    const isDeleted = await Playlist.findById(playlistID);

    if (isDeleted) {
        throw new ApiError(500, `Playlist's ID: ${playList} Deletion Failed`);
    }

    response
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                `Playlist 's ID: ${playList} Delete Successfully`,
            ),
        );
});

// SECURE CONTROLLER
// From this controller I only provide to update the name of the playlist and its description nothing other
const updatePlaylist = asyncHandler(async (request, response) => {
    //TODO: update playlist

    const { playlistID } = request.params;
    const { name, description } = request.body;

    if (!playlistID || !name || !description) {
        throw new ApiError(400, "All Field are required");
    }

    const foundPlaylist = await Playlist.findById(playlistID);

    if (!foundPlaylist) {
        throw new ApiError(400, `No playlist Found ID: ${playlistID}`);
    }

    foundPlaylist.name = name;
    foundPlaylist.description = description;

    const updatedPlaylist = await foundPlaylist
        .save({ validateBeforeSave: false })
        .then((savedPlaylist) => {
            if (savedPlaylist !== foundPlaylist) {
                return null;
            } else {
                return savedPlaylist;
            }
        })
        .catch((error) => {
            throw new ApiError(
                500,
                `Error During Updating Playlist/ERROR: ${error.message}`,
            );
        });

    if (!updatePlaylist) {
        throw new ApiError(
            500,
            `PlayList Updation Failed ID: ${foundPlaylist._id}`,
        );
    }

    response
        .status(200)
        .json(
            new ApiResponse(
                200,
                { updatedPlaylist },
                `Playlist updated successfully ID: ${updatePlaylist._id}`,
            ),
        );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
