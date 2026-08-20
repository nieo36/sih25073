const cors = require('cors');

const allowedOrigins = [
    'http://localhost:2000',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:2000',
    'http://127.0.0.1:3000',
    process.env.APP_URL,
    process.env.CLIENT_URL,
].filter(Boolean);

const corsConfig = () => {
    return cors({
        origin(origin, callback) {
            if (
                !origin ||
                allowedOrigins.includes(origin) ||
                process.env.NODE_ENV !== "production" ||
                /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
            ) {
                return callback(null, true);
            }
            callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Authorization", "Content-Type", "Accept-Version"],
        exposedHeaders: ["X-RateLimit-Remaining", "X-Request-Id", "X-Total-Count", "Content-Range"],
        preflightContinue: false,
        maxAge: 600,
        optionsSuccessStatus: 204
    });
};

module.exports = {
    corsConfig
};