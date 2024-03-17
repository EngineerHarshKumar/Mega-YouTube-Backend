import asyncHandler from "../utils/asyncHandler.mjs";
import ApiError from "../utils/apiError.mjs";
import ApiResponse from "../utils/apiResponse.mjs";
import { User } from "../models/user.model.mjs";
import { uploadOnCloudinary } from "../utils/uploadingCloudinary.mjs";
// import { response, request, urlencoded } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { getPublic_IDFrom_URL } from "../utils/getPublic_ID.mjs";
import { deleteFileFromCloudinary } from "../utils/deleteFileFromCloudinary.mjs";

const registerNewUser = asyncHandler(async (request, response) => {
    const { userName, fullName, email, password } = request.body;

    console.log(`userName: ${userName}`);

    if (!userName || !fullName || !email || !password) {
        throw new ApiError(400, "All field are required");
    }

    // vaildate for not already registered
    const foundUser = await User.findOne({ userName });

    console.log(`foundUser: ${foundUser}`);

    if (foundUser) {
        throw new ApiError(409, `${userName} is already exists`);
    }

    const avatarLocalPath = await request.files?.avatar[0]?.path;
    console.log(`avatarLocalPath: ${avatarLocalPath}`);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar File is required");
    }

    let coverImageLocalPath;

    if (
        request.files &&
        Array.isArray(request.files.coverImage) &&
        request.files.coverImage.length > 0
    ) {
        coverImageLocalPath = await request.files.coverImage[0].path;
    }

    console.log(`coverImagLocalPath: ${coverImageLocalPath}`);

    // now we have to upload this file on the cloudinary

    const avatarCloudinaryInstance = await uploadOnCloudinary(
        avatarLocalPath,
        "image",
    );

    if (!avatarCloudinaryInstance?.url) {
        throw new ApiError(500, "avatar file not uploaded");
    }

    let coverImageCloudinaryInstance;

    // we are only uploading the coverImage on the cloudinary only if the coverImage is avaialable to us
    if (coverImageLocalPath) {
        coverImageCloudinaryInstance = await uploadOnCloudinary(
            coverImageLocalPath,
            "image",
        );
    }

    // All done now we have to write & create new user in the database
    const newlyCreatedUser = await User.create({
        userName,
        email,
        password,
        fullName,
        avatar: avatarCloudinaryInstance.url,
        coverImage: coverImageCloudinaryInstance?.url ?? "",
    });

    const validateNewUser = await User.findById(newlyCreatedUser._id)
        .select("-password")
        .lean()
        .exec();

    if (!validateNewUser) {
        throw new ApiError(500, `${userName} is not created in the database`);
    }

    // All-Done
    response
        .status(201)
        .json(
            new ApiResponse(
                201,
                { user: validateNewUser },
                `${userName} is created in Database`,
            ),
        );
});

const generateAccessRefreshToken = async function (userID) {
    const foundUser = await User.findById(userID);

    if (!foundUser) {
        throw new ApiError(400, "Invalid userID/ User not found by this ID");
    }

    const accessToken = await foundUser.generateAccessToken();
    const refreshToken = await foundUser.generateRefreshToken();

    // foundUser.refreshToken = refreshToken ;
    // foundUser.save({validateBeforeSave: false});

    const updatedUser = await User.findByIdAndUpdate(userID, {
        $set: {
            refreshToken: refreshToken,
        },
    });

    // await updatedUser.save({validateBeforeSave: false});

    return {
        accessToken,
        refreshToken,
    };
};

