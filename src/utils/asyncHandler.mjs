const asyncHandler = (Fn) => async (request, response, next) => {
    try {
        return await Fn(request, response, next);
    } catch (error) {
        if (error) {
            response.status(error.code || 500).json({
                success: false,
                message: error.message,
            });
        }
    }
};

export default asyncHandler;
