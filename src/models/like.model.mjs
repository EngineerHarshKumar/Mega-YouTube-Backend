import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
    {
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            index: true 
        },

        videoFile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
            index: true 
        },

        likedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true 
        },

        tweet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tweet",
            index: true 
        },
    },
    { timestamps: true },
);

export const Like = mongoose.model("Like", likeSchema);
