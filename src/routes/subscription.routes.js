import express from "express";
import { 
        creatingSubscription, 
        getSubscribedChannels, 
        getUserChannelSubscribers, 
        toggleSubscription
} from "../controllers/subscription.controllers.mjs";
import { verifyJWT } from "../middleware/veriyJWT.middleware.mjs";

const subscriptionRoute = express.Router();


// creating new Subscription Route
subscriptionRoute
    .route("/create-subscription")
    .post(
        verifyJWT,
        creatingSubscription
    );


// get Subscribed Channel of User
subscriptionRoute
    .route("/get-subscribed-channels/:subscriber_ID")
    .get(
        verifyJWT,
        getSubscribedChannels
    );


// get subscribers of user Channel
subscriptionRoute
    .route("/get-subscribers/:channel_Id")
    .get(
        verifyJWT,
        getUserChannelSubscribers
    );


// Toggling Subscription
subscriptionRoute
    .route("/toggling-subscription")
    .patch(
        verifyJWT,
        toggleSubscription
    );


export default subscriptionRoute ;