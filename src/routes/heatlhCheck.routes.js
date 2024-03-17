import express from "express";
import { verifyJWT } from "../middleware/veriyJWT.middleware.mjs";
import { healthcheck } from "../controllers/healthCheck.controllers.mjs";

const healthCheckRoute = express.Router();


// Single Router
healthCheckRoute
    .route("/healthchecking")
    .get(
        verifyJWT,
        healthcheck
    );

export default healthCheckRoute;