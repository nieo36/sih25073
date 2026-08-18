const mongoose = require('mongoose');

const Schema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "Email required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: [true, "Password hash required"],
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        name: {
            type: String,
            required: true,
        },
        twoFactorAuth: {
            type: Boolean,
            default: false,
        },
        twoFactorSecret: {
            type: String,
            default: undefined,
        },
        tokenVersion: {
            type: Number,
            default: 0,
        },
        resetPasswordToken: {
            type: String,
            default: undefined,
        },
        resetPasswordExpiry: {
            type: Date,
            default: undefined,
        },
    },
    {
        timestamps: true,
    }
);

const user = mongoose.model("user", Schema);

module.exports = { user };