import express, { response } from "express";
import {
    registerNewUser,
    loginUser,
    logoutUser,
    refreshTokening,
    changePassword,
    getCurrentUser,
    updatingAccountDetails,
    updatingAvatarImage,
    updatingCoverImage,
} from "../controllers/user.controllers.mjs";
import { uploadMulter } from "../middleware/multer.middleware.mjs";
import { verifyJWT } from "../middleware/veriyJWT.middleware.mjs";

const userRouter = express.Router();

userRouter
    .route("/register")
    .post(
        uploadMulter.fields([{ name: "avatar" }, { name: "coverImage" }]),
        registerNewUser,
    );

userRouter.route("/login").post(loginUser);

userRouter.route("/getData").get(verifyJWT, (request, response) => {
    response.status(200).json({
        messag: "Data Access Granted",
    });
});

userRouter.route("/logout").get(verifyJWT, logoutUser);

userRouter.route("/refreshing").get(refreshTokening);

userRouter.route("/change-password").patch(verifyJWT, changePassword);

userRouter.route("/current-user").get(verifyJWT, getCurrentUser);

userRouter
    .route("/update-account-details")
    .post(verifyJWT, updatingAccountDetails);

userRouter
    .route("/update-avatar")
    .post(uploadMulter.single("avatar"), verifyJWT, updatingAvatarImage);

userRouter
    .route("/update-coverImage")
    .post(uploadMulter.single("coverImage"), verifyJWT, updatingCoverImage);

export default userRouter;
