import { extractPublicId } from "cloudinary-build-url";

export const getPublic_IDFrom_URL = async (url) => {
    return extractPublicId(url);
};
