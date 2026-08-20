const mongoose = require('mongoose');

const LandmarkPointSchema = new mongoose.Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
    visibility: { type: Number },
  },
  { _id: false }
);

const LandmarkSampleSchema = new mongoose.Schema(
  {
    timestampMs: { type: Number },
    repNumber: { type: Number },
    event: { type: String },
    angle: { type: Number },
    landmarks: [LandmarkPointSchema],
  },
  { _id: false }
);

const AssessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      index: true,
    },
    athleteId: {
      type: String,
      index: true,
    },
    localId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    exerciseType: {
      type: String,
      enum: ['squat', 'pushup'],
      required: true,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    grade: {
      type: String,
      default: 'A',
    },
    repsCompleted: {
      type: Number,
      default: 0,
    },
    validReps: {
      type: Number,
      default: 0,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    caloriesBurned: {
      type: Number,
      default: 0,
    },
    symmetryScore: {
      type: Number,
      default: 100,
    },
    depthScore: {
      type: Number,
      default: 100,
    },
    formAccuracy: {
      type: Number,
      default: 100,
    },
    cadenceScore: {
      type: Number,
      default: 100,
    },
    angles: {
      current: { type: Number },
      min: { type: Number },
      max: { type: Number },
      avg: { type: Number },
    },
    landmarkSamples: [LandmarkSampleSchema],
    clientTimestamp: {
      type: Date,
      default: Date.now,
    },
    syncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

AssessmentSchema.index({ userId: 1, createdAt: -1 });

const Assessment = mongoose.model('Assessment', AssessmentSchema);

module.exports = { Assessment };
