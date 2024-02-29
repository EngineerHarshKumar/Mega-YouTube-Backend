import { cloudinaryConfig } from "../../config/cloudinary.config.mjs";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import fsPromises from "fs/promises";

export const uploadOnCloudinary = async (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error("File path does not exists");
        } else {
            console.log(`File is exists.....`);
        }

        console.log(`Trying to uploading file on cloudinary`);

        const cloudinaryResponse = await cloudinary.uploader.upload(
            filePath,
            async (err, result) => {
                if (err) {
                    throw new Error("Error on Cloudinary Uploading");
                } else {
                    console.log(`Upload Succesfully`);
                    await fsPromises.unlink(filePath);
                    console.log(`File delete from server successfully`);
                }
            },
        );

        console.log(`CloudinaryResponse: ${cloudinaryResponse}`);
        console.log(`Cloudinary URL: ${cloudinaryResponse.url}`);
        return cloudinaryResponse;
    } catch (error) {
        console.log(`Error while uploading file on cloudinary`);
        console.log(`ERROR: ${error.message}`);

        // we are want to remove the file from the server as the that file some kind of error through which the file is not uploade on the cloudinary

        await fsPromises.unlink(filePath);

        // exit proces
        process.exit(1);
    }
};
