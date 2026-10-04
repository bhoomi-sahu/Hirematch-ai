const { Application, Job, Profile, User, Resume } = require('../models');
const ApiError = require('../utils/ApiError');
const aiService = require('./ai.service');
const matchEngine = require('./matching/matchEngine');

class ApplicationService {
  /**
   * Apply to a job as Candidate. If resumeId is provided, uses the real,
   * fully-parsed PDF resume through the deterministic matching engine.
   * Otherwise falls back to the legacy profile-text based AI matcher.
   */
  async applyToJob(candidateId, jobId, coverLetter = '', resumeId = null) {
    // 1. Verify Job exists and is active
    const job = await Job.findById(jobId);
    if (!job) {
      throw ApiError.notFound('Job opening not found');
    }
    if (job.status !== 'active') {
      throw ApiError.badRequest('This job opening is no longer accepting applications');
    }

    // 2. Check if candidate already applied
    const existing = await Application.findOne({ jobId, candidateId });
    if (existing) {
      throw ApiError.badRequest('You have already submitted an application for this position');
    }

    let resume = null;
    if (resumeId) {
      resume = await Resume.findById(resumeId);
      if (!resume || String(resume.candidateId) !== String(candidateId)) {
        throw ApiError.notFound('Selected resume not found');
      }
      if (resume.processingStatus !== 'completed') {
        throw ApiError.badRequest('Selected resume is still processing. Please wait and try again.');
      }
    }

    let matchAnalysis;
    let resumeSnapshot;

    if (resume) {
      // Real PDF-resume matching path
      const result = matchEngine.computeMatch(resume, job);
      matchAnalysis = {
        score: result.overallScore,
        status: result.matchCategory,
        skillsMatched: result.matchedSkills,
        skillsMissing: result.missingSkills,
        strengths: result.strengths,
        gapAnalysis: result.weaknesses,
        aiSummary: result.recommendations.join(' '),
        recommendation: result.recommendations[0] || '',
        analyzedAt: new Date(),
      };
      resumeSnapshot = {
        headline: resume.parsed?.name || '',
        experienceYears: result.candidateYears,
        skills: resume.parsed?.skills || [],
        resumeText: resume.extractedText?.slice(0, 5000) || '',
      };
    } else {
      // Legacy profile-text matching path (kept for backward compatibility)
      let candidateProfile = await Profile.findOne({ userId: candidateId });
      const candidateUser = await User.findById(candidateId);

      if (!candidateProfile) {
        candidateProfile = await Profile.create({
          userId: candidateId,
          headline: 'Candidate',
          skills: [],
        });
      }

      const profileWithUser = {
        ...candidateProfile.toObject(),
        name: candidateUser?.name,
        email: candidateUser?.email,
      };

      matchAnalysis = await aiService.calculateMatch(profileWithUser, job);
      resumeSnapshot = {
        headline: candidateProfile.headline,
        experienceYears: candidateProfile.experienceYears,
        skills: candidateProfile.skills,
        resumeText: candidateProfile.resumeText,
      };
    }

    // Create Application
    const application = await Application.create({
      jobId,
      candidateId,
      recruiterId: job.recruiterId,
      resumeId: resume ? resume._id : null,
      coverLetter,
      resumeSnapshot,
      matchAnalysis,
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applicantCount: 1 } });

    return application;
  }

  /**
   * Get all applications submitted by candidate
   */
  async getCandidateApplications(candidateId) {
    const applications = await Application.find({ candidateId })
      .populate('jobId', 'title company location type salaryRange status')
      .populate('recruiterId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return applications;
  }

  /**
   * Get applications for a specific job (Recruiter view, sorted by AI match score)
   */
  async getJobApplications(jobId, recruiterId, isAdmin = false) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw ApiError.notFound('Job not found');
    }

    if (!isAdmin && job.recruiterId.toString() !== recruiterId.toString()) {
      throw ApiError.forbidden('You are not authorized to view applicants for this job');
    }

    const applications = await Application.find({ jobId })
      .populate('candidateId', 'name email')
      .sort({ 'matchAnalysis.score': -1, createdAt: -1 })
      .lean();

    return applications;
  }

  /**
   * Get all applications across all jobs belonging to a recruiter
   */
  async getRecruiterApplications(recruiterId) {
    const applications = await Application.find({ recruiterId })
      .populate('jobId', 'title company location type status')
      .populate('candidateId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return applications;
  }

  /**
   * Update candidate application status
   */
  async updateStatus(applicationId, recruiterId, status, isAdmin = false) {
    const validStatuses = ['applied', 'screening', 'interview', 'offered', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      throw ApiError.notFound('Application not found');
    }

    if (!isAdmin && application.recruiterId.toString() !== recruiterId.toString()) {
      throw ApiError.forbidden('You are not authorized to update this application');
    }

    application.status = status;
    await application.save();

    return application;
  }

  /**
   * Add a note to an application
   */
  async addNote(applicationId, recruiterId, authorName, text) {
    const application = await Application.findById(applicationId);
    if (!application) {
      throw ApiError.notFound('Application not found');
    }

    application.notes.push({
      author: authorName,
      text,
      createdAt: new Date(),
    });

    await application.save();
    return application;
  }
}

module.exports = new ApplicationService();
