const { verifyAccessToken } = require("../utils/token.js");
const { user } = require("../model/user.model.js");

async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "You are not authorized user",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const verifyToken = await verifyAccessToken(token);

        const profile = await user.findById(verifyToken.sub);

        if (!profile) {
            return res.status(401).json({
                message: "Not authorized user",
            });
        }

        if (verifyToken.tokenVersion !== profile.tokenVersion) {
            return res.status(401).json({
                message: "Token validation failiure",
            });
        }
        req.userInfo = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            isEmailVerified: profile.isEmailVerified,
        };
        next();
    } catch (err) {
        console.error("Authorization middleware error:", err);
        return res.status(500).json({
            message: "Intenal server error",
        });
    }
}

function checkAdmin(req, res, next) {
    if (!req.userInfo) {
        return res.status(401).json({
            message: "Not authenticated",
        });
    }

    if (req.userInfo.role !== "admin") {
        return res.status(403).json({
            message: "Access denied: Admin only",
        });
    }

    next();
}

module.exports = {
    requireAuth,
    checkAdmin,
};
