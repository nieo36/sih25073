const express = require('express');
const { auth } = require('./auth/auth.route.js');
const { assessmentRouter } = require('./assessment.route.js');
const { leaderboardRouter } = require('./leaderboard.route.js');
const { recruiterRouter } = require('./recruiter.route.js');

const api = express.Router();

api.use("/auth", auth);
api.use("/assessment", assessmentRouter);
api.use("/leaderboard", leaderboardRouter);
api.use("/recruiter", recruiterRouter);

module.exports = { api };