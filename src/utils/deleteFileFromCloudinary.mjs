import { configENV } from "../../config/env.config.mjs";
import { cloudinaryConfig } from "../../config/cloudinary.config.mjs";
import ApiError from "./apiError.mjs";
import { v2 as Cloudinary } from "cloudinary";

export const deleteFileFromCloudinary = async (public_ID, resource_type) => {
    if (!public_ID) {
        throw new ApiError(400, `Public_ID is required`);
    }
    console.log(`Trying to delete the file from cloudinary.......`);

    try {
        const cloudinaryInstance = await Cloudinary.uploader.destroy(
            public_ID,
            { resource_type, invalidate: true },
            async (error, result) => {
                if (error) {
                    throw new Error(error.message);
                } else {
                    console.log(`result cloudinary delete: ${result}`);
                }
            },
        );

        console.log(`Cloudinary Delete Instance: ${cloudinaryInstance}`);
        return cloudinaryInstance;
    } catch (error) {
        throw new ApiError(500, `Delete File From Cloudinary Failed`);
    }
};
