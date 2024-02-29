import { response } from "express";
import { User } from "../models/user.model.mjs";
import ApiError from "../utils/apiError.mjs";
import asyncHandler from "../utils/asyncHandler.mjs";
import jwt from "jsonwebtoken";

const verifyJWT = asyncHandler(async (request, response, next) => {
    try {
        const authHeader =
            request.headers["authorization"] || request.cookies?.accessToken;

        if (!authHeader) {
            return response.status(401).json({
                "error message": "unauthorized user",
            });
        }

        const token = authHeader.split(" ")[1] || request.cookies.accessToken;

        // now we have to make the verification of the jwt token
        jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET,
            async (err, decoded) => {
                if (err) {
                    return response.sendStatus(403);
                }

                // Extra verification of Token
                const userID = decoded?._id;

                // find the user from the database using this id
                const foundedUser = await User.findById(userID);

                if (!foundedUser) {
                    throw new ApiError(401, "Unauthorized User");
                }

                request.user = await User.findById(foundedUser._id)
                    .select("-password")
                    .exec();
                next();
            },
        );
    } catch (error) {
        throw new ApiError(
            error.statusCode,
            `Erro in VerifyJWT: ${error.message}`,
        );
    }
});

export { verifyJWT };
