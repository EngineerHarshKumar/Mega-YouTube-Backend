import mongoose, { mongo } from "mongoose";
import { Video } from "../models/video.model.mjs";
import { User } from "../models/user.model.mjs"; 
import ApiError from "../utils/apiError.mjs";
import ApiResponse from "../utils/apiResponse.mjs";
import asyncHandler from "../utils/asyncHandler.mjs"
import { uploadOnCloudinary } from "../utils/uploadingCloudinary.mjs";


// SECURE CONTROLLER
const getAllVideos = asyncHandler(async (request, response) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = request.query
    // TODO: get all videos based on query, sort, pagination

    const foundUser = await User.findById(userId);

    if ( !foundUser ) {
        throw new ApiError(
            400,
            "User Not Found"
        );
    }

    console.log(`FoundUser: ${ foundUser }`);

    const options = {
        page,
        limit,
        sort: sortType || "ascending"
    };

    const videoAggregationQuery = await Video.aggregate([
        
        // First Aggregation
        {
            $match: {
                owner: foundUser
            }
        },
    ]);

    console.log(`videoAggregation: ${ videoAggregationQuery }`);

    const paginateResult = await Video.aggregatePaginate(
        videoAggregationQuery,
        options,
        callBack
    );
    
    const callBack = function (error, result) {
        if ( error ) {
            throw new ApiError(
                500,
                "Error in Video Aggregation CallBack"
            );
        }

        console.log(`result: ${ result  }`);
        return result ;
    };

    console.log(`paginateResult: ${ paginateResult}`);

    response
        .status(200)
        .json(
            new ApiResponse(
                200,
                {videos: paginateResult},
                "Videos Data Successfully Get"
            )
        );
});

// SECURE CONTROLLER
const publishAVideo = asyncHandler(async (request, response) => {
    const { title, description} = request.body;
    // TODO: get video, upload to cloudinary, create video

    if ( !title || !description ) {
        throw new ApiError(
            400,
            "Title & Description are required"
        );
    }

    const isRequestFileAccessible = await request.files ;

    if ( !isRequestFileAccessible ) {
        throw new ApiError(
            400,
            "request.Files are not accessible"
        );
    }

    const videoLocalPath = await request.files.videoFile[0].path ;
    const thumbnailLocalPath = await request.files.thumbnail[0].path ;

    if ( !videoLocalPath ) {
        throw new ApiError(
            400,
            "Video File Not Received"
        );
    }

    if ( !thumbnailLocalPath ) {
        throw new ApiError(
            400,
            "Thumbnail File Not Received"
        );
    }

    // Files are received Now we have to try to uploading the file on the cloudinary and the URL of it.

    const videoFileCloudinaryInstance = await uploadOnCloudinary(videoLocalPath);
    
    if ( !videoFileCloudinaryInstance?.url ) {
        throw new ApiError(
            500,
            "Video File Cloudinary Uploading Failed"
        );
    }

    const thumbnailCloudinaryInstance = await uploadOnCloudinary(thumbnailLocalPath);

    if ( !thumbnailCloudinaryInstance?.url ) {
        throw new ApiError(
            500,
            "Thumbnail Cloudinary Uploading Failed"
        );
    }

    const isUserIdValid = await mongoose.isValidObjectId(request.user._id);

    if ( !isUserIdValid) {
        throw new ApiError(
            400,
            "userID is not valid"
        );
    }

    const user = await User.findById(request.user._id);

    if ( !user ) {
        throw new ApiError(
            400,
            "No User Found"
        );
    }


    console.log(`User in Video Published: ${ user }`);


    // Now write in the database

    const newCreatedVideo = await Video.create({
        videoFile: videoFileCloudinaryInstance.url,
        thumbnail: thumbnailCloudinaryInstance.url,
        owner: user,
        title,
        description,  
    });

    if ( !newCreatedVideo ) {
        throw new ApiError(
            500,
            "Video File Not Creat"
        );
    }

    console.log(`newCreateVideo: ${ newCreatedVideo }`);

    response  
        .status(201)
        .json(
            new ApiResponse(
                201,
                {video: newCreatedVideo},
                `${title} video is created Successfully`
            )
        );
});

const getVideoById = asyncHandler(async (request, response) => {
    const { videoId } = request.params
    //TODO: get video by id

    if ( !videoId ) {
        throw new ApiError(
            400,
            "VideoID not accessible"
        );
    }

    // Now we have to trying to getting the video from the database

    const videoFile = await Video.findById(videoId);

    if ( !videoFile ) {
        throw new ApiError(
            500,
            "Video File Not Received From Database"
        );
    }


    // If you received the videoFile then we have to return as response

    response
        .status(200)
        .json(
            new ApiResponse(
                200,
                {video: videoFile},
                `${videoFile.title} is received by ID Successfully`
            )
        );
});

const updateVideo = asyncHandler(async (request, response) => {

    const { videoId } = request.params;
    //TODO: update video details like title, description, thumbnail

    const { title, description } = request.body ;

    if ( !title || description ) {
        throw new ApiError(
            400,
            "All Fields are required"
        );
    }

    const isRequestFilesAccessible = await request.file ;

    if ( !isRequestFilesAccessible ) {
        throw new ApiError(
            400,
            "Request.Files are not accessible"
        );
    }

    const thumbnailLocalPath = await request.file?.thumbnail ;

    if ( !thumbnailLocalPath ) {
        throw new ApiError(
            400,
            "Thumbnail Not Received"
        );
    };

    const videoFile = await Video.findById(videoId);

    if ( !videoFile ) {
        throw new ApiError(
            400,
            "Invalid Id/ Video Not Found"
        );
    }


    console.log(`VideoFile in Updating: ${ videoFile }`);

    const thumbnailCloudinaryInstance = await uploadOnCloudinary(thumbnailLocalPath);

    if ( !thumbnailCloudinaryInstance?.url ) {
        throw new ApiError(
            500,
            "New Thumbnail Uploading Failed"
        );
    }

    // Updating the Video File
    videoFile.title = title ;
    videoFile.description = description ;
    videoFile.thumbnail = thumbnailCloudinaryInstance.url ;

    // Always using the "await" whenenver you are woring with the database calls
    const isVideoFileUpdated = await  videoFile.save({ validateBeforeSave: false })
        .then((savedVideoFile) => {
            videoFile === savedVideoFile ;
            return true ;
        })
        .catch((err) => {
            console.log(`Error while saving the Document\nError: ${ err.message }`);
            return false ;
        });
        

    if ( !isVideoFileUpdated ) {
        throw new ApiError(
            500,
            "VideoFile is not updated"
        );
    }


    response
        .status(200)
        .json(
            new ApiResponse(
                200,
                {updatedVideoFile: videoFile},
                `${videoFile.title} is updated Successfully`
            )
        );
});

const deleteVideo = asyncHandler(async (request, response) => {
    const { videoId } = request.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (request, response) => {
    const { videoId } = request.params
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};