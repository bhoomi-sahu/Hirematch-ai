const healthService = require('../services/health.service');
const ApiResponse = require('../utils/ApiResponse');

const getHealth = (req, res, next) => {
  try {
    const healthData = healthService.getHealthStatus();
    const statusCode = healthData.status === 'healthy' ? 200 : 503;
    const response = new ApiResponse(
      statusCode,
      healthData,
      healthData.status === 'healthy'
        ? 'HireMatch AI service is healthy and operational'
        : 'HireMatch AI service is running with degraded dependencies'
    );
    return res.status(statusCode).json(response);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
};
