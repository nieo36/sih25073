const cors = require('cors');

const corsConfig = () => {
    return cors({
        origin(origin, callback) {
            if (!origin) {
                return callback(null, true);
            }

            if (
                process.env.NODE_ENV !== 'production' ||
                /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
                origin === process.env.CLIENT_URL ||
                origin === process.env.APP_URL
            ) {
                return callback(null, true);
            }

            return callback(null, true);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Authorization",
            "Content-Type",
            "Accept",
            "Accept-Version",
            "X-Requested-With",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
        ],
        exposedHeaders: ["X-RateLimit-Remaining", "X-Request-Id", "X-Total-Count", "Content-Range"],
        preflightContinue: false,
        maxAge: 86400,
        optionsSuccessStatus: 200,
    });
};

module.exports = {
    corsConfig,
};