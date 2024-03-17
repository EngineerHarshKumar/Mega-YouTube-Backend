import asyncHandler from "../utils/asyncHandler.mjs";
import ApiError from "../utils/apiError.mjs";
import ApiResponse from "../utils/apiResponse.mjs";
import { User } from "../models/user.model.mjs";

// SECURE CONTROLLER
const healthcheck = asyncHandler(async (request, response) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message

    if (!request.user) {
        throw new ApiError(401, `Unauthorized User`);
    }

    const loginUser = await User.findById(request.user._id);
    if (!loginUser) {
        throw new ApiError(
            401,
            `Unauthorized User with ID: ${request.user._id}`,
        );
    }

    response
        .status(200)
        .json(
            new ApiResponse(200, {}, `Health Check Login ID: ${loginUser._id}`),
        );
});

export { healthcheck };
