const jobService = require('../services/job.service');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @desc    Create a new job (Recruiter only)
 * @route   POST /api/jobs
 * @access  Private (Recruiter)
 */
const createJob = async (req, res, next) => {
  try {
    const job = await jobService.createJob(req.user._id, req.body);
    return res.status(201).json(ApiResponse.created(job, 'Job requisition created successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Browse & search jobs (Public / Candidate with personalized match)
 * @route   GET /api/jobs
 * @access  Public / Authenticated
 */
const getJobs = async (req, res, next) => {
  try {
    const { search, location, type, experienceLevel, skill, page, limit } = req.query;
    const candidateId = req.user?.role === 'candidate' ? req.user._id : null;

    const result = await jobService.getJobs({
      search,
      location,
      type,
      experienceLevel,
      skill,
      page,
      limit,
      candidateId,
    });

    return res.status(200).json(ApiResponse.success(result.jobs, 'Jobs retrieved successfully', result.meta));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single job by ID
 * @route   GET /api/jobs/:id
 * @access  Public
 */
const getJobById = async (req, res, next) => {
  try {
    const candidateId = req.user?.role === 'candidate' ? req.user._id : null;
    const job = await jobService.getJobById(req.params.id, candidateId);
    return res.status(200).json(ApiResponse.success(job, 'Job details retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all jobs for logged in recruiter
 * @route   GET /api/jobs/recruiter/my
 * @access  Private (Recruiter)
 */
const getRecruiterJobs = async (req, res, next) => {
  try {
    const jobs = await jobService.getRecruiterJobs(req.user._id);
    return res.status(200).json(ApiResponse.success(jobs, 'Recruiter jobs retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a job
 * @route   PUT /api/jobs/:id
 * @access  Private (Recruiter/Admin)
 */
const updateJob = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const job = await jobService.updateJob(req.params.id, req.user._id, req.body, isAdmin);
    return res.status(200).json(ApiResponse.success(job, 'Job updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a job
 * @route   DELETE /api/jobs/:id
 * @access  Private (Recruiter/Admin)
 */
const deleteJob = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const result = await jobService.deleteJob(req.params.id, req.user._id, isAdmin);
    return res.status(200).json(ApiResponse.success(result, 'Job deleted successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  getRecruiterJobs,
  updateJob,
  deleteJob,
};
