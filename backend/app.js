const express = require("express");
const cookieParser = require("cookie-parser");
const { corsConfig } = require("./src/config/cors.config.js");
const { requestLogger } = require("./src/middleware/requestLogger.js");
const { globalErrorHandler } = require("./src/middleware/errorHandler.js");
const { rateLimiter } = require("./src/middleware/rateLimiter.js");
const { api } = require("./src/routes/api.js");

const app = express();

app.use(requestLogger);
app.use(corsConfig());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter());
app.use(cookieParser());
app.use("/api/v1", api);
app.use(globalErrorHandler);

module.exports = app;
