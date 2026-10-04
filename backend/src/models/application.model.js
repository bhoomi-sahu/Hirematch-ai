const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    status: {
      type: String,
      enum: ['applied', 'screening', 'interview', 'offered', 'rejected'],
      default: 'applied',
    },
    coverLetter: {
      type: String,
      default: '',
    },
    resumeSnapshot: {
      headline: { type: String, default: '' },
      experienceYears: { type: Number, default: 0 },
      skills: { type: [String], default: [] },
      resumeText: { type: String, default: '' },
    },
    matchAnalysis: {
      score: { type: Number, default: 0, min: 0, max: 100 },
      status: {
        type: String,
        enum: ['Strong Match', 'Good Fit', 'Moderate Match', 'Low Match'],
        default: 'Moderate Match',
      },
      skillsMatched: { type: [String], default: [] },
      skillsMissing: { type: [String], default: [] },
      strengths: { type: [String], default: [] },
      gapAnalysis: { type: [String], default: [] },
      aiSummary: { type: String, default: '' },
      recommendation: { type: String, default: '' },
      analyzedAt: { type: Date, default: Date.now },
    },
    notes: [
      {
        author: { type: String, required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate applications by the same candidate to the same job
applicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });
applicationSchema.index({ recruiterId: 1, 'matchAnalysis.score': -1 });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
