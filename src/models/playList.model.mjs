import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            index: true,
        },

        description: {
            type: String,
            required: true,
            lowercase: true,
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Its Collection of Video
        videos: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
                required: true,
            },
        ],
    },
    { timestamps: true },
);

export const Playlist = mongoose.model("Playlist", playlistSchema);
