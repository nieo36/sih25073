const express = require('express');
const { getCandidatesHandler } = require('../controller/recruiter.controller.js');
const { verifyAccessToken } = require('../utils/token.js');
const { user } = require('../model/user.model.js');

const recruiterRouter = express.Router();

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const verifyToken = await verifyAccessToken(token);
    const profile = await user.findById(verifyToken.sub);
    if (profile) {
      req.userInfo = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        isEmailVerified: profile.isEmailVerified,
      };
    }
  } catch (err) {
  }
  next();
}

recruiterRouter.get('/candidates', optionalAuth, getCandidatesHandler);

module.exports = { recruiterRouter };
