const cors = require('cors');
const allowedOrigins = ['http:localhost:2000'];
const corsConfig = () => {
    return cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Authorization", "Content-Type","Accept-Version"],
        exposedHeaders: ["X-RateLimit-Remaining", "X-Request-Id","X-Total-Count","Content-Range"],
    	preflightContinue:false,
    	maxAge: 600,
    	optionsSuccessStatus: 204
    })
}
module.exports = {
    corsConfig
};