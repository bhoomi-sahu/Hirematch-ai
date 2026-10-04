const analysisService = require('../services/analysis.service');
const ApiResponse = require('../utils/ApiResponse');

const getAnalysis = async (req, res, next) => {
  try {
    const result = await analysisService.getOrComputeAnalysis(req.params.jobId, req.params.resumeId, req.user);
    return res.status(200).json(ApiResponse.success(result, 'Match analysis retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalysis };
