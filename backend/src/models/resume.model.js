const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    // Owner of the resume. For candidate self-uploads this is the candidate's user id.
    // For recruiter bulk-screening uploads, candidateId is null and recruiterId/batchId are used instead.
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    owner: {
      type: String,
      enum: ['candidate', 'bulk'],
      default: 'candidate',
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    batchId: {
      type: String,
      default: null,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
      index: true,
    },

    originalFileName: {
      type: String,
      required: true,
    },
    storedFileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: 'application/pdf',
    },

    extractedText: {
      type: String,
      default: '',
    },

    processingStatus: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed'],
      default: 'queued',
      index: true,
    },
    processingError: {
      type: String,
      default: '',
    },

    parsed: {
      name: { type: String, default: null },
      email: { type: String, default: null },
      phone: { type: String, default: null },
      skills: { type: [String], default: [] },
      education: [
        {
          institution: { type: String, default: '' },
          degree: { type: String, default: '' },
          fieldOfStudy: { type: String, default: '' },
          year: { type: String, default: '' },
        },
      ],
      experience: [
        {
          title: { type: String, default: '' },
          company: { type: String, default: '' },
          duration: { type: String, default: '' },
          description: { type: String, default: '' },
        },
      ],
      projects: [
        {
          name: { type: String, default: '' },
          description: { type: String, default: '' },
          technologies: { type: [String], default: [] },
        },
      ],
      certifications: { type: [String], default: [] },
      links: {
        linkedin: { type: String, default: '' },
        github: { type: String, default: '' },
        portfolio: { type: String, default: '' },
      },
      source: { type: String, enum: ['ai', 'deterministic', null], default: null },
    },

    // Only meaningful for candidate-owned resumes: lets a candidate keep history
    // but mark which resume is the "active" one used for applications.
    isActive: {
      type: Boolean,
      default: true,
    },

    // Only meaningful for bulk (recruiter) resumes screened against a specific job.
    screeningStatus: {
      type: String,
      enum: ['new', 'shortlisted', 'rejected'],
      default: 'new',
    },
  },
  { timestamps: true }
);

resumeSchema.index({ candidateId: 1, createdAt: -1 });
resumeSchema.index({ batchId: 1, processingStatus: 1 });

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
