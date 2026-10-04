const mongoose = require('mongoose');

const resumeImprovementSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },

    summary: { type: String, default: '' },

    suggestedSkills: { type: [String], default: [] }, // missing skills, never claimed as possessed

    improvements: [
      {
        area: { type: String, default: '' },
        suggestion: { type: String, default: '' },
      },
    ],

    rewrittenSections: [
      {
        section: { type: String, default: '' },
        original: { type: String, default: '' },
        suggested: { type: String, default: '' },
        supportedByResume: { type: Boolean, default: true },
      },
    ],

    changes: { type: [String], default: [] },
    warnings: { type: [String], default: [] },

    source: { type: String, enum: ['ai', 'deterministic'], default: 'deterministic' },
  },
  { timestamps: true }
);

resumeImprovementSchema.index({ candidateId: 1, resumeId: 1, jobId: 1, createdAt: -1 });

const ResumeImprovement = mongoose.model('ResumeImprovement', resumeImprovementSchema);

module.exports = ResumeImprovement;
