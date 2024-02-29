import { v2 as cloudinary } from "cloudinary";
import { configENV } from "../config/env.config.mjs";

export const cloudinaryConfig = cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});
