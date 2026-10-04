const { Job, Profile, Resume, ResumeAnalysis } = require('../models');
const ApiError = require('../utils/ApiError');
const aiService = require('./ai.service');

class JobService {
  /**
   * Create a new job requisition (Recruiter)
   */
  async createJob(recruiterId, data) {
    const job = await Job.create({
      ...data,
      recruiterId,
    });
    return job;
  }

  /**
   * Get all active jobs with optional filtering and personalized match score
   */
  async getJobs({ search, location, type, experienceLevel, skill, page = 1, limit = 12, candidateId }) {
    const filter = { status: 'active' };

    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { company: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { skillsRequired: { $in: [new RegExp(search.trim(), 'i')] } },
      ];
    }

    if (location && location !== 'all') {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (experienceLevel && experienceLevel !== 'all') {
      filter.experienceLevel = experienceLevel;
    }

    if (skill && skill.trim()) {
      filter.skillsRequired = { $regex: skill.trim(), $options: 'i' };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));

    const total = await Job.countDocuments(filter);
    let jobsQuery = Job.find(filter)
      .populate('recruiterId', 'name email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    let jobs = await jobsQuery.lean();

    // If candidateId is provided, enrich each job with personalized AI match score
    if (candidateId) {
      const candidateProfile = await Profile.findOne({ userId: candidateId }).lean();
      if (candidateProfile) {
        jobs = jobs.map((job) => {
          const match = aiService.calculateSemanticMatch(candidateProfile, job);
          return {
            ...job,
            matchScore: match.score,
            matchStatus: match.status,
            skillsMatched: match.skillsMatched,
            skillsMissing: match.skillsMissing,
          };
        });
      }
    }

    return {
      jobs,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Get single job by ID
   */
  async getJobById(jobId, candidateId = null) {
    const job = await Job.findById(jobId).populate('recruiterId', 'name email').lean();
    if (!job) {
      throw ApiError.notFound('Job not found');
    }

    if (candidateId) {
      const candidateProfile = await Profile.findOne({ userId: candidateId }).lean();
      if (candidateProfile) {
        const match = aiService.calculateSemanticMatch(candidateProfile, job);
        return {
          ...job,
          matchAnalysis: match,
        };
      }
    }

    return job;
  }

  /**
   * Get all jobs posted by a specific recruiter
   */
  async getRecruiterJobs(recruiterId) {
    const jobs = await Job.find({ recruiterId })
      .sort({ createdAt: -1 })
      .lean();
    return jobs;
  }

  /**
   * Update a job
   */
  async updateJob(jobId, recruiterId, updateData, isAdmin = false) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw ApiError.notFound('Job not found');
    }

    if (!isAdmin && job.recruiterId.toString() !== recruiterId.toString()) {
      throw ApiError.forbidden('You do not have permission to modify this job');
    }

    Object.assign(job, updateData);
    await job.save();
    return job;
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId, recruiterId, isAdmin = false) {
    const job = await Job.findById(jobId);
    if (!job) {
      throw ApiError.notFound('Job not found');
    }

    if (!isAdmin && job.recruiterId.toString() !== recruiterId.toString()) {
      throw ApiError.forbidden('You do not have permission to delete this job');
    }

    await Promise.all([
      Resume.deleteMany({ jobId, owner: 'bulk' }),
      ResumeAnalysis.deleteMany({ jobId }),
      job.deleteOne(),
    ]);
    return { success: true, message: 'Job successfully deleted' };
  }
}

module.exports = new JobService();
