import express from "express";
import { verifyJWT } from "../middleware/veriyJWT.middleware.mjs";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
} from "../controllers/playlist.controllers.mjs";
import { uploadMulter } from "../middleware/multer.middleware.mjs";

const playlistRoute = express.Router();

// creating New Playlist
playlistRoute.route("/create").post(
    verifyJWT,

    uploadMulter.fields([{ name: "videoFile" }, { name: "thumbnail" }]),
    createPlaylist,
);

// Getting User ( logined User ) Playlist
playlistRoute
    .route("/get-playlist-user/:userId")
    .get(verifyJWT, getUserPlaylists);

// Getting Playlist by playlist ID
playlistRoute
    .route("/get-playlist-Id/:playlistID")
    .get(verifyJWT, getPlaylistById);

// Add New Videos to the playlist
playlistRoute
    .route("/add-video-playlist/:playlistID/:videoID")
    .patch(verifyJWT, addVideoToPlaylist);

// Delete Video From Playlist
playlistRoute
    .route("/remove-video-playlist/:playlistID/:videoID")
    .patch(verifyJWT, removeVideoFromPlaylist);

// Delete Playlsit
playlistRoute
    .route("/delete-playlist/:playlistID")
    .delete(verifyJWT, deletePlaylist);

// Updating Playlist
playlistRoute
    .route("/updating-playlist/:playlistID")
    .patch(verifyJWT, updatePlaylist);

export default playlistRoute;
