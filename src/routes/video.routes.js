import express from "express";
import { verifyJWT } from "../middleware/veriyJWT.middleware.mjs";
import {
    publishAVideo,
    getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
} from "../controllers/video.controllers.mjs";

import { uploadMulter } from "../middleware/multer.middleware.mjs";

const videoRoute = express.Router();

// Publishing a Video
videoRoute.route("/publish").post(
    // Here we have to get 2 things first video which I want to upload and the second one is the image for the video thumbnail

    verifyJWT,
    // its work like a middleware
    uploadMulter.fields([{ name: "videoFile" }, { name: "thumbnail" }]),

    publishAVideo,
);

// Getting All videos
videoRoute.route("/all-videos").get(verifyJWT, getAllVideos);

// Getting Video By ID
videoRoute.route("/getVideo/:videoID").get(verifyJWT, getVideoById);

// Updating the video by ID
videoRoute
    .route("/upating-video/:videoId")
    .patch(verifyJWT, uploadMulter.single("thumbnail"), updateVideo);

// Deleting the video
videoRoute.route("/delete-video/:videoId").delete(verifyJWT, deleteVideo);

videoRoute
    .route("/toggling-publishing/:videoId")
    .patch(verifyJWT, togglePublishStatus);

export default videoRoute;
