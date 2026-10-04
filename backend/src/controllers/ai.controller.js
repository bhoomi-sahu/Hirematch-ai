const aiService = require('../services/ai.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const parseJob = async (req, res, next) => {
  try {
    const { title, description, responsibilities } = req.body;

    if (!description || !description.trim()) {
      throw ApiError.badRequest('Job description is required to analyze with AI');
    }

    const result = await aiService.parseJobDescription(title, description, responsibilities);
    return res.status(200).json(ApiResponse.success(result, 'Job requirements extracted successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = { parseJob };
