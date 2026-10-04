const resumeService = require('../services/resume.service');
const ApiResponse = require('../utils/ApiResponse');

const uploadResume = async (req, res, next) => {
  try {
    const resume = await resumeService.uploadResume(req.user._id, req.file);
    return res.status(201).json(ApiResponse.created(resume, 'Resume uploaded and processed successfully'));
  } catch (error) {
    next(error);
  }
};

const listResumes = async (req, res, next) => {
  try {
    const resumes = await resumeService.listCandidateResumes(req.user._id);
    return res.status(200).json(ApiResponse.success(resumes, 'Resumes retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

const getResume = async (req, res, next) => {
  try {
    const resume = await resumeService.getResumeForUser(req.params.id, req.user);
    return res.status(200).json(ApiResponse.success(resume, 'Resume retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

const getResumeFile = async (req, res, next) => {
  try {
    await resumeService.streamResumeFile(req.params.id, req.user, res);
  } catch (error) {
    next(error);
  }
};

const deleteResume = async (req, res, next) => {
  try {
    const result = await resumeService.deleteResume(req.params.id, req.user);
    return res.status(200).json(ApiResponse.success(result, 'Resume deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const reprocessResume = async (req, res, next) => {
  try {
    const resume = await resumeService.reprocessResume(req.params.id, req.user);
    return res.status(200).json(ApiResponse.success(resume, 'Resume re-analysis started'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadResume,
  listResumes,
  getResume,
  getResumeFile,
  deleteResume,
  reprocessResume,
};
