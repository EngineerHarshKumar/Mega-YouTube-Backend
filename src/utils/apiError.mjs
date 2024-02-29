class ApiError extends Error {
    constructor(
        statusCode,
        message = "somethings is wrong",
        error = [],
        stack = "",
    ) {
        super(message);
        this.statusCode = statusCode;
        this.errors = error;
        this.message = message;
        this.data = null;
        this.success = false;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ApiError;