const loginUser = asyncHandler(async (request, response) => {
    /*
        Steps for login the user
        1. Get Details of the user
        2. validate that I gor the detail from the user
        3. validate that user is exists from the given data
        4. make sure that password is correct
        5. generate the token accessToken for specific time (expire time)
        6. generate the refreshToken
        7. store the refresh Token in the database with the user 
        8. give the accessToken to the client as response

    */

    const { password, userName, email } = request.body;

    if (!email && !userName) {
        throw new ApiError(400, "email or username atleast one is required");
    }

    // now validate that password is received
    if (!password) {
        throw new ApiError(400, "Password Must be Required");
    }

    // find user
    const existsUser = await User.findOne({
        $or: [{ userName }, { email }],
    });

    if (!existsUser) {
        throw new ApiError(400, `${userName} is not registered user`);
    }

    // if we are getting the user that already registered now we have to make sure that password ( provided ) is match

    const isPasswordCorrect = await existsUser.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Password is wrong");
    }

    // At this point password is correct and user is exits now generate the access Token and also the refresh Token
    const { accessToken, refreshToken } = await generateAccessRefreshToken(
        existsUser._id,
    );

    // console.log(`accessToken: ${ accessToken}`);
    // console.log(`refreshToken: ${ refreshToken}`);

    const cookieOption = {
        secure: true,
        httpOnly: true,
    };

    response
        .status(200)
        .cookie("accessToken", accessToken, cookieOption)
        .cookie("refreshToken", refreshToken, cookieOption)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken,
                },
                `${existsUser.fullName} successfully Login`,
            ),
        );
});

const logoutUser = asyncHandler(async (request, response) => {
    const user = await request.user;
    console.log(`user: ${user}`);

    const updatedUser = await User.findById(user._id);

    updatedUser.refreshToken = "";

    await updatedUser.save({ validateBeforeSave: false });

    console.log(`updatedUser: ${updatedUser}`);

    // response.clearCookie("accessToken", cookieOption);
    // response.clearCookie()

    const cookieOption = {
        secure: true,
        httpOnly: true,
    };

    response
        .status(200)
        .clearCookie("accessToken", cookieOption)
        .clearCookie("refreshToken", cookieOption)
        .json(
            new ApiResponse(
                200,
                {},
                `${updatedUser.userName} is logout Successfully`,
            ),
        );
});

const refreshTokening = asyncHandler(async (request, response) => {
    const cookies = request.cookies || null;
    console.log(`cookies: ${cookies}`);

    if (!cookies) {
        throw new ApiError(400, "cookies not available");
    }

    const refreshTokenFromCookies = request.cookies.refreshToken;
    console.log(`refreshTokenFromCookies: ${refreshTokenFromCookies}`);

    jwt.verify(
        refreshTokenFromCookies,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if (err) {
                console.log(`refreshining error: ${err.message}`);
                return response
                    .status(400)
                    .json({ "error message": "Invalid Token" });
            }

            const userID = decoded._id;
            const user = await User.findById(userID)
                .select("-password")
                .lean()
                .exec();
            console.log(`user: ${user}`);

            const isRefreshTokenCorrect =
                user.refreshToken === refreshTokenFromCookies;

            if (!isRefreshTokenCorrect) {
                throw new ApiError(401, "Token is not matching");
            }

            const {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            } = await generateAccessRefreshToken(userID);

            console.log(`newAccessToken: ${newAccessToken}`);
            console.log(`newRefreshToken: ${newRefreshToken}`);

            const cookieOption = {
                secure: true,
                httpOnly: true,
            };

            response
                .status(200)
                .cookie("accessToken", newAccessToken, cookieOption)
                .cookie("refreshToken", newRefreshToken, cookieOption)
                .json(
                    new ApiResponse(
                        200,
                        {
                            newAccessToken,
                            newRefreshToken,
                        },
                        "New Access & Refresh Token generated",
                    ),
                );
        },
    );
});

const changePassword = asyncHandler(async (request, response) => {
    const { oldPassword, newPassword } = request.body;

    console.log(`oldPassword: ${oldPassword}\nNewPassword: ${newPassword}`);

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "All Fields are Required");
    }

    const user = await User.findById(request.user._id);

    if (!user) {
        throw new ApiError(400, "User not Found");
    }

    // Now check whether the oldPassword is correct or not
    const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isOldPasswordCorrect) {
        throw new ApiError(400, "Wrong Password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    response
        .status(200)
        .json(new ApiResponse(200, { user }, "Password is correct"));
});

// secure controller
const getCurrentUser = asyncHandler(async (request, response) => {
    const user = request.user;

    if (!user) {
        throw new ApiError(401, "Unauthorized User/ Not login");
    }

    response
        .status(200)
        .json(
            new ApiResponse(200, { user }, "Getting Current User SuccessFully"),
        );
});

