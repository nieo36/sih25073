const express = require('express');
const { auth } = require('./auth/auth.route.js');
const { assessmentRouter } = require('./assessment.route.js');

const api = express.Router();

api.use("/auth", auth);
api.use("/assessment", assessmentRouter);

module.exports = { api };