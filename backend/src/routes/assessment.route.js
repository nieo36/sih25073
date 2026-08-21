const express = require('express');
const {
  syncAssessment,
  batchSyncAssessments,
  getHistory,
} = require('../controller/assessment.controller.js');
const { verifyAccessToken } = require('../utils/token.js');
const { user } = require('../model/user.model.js');

const assessmentRouter = express.Router();

/**
 * Middleware that extracts user info from Bearer token if present,
 * but allows unauthenticated / offline sync requests to proceed.
 */
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
    // Non-fatal for optional auth
  }
  next();
}

assessmentRouter.post('/sync', optionalAuth, syncAssessment);
assessmentRouter.post('/batch-sync', optionalAuth, batchSyncAssessments);
assessmentRouter.get('/history', optionalAuth, getHistory);

module.exports = { assessmentRouter };
