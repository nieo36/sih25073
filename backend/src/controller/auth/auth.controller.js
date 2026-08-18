const { registerSchema, loginSchema } = require("./auth.schema.js");
const { hashPassword, compareHash } = require("../../utils/hash.js");
const {
    createRefreshToken,
    createAccessToken,
    verifyRefreshToken,
} = require("../../utils/token.js");
const { sendEmail } = require("../../utils/email.js");
const { user } = require("../../model/user.model.js");
const { OAuth2Client } = require("google-auth-library");
const { authenticator } = require("otplib");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function getAppUrl() {
    return process.env.APP_URL ?? "http://localhost:2000";
}

function getClientUrl() {
    return process.env.CLIENT_URL ?? "http://localhost:3000";
}

function getGoogleClient() {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientSecret || !clientId) {
        throw new Error("Google auth credentials missing");
    }

    return new OAuth2Client({ clientId, clientSecret, redirectUri });
}

async function registerHandler(req, res) {
    try {
        const result = registerSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                message: "Invalid Data",
                errors: result.error.flatten(),
            });
        }
        const { name, email, password } = result.data;
        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await user.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(409).json({
                message: "email already in use! Try with different email",
            });
        }
        const hashedPassword = await hashPassword(password);

        const profile = await user.create({
            email: normalizedEmail,
            passwordHash: hashedPassword,
            name: name,
            isEmailVerified: false,
            twoFactorAuth: false,
        });

        const verifyToken = jwt.sign(
            {
                sub: profile.id,
            },
            process.env.JWT_EMAIL_SECRET,
            {
                expiresIn: "1d",
            }
        );
        const verifyUrl = `${getAppUrl()}/api/v1/auth/verify-email?token=${verifyToken}`;

        await sendEmail(
            profile.email,
            "Verify email",
            `<p style="font-size:25px; font-weight:bold;color:red;font-family:Roboto">Please verify your email adress by clicking on the link</p>
		<p><a style="background-color:cornflowerblue; 
			color:ghostwhite; padding-top:10px; padding-bottom:10px; 
			padding-right:25px; padding-left:25px;
			 text-decoration:none; border-radius:5px;
			  box-shadow: 7px 7px 15px cornflowerblue; 
			border:none; margin-left:40px;font-size:20px; font-family:Arial;" 
			href="${verifyUrl}">Verify</a></p>`
        );

        return res.status(201).json({
            message: "Registered Successfully",
            user: {
                name: profile.name,
                email: profile.email,
                role: profile.role,
                isEmailVerified: profile.isEmailVerified,
            },
        });
    } catch (err) {
        console.error("Registration error:", err);
        return res.status(500).json({
            error: "Server Error",
        });
    }
}

async function verifyEmailHandler(req, res) {
    const token = req.query.token || undefined;

    if (!token) {
        return res.status(400).json({
            message: "Access Token not found",
        });
    }
    try {
        const verify = jwt.verify(token, process.env.JWT_EMAIL_SECRET);
        const profile = await user.findById(verify.sub);
        if (!profile) {
            return res.status(400).json({
                message: "User not found",
            });
        }
        if (profile.isEmailVerified) {
            return res.redirect(`${getClientUrl()}/login?verified=true&already=true`);
        }
        profile.isEmailVerified = true;
        await profile.save();
        return res.status(200).redirect(`${getClientUrl()}/login?verified=true`);
    } catch (err) {
        console.error("Jwt error:", err);
        return res.status(500).json({
            error: "Server error",
        });
    }
}

async function loginHandler(req, res) {
    try {
        const result = loginSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Invalid Data",
                error: result.error.flatten(),
            });
        }

        const { email, password, twoFactorCode } = result.data;
        const normalizedEmail = email.trim().toLowerCase();

        const profile = await user.findOne({ email: normalizedEmail });

        if (!profile) {
            return res.status(400).json({
                message: "User not found",
            });
        }

        const verify = await compareHash(password, profile.passwordHash);

        if (!verify) {
            return res.status(400).json({
                message: "Invalid password",
            });
        }

        if (!profile.isEmailVerified) {
            return res.status(403).json({
                message: "Please verify your email before loging in",
            });
        }

        if (profile.twoFactorAuth) {
            if (!twoFactorCode || typeof twoFactorCode !== "string") {
                return res.status(400).json("Invalid two factor code");
            }

            if (!profile.twoFactorSecret) {
                return res.status(400).json({ message: "Two factor missconfigured" });
            }

            const isValidCode = authenticator.check(
                twoFactorCode,
                profile.twoFactorSecret
            );

            if (!isValidCode) {
                return res.status(400).json({
                    message: "Invalid two factor code",
                });
            }
        }

        const accessToken = await createAccessToken(
            profile.id,
            profile.role,
            profile.tokenVersion
        );
        const refreshToken = await createRefreshToken(
            profile.id,
            profile.tokenVersion
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: "Login success",
            accessToken: accessToken,
            user: {
                id: profile.id,
                email: profile.email,
                role: profile.role,
                isEmailVerified: profile.isEmailVerified,
                twoFactorEnabled: profile.twoFactorAuth,
            },
        });
    } catch (err) {
        console.error("login error:", err);
        return res.status(500).json({
            error: "Internal Server error",
        });
    }
}

