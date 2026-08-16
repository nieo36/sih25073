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
    if (err instanceof APIError) {
        return res.status(err.statusCode).json({
            status: 'Error',
            message: err.message
        })
    } else {
        return res.status(500).json({
            status: "error",
            message: "Unexpected error occured"
        })
    }
    next();
}
module.exports = {
    asyncHandler,
    globalErrorHandler
};