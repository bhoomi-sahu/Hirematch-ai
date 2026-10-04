const resumeImproveService = require('../services/resumeImprove.service');
const ApiResponse = require('../utils/ApiResponse');

const generate = async (req, res, next) => {
  try {
    const result = await resumeImproveService.generateImprovement(req.user._id, req.params.resumeId, req.params.jobId);
    return res.status(201).json(ApiResponse.created(result, 'Resume improvement suggestions generated'));
  } catch (error) {
    next(error);
  }
};

const history = async (req, res, next) => {
  try {
    const result = await resumeImproveService.getImprovements(req.user._id, req.params.resumeId);
    return res.status(200).json(ApiResponse.success(result, 'Improvement history retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = { generate, history };
