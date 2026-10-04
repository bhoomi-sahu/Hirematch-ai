const profileService = require('../services/profile.service');
const ApiResponse = require('../utils/ApiResponse');

/**
 * @desc    Get current user profile
 * @route   GET /api/profile/me
 * @access  Private
 */
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await profileService.getProfile(req.user._id);
    return res
      .status(200)
      .json(ApiResponse.success(profile, 'Profile retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/profile/me
 * @access  Private
 */
const updateMyProfile = async (req, res, next) => {
  try {
    const profile = await profileService.updateProfile(req.user._id, req.body);
    return res
      .status(200)
      .json(ApiResponse.success(profile, 'Profile updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Instant AI Resume Analysis & Skills Extraction
 * @route   POST /api/profile/analyze-resume
 * @access  Private
 */
const analyzeResume = async (req, res, next) => {
  try {
    const { resumeText, targetRole } = req.body;
    const analysis = await profileService.analyzeResume(resumeText, targetRole);
    return res
      .status(200)
      .json(ApiResponse.success(analysis, 'Resume analyzed successfully by AI'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  analyzeResume,
};
