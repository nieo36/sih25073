class APIError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "APIError";
    }
}
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
}
const globalErrorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Handle PayloadTooLargeError (body-parser limit exceeded)
    if (err.type === 'entity.too.large' || err.status === 413) {
        return res.status(413).json({
            status: 'error',
            message: 'Request body is too large. Please reduce payload size.',
        });
    }

    if (err instanceof APIError) {
        return res.status(err.statusCode).json({
            status: 'Error',
            message: err.message
        });
    } else {
        return res.status(500).json({
            status: "error",
            message: "Unexpected error occured"
        });
    }
}
module.exports = {
    asyncHandler,
    globalErrorHandler
};