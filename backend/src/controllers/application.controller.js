const applicationService = require('../services/application.service');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @desc    Submit application to a job (Candidate)
 * @route   POST /api/applications
 * @access  Private (Candidate)
 */
const applyToJob = async (req, res, next) => {
  try {
    const { jobId, coverLetter, resumeId } = req.body;
    const application = await applicationService.applyToJob(
      req.user._id,
      jobId,
      coverLetter,
      resumeId || null
    );
    return res
      .status(201)
      .json(ApiResponse.created(application, 'Application submitted and analyzed successfully by AI'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get candidate's submitted applications
 * @route   GET /api/applications/candidate
 * @access  Private (Candidate)
 */
const getCandidateApplications = async (req, res, next) => {
  try {
    const applications = await applicationService.getCandidateApplications(req.user._id);
    return res
      .status(200)
      .json(ApiResponse.success(applications, 'Candidate applications retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all applications for a specific job (Recruiter view, sorted by AI match score)
 * @route   GET /api/applications/job/:jobId
 * @access  Private (Recruiter/Admin)
 */
const getJobApplications = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const applications = await applicationService.getJobApplications(
      req.params.jobId,
      req.user._id,
      isAdmin
    );
    return res
      .status(200)
      .json(ApiResponse.success(applications, 'Job applications retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all applications across recruiter jobs
 * @route   GET /api/applications/recruiter
 * @access  Private (Recruiter)
 */
const getRecruiterApplications = async (req, res, next) => {
  try {
    const applications = await applicationService.getRecruiterApplications(req.user._id);
    return res
      .status(200)
      .json(ApiResponse.success(applications, 'Recruiter applications retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update candidate application pipeline status
 * @route   PATCH /api/applications/:id/status
 * @access  Private (Recruiter/Admin)
 */
const updateStatus = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const application = await applicationService.updateStatus(
      req.params.id,
      req.user._id,
      req.body.status,
      isAdmin
    );
    return res
      .status(200)
      .json(ApiResponse.success(application, 'Application status updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add note to application
 * @route   POST /api/applications/:id/notes
 * @access  Private (Recruiter)
 */
const addNote = async (req, res, next) => {
  try {
    const application = await applicationService.addNote(
      req.params.id,
      req.user._id,
      req.user.name,
      req.body.text
    );
    return res
      .status(200)
      .json(ApiResponse.success(application, 'Note added successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyToJob,
  getCandidateApplications,
  getJobApplications,
  getRecruiterApplications,
  updateStatus,
  addNote,
};
