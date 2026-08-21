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
        profile: {
            age: { type: Number },
            gender: { type: String },
            height: { type: String },
            weight: { type: String },
            country: { type: String, default: 'in' },
            state: { type: String },
            city: { type: String },
            areaType: { type: String, enum: ['urban', 'rural'], default: 'urban' },
            primarySport: { type: String, default: 'Athletics & Track' },
            secondarySports: { type: String },
            experienceLevel: { type: String, default: 'intermediate' },
            yearsExperience: { type: String },
            athleticGoals: { type: String },
            dominantHand: { type: String, enum: ['left', 'right'], default: 'right' },
            dominantFoot: { type: String, enum: ['left', 'right'], default: 'right' },
            organization: { type: String },
            achievements: { type: String },
            bio: { type: String },
            trainingFrequency: { type: String, default: '3-4' },
            profilePhoto: { type: String },
            avatar: { type: String },
        },
        privacy: {
            movementInsights: { type: Boolean, default: true },
            highlightProcessing: { type: Boolean, default: true },
            recruiterDiscoverability: { type: Boolean, default: true },
            profileVisibility: { type: String, default: 'verified' },
            guardianConsent: { type: Boolean, default: false },
        },
    },
    {
        timestamps: true,
    }
);

const user = mongoose.model("user", Schema);

module.exports = { user };