async function refreshTokenHandler(req, res) {
    try {
        const token = req.cookies?.refreshToken;

        if (!token) {
            return res.status(401).json({
                message: "Refresh token missing",
            });
        }

        const verify = await verifyRefreshToken(token);

        const profile = await user.findById(verify.sub);

        if (!profile) {
            return res.status(401).json({
                message: "User not found",
            });
        }

        if (profile.tokenVersion !== verify.tokenVersion) {
            return res.status(401).json({
                message: "Refresh token invalidated",
            });
        }

        const newAccessToken = await createAccessToken(
            profile.id,
            profile.role,
            profile.tokenVersion
        );

        const newRefreshToken = await createRefreshToken(
            profile.id,
            profile.tokenVersion
        );

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: "Token refreshed",
            accessToken: newAccessToken,
            user: {
                id: profile.id,
                email: profile.email,
                role: profile.role,
                isEmailVerified: profile.isEmailVerified,
                twoFactorEnabled: profile.twoFactorAuth,
            },
        });
    } catch (err) {
        console.error("Refresh token error:", err);
        return res.status(500).json({
            error: "Server error",
        });
    }
}

async function logoutHandler(req, res) {
    try {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
        });
        return res.status(200).json({
            message: "Logged out successfully",
        });
    } catch (err) {
        console.error("Logout error:", err);
        return res.status(500).json({
            error: "Server error",
        });
    }
}

async function forgotPasswordHandler(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Bad data" });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();
        const profile = await user.findOne({ email: normalizedEmail });
        if (!profile) {
            return res
                .status(400)
                .json({ message: "If the email exists, a reset link has been sent" });
        }

        const rawToken = crypto.randomBytes(32).toString("hex");

        const tokenHash = crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

        profile.resetPasswordToken = tokenHash;
        profile.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000);
        await profile.save();

        const resetUrl = `${getAppUrl()}/api/v1/auth/reset-password?token=${rawToken}`;

        await sendEmail(
            profile.email,
            "Reset Password",
            `<a href="${resetUrl}">${resetUrl}</a>`
        );

        return res.status(200).json({
            message: "Link to reset password sent success",
        });
    } catch (err) {
        console.error("Forgot password error:", err);
        return res.status(500).json({
            error: "Server error",
        });
    }
}

async function resetPasswordHandler(req, res) {
    const { password } = req.body;
    const token = req.query.token;

    if (!token) {
        return res.status(400).json({ message: "Invalid token request" });
    }
    if (!password || password.length < 6) {
        return res.status(400).json({ message: "Invalid password" });
    }

    try {
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const profile = await user.findOne({
            resetPasswordToken: tokenHash,
            resetPasswordExpiry: { $gt: new Date() },
        });
        if (!profile) {
            return res.status(400).json({ message: "Token validation failed" });
        }

        const passwordHash = await hashPassword(password);

        profile.passwordHash = passwordHash;
        profile.resetPasswordToken = undefined;
        profile.resetPasswordExpiry = undefined;
        profile.tokenVersion += 1;
        await profile.save();

        return res.status(200).json({
            message: "Password changed successfully",
            user: {
                userId: profile.id,
                email: profile.email,
                name: profile.name,
                role: profile.role,
            },
        });
    } catch (err) {
        console.error("Reset password error:", err);
        return res.status(500).json({
            error: "Internal Server error",
        });
    }
}

