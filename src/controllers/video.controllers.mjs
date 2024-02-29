import mongoose from "mongoose";
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

        






})

const publishAVideo = asyncHandler(async (request, response) => {
    const { title, description} = request.body
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (request, response) => {
    const { videoId } = request.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (request, response) => {
    const { videoId } = request.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (request, response) => {
    const { videoId } = request.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (request, response) => {
    const { videoId } = request.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}