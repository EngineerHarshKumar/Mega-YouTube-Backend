import { uploadOnCloudinary } from "./src/utils/uploadingCloudinary.mjs";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const instance = await uploadOnCloudinary(path.join(__dirname, "251642.webp"));
console.log(`url: ${instance.url}`);
