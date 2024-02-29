import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const configENV = dotenv.config({
    path: path.join(__dirname, "..", ".env"),
});