// SECURE CONTROLLER
const updatingAccountDetails = asyncHandler(async (request, response) => {
    /*
    we are only allow the user to update the fullname and the email
    Steps for updating the account details 

        1. Getting the username and the email
        2. validate that we are received the fullnam or email
        3. now getting the user from the database through using request.user
        4. if user not found throw the error
        5. if user found update the information
        6. validate that the data is updated in the database
        7. if updated Its Good 
        8. if its not throw the Error
        9. return the updated user
    */

    const { fullName, email } = request.body;

    if (!fullName && !email) {
        throw new ApiError(
            400,
            `Atleast one Field are required, FullName or Email`,
        );
    }

    const updatingFullName = fullName ? true : false;
    const updatingEmail = email ? true : false;
    const userID = request.user;
    // const foundedUser = await User.findById(userID).exec();

    if (updatingFullName) {
        const updateFullNameUser = await User.findByIdAndUpdate(
            userID,
            {
                $set: {
                    fullName: fullName,
                },
            },
            { new: true },
        );

        const isFullNameUpdated = updateFullNameUser.fullName === fullName;

        if (!isFullNameUpdated) {
            throw new ApiError(500, "FullName is not updated");
        } else {
            console.log(
                `FullName is update \n New FullName: ${updateFullNameUser.fullName}`,
            );
        }
    }

    if (updatingEmail) {
        const updatedEmailUser = await User.findByIdAndUpdate(
            userID,
            {
                $set: {
                    email: email,
                },
            },
            { new: true },
        );

        const isEmailUpdated = (await updatedEmailUser.email) === email;
        if (!isEmailUpdated) {
            throw new ApiError(500, "Email is not updated");
        } else {
            console.log(
                `Email is updated/ New Email: ${updatedEmailUser.email}`,
            );
        }
    }

    const updatedUser = await User.findById(request.user._id);

    if (updatingEmail && updatingEmail) {
        const isAllUpated =
            updatedUser.email === email && updatedUser.fullName === fullName;

        if (!isAllUpated) {
            throw new ApiError(500, "Updationg Failed");
        }
    } else if (updatingEmail) {
        const isEmailUpdated = updatedUser.email === email;

        if (!isEmailUpdated) {
            throw new ApiError(500, "Email updation Failed");
        }
    } else {
        const isFullNameUpdated = updatedUser.fullName === fullName;

        if (!isFullNameUpdated) {
            throw new ApiError(500, "FullName updation Failed");
        }
    }

    response
        .status(200)
        .json(
            new ApiResponse(
                200,
                { user: updatedUser },
                `${updatedUser.fullName} is updated with FullName: ${updatedUser.fullName} and email: ${updatedUser.email}`,
            ),
        );
});

// SECURE CONTROLLER
const updatingAvatarImage = asyncHandler(async (request, response) => {
    const userID = request.user._id;
    const foundUser = await User.findById(userID);

    if (!foundUser) {
        throw new ApiError(401, "Unauthorized User");
    }

    const avatarLocalPath = request.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatarLocalPath is not received");
    }

    // Now we have to try to upload on the cloudinary
    const avatarInstance = await uploadOnCloudinary(avatarLocalPath, "image");

    if (!avatarInstance) {
        throw new ApiError(500, "Avatar Image uploading Failed");
    }

    // at this stage we uploading the new fie successfully Now we have to delete the image ( old Image ) from the cloudinary and

    const public_ID = await getPublic_IDFrom_URL(foundUser.avatar);

    console.log(`Public_ID in avatar updation: ${public_ID}`);

    await deleteFileFromCloudinary(public_ID, "image")
        .then((result) => {
            console.log(
                `Result in delete File from Cloudinary in user controller: ${result}`,
            );
        })
        .catch((error) => {
            throw new ApiError(
                500,
                `Error while delete File From Cloudinary: ${error.message}`,
            );
        });

    const avatarUpdatedUser = await User.findByIdAndUpdate(
        foundUser._id,
        {
            $set: {
                avatar: avatarInstance.url,
            },
        },
        { new: true },
    );

    const isAvatarUpdated = avatarUpdatedUser.avatar === avatarInstance.url;

    if (!isAvatarUpdated) {
        throw new ApiError(500, "Avatar is not updated");
    }

    response
        .status(200)
        .json(
            new ApiResponse(
                200,
                { user: avatarUpdatedUser },
                "Avatar is updated Successfully",
            ),
        );
});

