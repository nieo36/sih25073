const express = require('express');
const { auth } = require('./auth/auth.route.js');
const { requireAuth } = require('../middleware/auth.js');

const api = express.Router();

api.use("/auth", auth);

module.exports = { api };