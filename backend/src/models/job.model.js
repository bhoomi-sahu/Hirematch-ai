const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    location: {
      type: String,
      default: 'Remote',
      trim: true,
    },
    type: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'],
      default: 'Full-time',
    },
    experienceLevel: {
      type: String,
      enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead / Staff', 'Executive'],
      default: 'Mid Level',
    },
    salaryRange: {
      min: { type: Number, default: 60000 },
      max: { type: Number, default: 120000 },
      currency: { type: String, default: 'USD' },
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    requirements: {
      type: [String],
      default: [],
    },
    skillsRequired: {
      type: [String],
      required: [true, 'At least one required skill must be specified'],
      validate: [
        (val) => val.length > 0,
        'Please specify at least one required skill',
      ],
    },
    preferredSkills: {
      type: [String],
      default: [],
    },
    educationRequirement: {
      type: String,
      default: '',
      trim: true,
    },
    certificationsRequired: {
      type: [String],
      default: [],
    },
    matchWeights: {
      skills: { type: Number, default: 50 },
      experience: { type: Number, default: 20 },
      projects: { type: Number, default: 15 },
      education: { type: Number, default: 10 },
      certifications: { type: Number, default: 5 },
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'draft'],
      default: 'active',
    },
    applicantCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ title: 'text', company: 'text', description: 'text' });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