async function googleAuthStartHandler(req, res) {
    try {
        const client = getGoogleClient();
        const url = client.generateAuthUrl({
            access_type: "offline",
            prompt: "consent",
            scope: ["openid", "email", "profile"],
        });

        return res.redirect(url);
    } catch (err) {
        console.error("OAuth error:", err);
        return res.status(500).json({
            error: "Internal Server error",
        });
    }
}

async function googleAuthCallbackHandler(req, res) {
    const code = req.query.code;

    if (!code) {
        return res.status(400).json({
            message: "Missing code in callback",
        });
    }

    try {
        const client = getGoogleClient();
        const { tokens } = await client.getToken(code);

        if (!tokens) {
            return res.status(400).json({
                message: "No google id token is present",
            });
        }

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        const email = payload?.email;
        const emailVerified = payload?.email_verified;

        if (!email || !emailVerified) {
            return res.status(400).json({
                message: "Google email account is not verified",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        let profile = await user.findOne({ email: normalizedEmail });

        if (!profile) {
            const randomPassword = crypto.randomBytes(16).toString("hex");
            const passwordHash = await hashPassword(randomPassword);

            profile = await user.create({
                email: normalizedEmail,
                passwordHash: passwordHash,
                name: payload?.name || "User",
                isEmailVerified: true,
                twoFactorAuth: false,
            });
        } else {
            if (!profile.isEmailVerified) {
                profile.isEmailVerified = true;
                await profile.save();
            }
        }

        const accessToken = await createAccessToken(
            profile.id,
            profile.role,
            profile.tokenVersion
        );

        const refreshToken = await createRefreshToken(
            profile.id,
            profile.tokenVersion
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // If request is from browser navigation (OAuth redirect), redirect directly to client callback page
        if (!req.xhr && req.headers.accept && req.headers.accept.includes("text/html")) {
            const redirectUrl = `${getClientUrl()}/auth/callback?token=${accessToken}&email=${encodeURIComponent(profile.email)}&name=${encodeURIComponent(profile.name || '')}&role=${profile.role}&id=${profile.id}&isEmailVerified=${profile.isEmailVerified}`;
            return res.redirect(redirectUrl);
        }

        return res.status(200).json({
            message: "Google login success",
            accessToken: accessToken,
            user: {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                role: profile.role,
                isEmailVerified: profile.isEmailVerified,
            },
        });
    } catch (err) {
        console.error("OAuth error:", err);
        return res.status(500).json({
            error: "Internal Server error",
        });
    }
}

async function twoFactorSetupHandler(req, res) {
    const authUser = req.userInfo;

    if (!authUser) {
        return res.status(401).json({
            message: "Not authenticated",
        });
    }

    try {
        const profile = await user.findById(authUser.id);

        if (!profile) {
            return res.status(400).json({
                message: "User not found",
            });
        }

        const secret = authenticator.generateSecret();
        const issuer = "GeoTager";

        const optAuthUrl = authenticator.keyuri(profile.email, issuer, secret);
        profile.twoFactorSecret = secret;
        profile.twoFactorAuth = false;
        await profile.save();

        return res.json({
            message: "2FA setup success",
            optAuthUrl,
            secret,
            issuer,
        });
    } catch (err) {
        console.error("2FA error:", err);
        return res.status(500).json({
            error: "Internal Server error",
        });
    }
}

async function twoFactorVerifyHandler(req, res) {
    const authUser = req.userInfo;

    if (!authUser) {
        return res.status(401).json({
            message: "Not authenticated",
        });
    }

    const { code } = req.body;

    try {
        const profile = await user.findById(authUser.id);

        if (!profile) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (!profile.twoFactorSecret) {
            return res.status(404).json({
                message: "Setup not completed",
            });
        }

        const isvalid = authenticator.check(code, profile.twoFactorSecret);
        if (!isvalid) {
            return res.status(400).json({
                message: "Invalid two factor code",
            });
        }

        profile.twoFactorAuth = true;
        await profile.save();

        return res.status(200).json({
            message: "2FA enabled successfully",
            twoFactorAuth: true,
        });
    } catch (err) {
        console.error("2FA error:", err);
        return res.status(500).json({
            error: "Internal Server error",
        });
    }
}

module.exports = {
    registerHandler,
    verifyEmailHandler,
    loginHandler,
    refreshTokenHandler,
    logoutHandler,
    forgotPasswordHandler,
    resetPasswordHandler,
    googleAuthStartHandler,
    googleAuthCallbackHandler,
    twoFactorSetupHandler,
    twoFactorVerifyHandler,
};