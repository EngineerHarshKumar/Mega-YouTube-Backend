import mongoose, { mongo } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new mongoose.Schema(
    {
        // Who comment it ( User )
        commentBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // What is the Comment ?
        content: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        // On Which Video the Comment occured ?
        videoFile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
            required: true,
        },
    },

    { timestamps: true },
);

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment", commentSchema);
