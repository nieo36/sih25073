const express = require('express');
const {
    loginHandler,
    registerHandler,
    verifyEmailHandler,
    refreshTokenHandler,
    logoutHandler,
    forgotPasswordHandler,
    resetPasswordHandler,
    googleAuthStartHandler,
    googleAuthCallbackHandler,
    twoFactorSetupHandler,
    twoFactorVerifyHandler,
    updateProfileHandler,
} = require('../../controller/auth/auth.controller.js');
const { requireAuth } = require('../../middleware/auth.js');
const auth = express.Router();

auth.post("/login", loginHandler);
auth.post("/register", registerHandler);
auth.get("/verify-email", verifyEmailHandler);
auth.post("/refresh", refreshTokenHandler);
auth.post("/logout", logoutHandler);
auth.post("/forgot-password", forgotPasswordHandler);
auth.post("/reset-password", resetPasswordHandler);
auth.get("/google", googleAuthStartHandler);
auth.get("/google/callback", googleAuthCallbackHandler);
auth.post("/2fa/setup", requireAuth, twoFactorSetupHandler);
auth.post("/2fa/verify", requireAuth, twoFactorVerifyHandler);
auth.put("/profile", requireAuth, updateProfileHandler);

module.exports = { auth };
