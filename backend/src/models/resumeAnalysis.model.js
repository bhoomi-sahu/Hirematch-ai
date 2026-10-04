const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    overallScore: { type: Number, default: 0, min: 0, max: 100 },
    skillScore: { type: Number, default: 0 },
    experienceScore: { type: Number, default: 0 },
    projectScore: { type: Number, default: 0 },
    educationScore: { type: Number, default: 0 },
    certificationScore: { type: Number, default: 0 },

    matchedSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    partialSkills: { type: [String], default: [] },

    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },

    matchCategory: {
      type: String,
      enum: ['Strong Match', 'Moderate Match', 'Low Match'],
      default: 'Low Match',
    },

    // Used to invalidate the cache: if the resume or job changes after this
    // analysis was generated, we know to recompute rather than reuse it.
    resumeVersion: { type: Date, required: true },
    jobVersion: { type: Date, required: true },
  },
  { timestamps: true }
);

resumeAnalysisSchema.index({ jobId: 1, resumeId: 1 }, { unique: true });

const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);

module.exports = ResumeAnalysis;
