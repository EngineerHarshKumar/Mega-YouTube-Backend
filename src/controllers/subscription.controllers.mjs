import mongoose, { mongo } from "mongoose";
import { User } from "../models/user.model.mjs";
import { Subscription } from "../models/subscription.model.mjs";
import ApiError from "../utils/apiError.mjs";
import ApiResponse from "../utils/apiResponse.mjs";
import asyncHandler from "../utils/asyncHandler.mjs";


// creating a subscription, Its a secure controller user must be logined before making the subscription
const creatingSubscription = asyncHandler( async (request, response) => {
    
    const userID = request.user._id ;
    
    if ( !mongoose.isValidObjectId(userID) ) {
        throw new ApiError(
            400,
            `Invalid userID: ${ userID }`
        );
    }

    console.log(`LoginedUserID: ${ userID }`);
    const foundUser = await  User.findById( userID );
    
    if ( !foundUser ) {
        throw new ApiError(
            400,
            `User not Found with ID: ${ userID }`
        );
    }

    // This is the channel on which the user ( foundUser ) want to subcribed
    const { channelID } = request.body ;
    console.log(`ChannelID: ${ channelID }`);
    const foundChannel = await User.findById( channelID ) ;

    if ( !foundChannel ) {
        throw new ApiError(
            400,
            `No Channel Found`
        )
    }

    const newlyCreatedSubscription = await Subscription.create({
        subscriber: foundUser,
        channel: foundChannel
    });

    if ( !newlyCreatedSubscription ) {
        throw new ApiError(
            500,
            `Subscription Creation Failed`
        );
    }

    console.log(`newlyCreatedSubscription: ${ newlyCreatedSubscription }`);

    response    
        .status(201)
        .json(
            new ApiResponse(
                201,
                {newlyCreatedSubscription},
                `New Subcription Created Success`
            )
        );
})



// SECURE CONTROLLER
const toggleSubscription = asyncHandler(async (request, response) => {
    // TODO: toggle subscription

    // Under the Hood its a User
    const { channelID } = await request.params;
    const userChannel = await User.findById(channelID);
    const loginUser = await User.findById(request.user._id);

    console.log(`LoginUser: ${loginUser}`);

    try {
        // determining the status of whether the user is subscribed or not

        const exisitingSubscription = await Subscription.findOne({
            subscriber: loginUser,
            channel: userChannel,
        });

        console.log(`exisitingSubscription: ${exisitingSubscription}`);

        // if its exisiting subscriber
        if (exisitingSubscription) {
            await Subscription.findByIdAndDelete(exisitingSubscription._id);
            const isSubscriptionToggle = await Subscription.findById(
                exisitingSubscription._id,
            );

            if (isSubscriptionToggle) {
                throw new ApiError(
                    500,
                    `Subscriber ID: ${exisitingSubscription._id} Unsubscribed Failed`,
                );
            }

            return response
                .status(204)
                .json(
                    new ApiResponse(
                        204,
                        {},
                        `subscriber ID : ${loginUser._id} Unsubscribed Successfully`,
                    ),
                );
        } else {
            // if we are here it mean that use is not subscribed to this channel
            const newSubscription = await Subscription.create({
                subscriber: loginUser,
                channel: userChannel,
            });

            if (!newSubscription) {
                throw new ApiError(
                    500,
                    `new Subscription with ID : ${loginUser._id} Failed`,
                );
            }

            return response
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        { subscription: newSubscription },
                        `new subscription Success, channel ID : ${channelID}`,
                    ),
                );
        }
    } catch (error) {
        throw new ApiError(500, "Error while toggling the Subscription");
    }
});

// SECURE CONTROLLER
// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (request, response) => {
    // Its a User itself under the hood
    const { channel_Id } = request.params;

    if (!channel_Id) {
        throw new ApiError(400, "Channel_Id is Required");
    }

    const isChannel_IdValid = mongoose.isValidObjectId(channel_Id);

    if (!isChannel_IdValid) {
        throw new ApiError(400, "Channel_ID not valid");
    }

    // its a User but treate as Channel for better understanding
    const userChannel = await User.findById(channel_Id);

    if (!userChannel) {
        throw new ApiError(400, "userChannle Not Found");
    }

    // Aggregate Query
    const aggregateQuery = await User.aggregate([
        // First Stage Aggregation: Filtering The Documents
        {
            $match: {
                _id: userChannel._id,
            },
        },

        // Second Stage Aggregation:
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribersDocs",
            },
        },

        // Third Stage Aggregation
        {
            $addFields: {
                subscribersList: {
                    $first: "$subscribersDocs",
                    // You can also use below statement instead of above statement
                    // $arrayElementAt: ["$field", position]
                },
                countSubscribers: {
                    $size: "$subscribersDocs",
                },
            },
        },
    ]);

    if (!aggregateQuery) {
        throw new ApiError(500, "Aggregation Query Failed");
    }

    console.log(`Aggregation Query In Subscribers List: ${aggregateQuery}`);

    if (Array.isArray(aggregateQuery) && aggregateQuery.length > 0) {
        return response.status(200).json(
            new ApiResponse(
                200,
                {
                    List: aggregateQuery[0],
                },
                "Subscribers List Successfully Received",
            ),
        );
    }

    response
        .status(200)
        .json(
            new ApiResponse(
                200,
                { List: aggregateQuery[0] },
                "Subscribers List Successfully Received",
            ),
        );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (request, response) => {
    // its a User itself under the hood
    const { subscriber_ID } = request.params;

    if (!subscriber_ID) {
        throw new ApiError(400, "subscribed_ID is required");
    }

    const isSubscriber_IDValid = mongoose.isValidObjectId(subscriber_ID);

    if (!isSubscriber_IDValid) {
        throw new ApiError(400, "Given ID not valid");
    }

    const userSubscriber = await User.findById(subscriber_ID);

    if (!userSubscriber) {
        throw new ApiError(500, "User Not Found/ ID not Work");
    }

    console.log(`userSubscriber: ${userSubscriber}`);

    const aggregateQuery = await User.aggregate([
        // First Stage Aggregation
        {
            $match: {
                _id: userSubscriber._id
            },
        },

        // Second Stage Aggregation
        {
            // $lookup give me a array with a object ( 0th object is required )
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedChannelsByUser",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "subscriber",
                            foreignField: "_id",
                            as: "subscriber"
                        }
                    },

                    {
                        $lookup: {
                            from: "users",
                            localField: "channel",
                            foreignField: "_id",
                            as: "channel"
                        }
                    }
                ]
            },
        },
    ]);

    if (Array.isArray(aggregateQuery) && aggregateQuery.length > 0) {
        return response
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { List: aggregateQuery[0] },
                    "All Channels List Subscribed By User Get Successfully",
                ),
            );
    } else {
        throw new ApiError(200, "Get Subscribed Channel By User Failed");
    }
});


export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels, creatingSubscription };
