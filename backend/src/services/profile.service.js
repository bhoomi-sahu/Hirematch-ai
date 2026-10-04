const { Profile, User } = require('../models');
const ApiError = require('../utils/ApiError');
const aiService = require('./ai.service');

class ProfileService {
  /**
   * Get or initialize profile for user
   */
  async getProfile(userId) {
    let profile = await Profile.findOne({ userId }).populate('userId', 'name email role').lean();

    if (!profile) {
      const user = await User.findById(userId);
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      const newProfile = await Profile.create({
        userId,
        headline: user.role === 'candidate' ? 'Job Seeker' : 'Recruitment Specialist',
        skills: user.role === 'candidate' ? ['JavaScript', 'React', 'Node.js'] : [],
      });

      profile = await Profile.findById(newProfile._id)
        .populate('userId', 'name email role')
        .lean();
    }

    return profile;
  }

  /**
   * Update candidate profile
   */
  async updateProfile(userId, data) {
    let profile = await Profile.findOne({ userId });

    if (!profile) {
      profile = new Profile({ userId });
    }

    // Allowed fields to update
    const allowedFields = [
      'headline',
      'bio',
      'location',
      'phone',
      'experienceYears',
      'skills',
      'experience',
      'education',
      'resumeText',
      'links',
    ];

    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        profile[field] = data[field];
      }
    });

    await profile.save();
    return await Profile.findById(profile._id).populate('userId', 'name email role').lean();
  }

  /**
   * Instant AI Resume Review
   */
  async analyzeResume(resumeText, targetRole) {
    if (!resumeText || resumeText.trim().length < 20) {
      throw ApiError.badRequest('Please provide at least 20 characters of resume text to analyze');
    }

    return await aiService.analyzeResumeText(resumeText, targetRole);
  }
}

module.exports = new ProfileService();