// SECURE ROUTE
const updatingCoverImage = asyncHandler(async (request, response) => {
    const userID = request.user._id;
    const foundUser = await User.findById(userID);

    if (!foundUser) {
        throw new ApiError(401, "Unauthorized/ Please Login First");
    }

    const coverImageLocalPath = request.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "CoverImage not received");
    }

    const coverImageInstance = await uploadOnCloudinary(
        coverImageLocalPath,
        "image",
    );

    if (!coverImageInstance) {
        throw new ApiError(500, "CoverImage Uploading Failed");
    }

    // here we are successfully uploading the new coverImage Now we have to delete the file

    const public_ID = await getPublic_IDFrom_URL(foundUser.coverImage);

    await deleteFileFromCloudinary(public_ID, "image")
        .then((result) => {
            console.log(
                `Result in delete File from Cloudinary in user controller: ${result}`,
            );
        })
        .catch((error) => {
            throw new ApiError(
                500,
                `Error while delete File From Cloudinary: ${error.message}`,
            );
        });

    const coverImageUpdatedUser = await User.findByIdAndUpdate(
        foundUser._id,
        {
            $set: {
                coverImage: coverImageInstance.url,
            },
        },
        { new: true },
    );

    const isCoverImageUpdated =
        coverImageInstance.url === coverImageUpdatedUser.coverImage;

    if (!isCoverImageUpdated) {
        throw new ApiError(500, "CoverImage Not Updated");
    }

    response
        .status(200)
        .json(
            new ApiResponse(
                200,
                { user: coverImageUpdatedUser },
                "CoverImage is Updated Successfully",
            ),
        );
});

const gettingChannelDetails = asyncHandler(async (request, response) => {
    const { userName } = request.params;

    if (!userName.trim()) {
        throw new ApiError(400, "userName is not accessible");
    }

    /*
    Task To Do:

    1. count the subscribers
    2. count the subscribedTo
    3. Add the Fields to the original Data
    */

    const channel = await User.aggregate([
        // First Stage of Aggregation
        {
            $match: {
                userName: userName,
            },
        },

        // Second Stage of Aggregation
        {
            // Creating a Group
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscriberDocs",
            },
        },

        // Third Stage of Aggregation
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedToDocs",
            },
        },
        {
            $addFields: {
                subscribers: {
                    $size: "$subscriberDocs",
                },
                subscribedTo: {
                    $size: "$subscribedToDocs",
                },

                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [
                                request.user?._id,
                                "$subscribedToDocs.subscriber",
                            ],
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },

        {
            $project: {
                username: 1,
                fullName: 1,
                email: 1,
                isSubscribed: 1,
                subscribers: 1,
                subscribedTo: 1,
                avatar: 1,
                coverImage: 1,
            },
        },
    ]);

    if (!channel.length) {
        throw new ApiError(400, "Channel is not Exits");
    }

    response
        .status(200)
        .json(
            new ApiResponse(
                200,
                { channelDetails: channel[0] },
                "User Channel Details Received Successfully",
            ),
        );
});

const gettingUserWatchHistory = asyncHandler(async (request, response) => {
    const userID = request.user._id;

    await User.aggregate([
        // First Stage Aggregation: Filtering the document
        {
            $match: {
                _id: new mongoose.Types.ObjectId.request.user._id(),
            },
        },

        // Second Stage Aggregation: Grouping
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    // First SubpipeLine Aggregation
                    // Now I am in Videos Model
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        email: 1,
                                        avatar: 1,
                                        coverImag: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                ],
            },
        },
    ]);
});

// changePassword not work
export {
    registerNewUser,
    loginUser,
    logoutUser,
    refreshTokening,
    changePassword,
    getCurrentUser,
    updatingAccountDetails,
    updatingAvatarImage,
    updatingCoverImage,
    gettingChannelDetails,
    gettingUserWatchHistory,
};
