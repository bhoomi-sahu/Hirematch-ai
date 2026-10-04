const bulkScreenService = require('../services/bulkScreen.service');
const ApiResponse = require('../utils/ApiResponse');

const startBatch = async (req, res, next) => {
  try {
    await bulkScreenService.assertRecruiterOwnsJob(req.params.jobId, req.user);
    const result = await bulkScreenService.startBatch(req.params.jobId, req.user._id, req.files);
    return res.status(202).json(ApiResponse.created(result, 'Bulk screening started'));
  } catch (error) {
    next(error);
  }
};

const getBatchStatus = async (req, res, next) => {
  try {
    const result = await bulkScreenService.getBatchStatus(req.params.jobId, req.params.batchId, req.user);
    return res.status(200).json(ApiResponse.success(result, 'Batch status retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

const getCandidates = async (req, res, next) => {
  try {
    const result = await bulkScreenService.getCandidates(req.params.jobId, req.query, req.user);
    return res.status(200).json(ApiResponse.success(result, 'Candidates retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const resume = await bulkScreenService.updateScreeningStatus(req.params.resumeId, req.body.status, req.user);
    return res.status(200).json(ApiResponse.success(resume, 'Candidate status updated successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = { startBatch, getBatchStatus, getCandidates, updateStatus };
