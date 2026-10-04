const { User, Job, Application, Profile, Resume, ResumeAnalysis } = require('../models');
const ApiError = require('../utils/ApiError');

class AdminService {
  /**
   * Get Platform Overview Stats
   */
  async getStats() {
    const [
      totalUsers,
      totalCandidates,
      totalRecruiters,
      totalJobs,
      activeJobs,
      totalApplications,
      applicationsByStatus,
      recentApplications,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'candidate' }),
      User.countDocuments({ role: 'recruiter' }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'active' }),
      Application.countDocuments(),
      Application.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Application.find()
        .populate('jobId', 'title company')
        .populate('candidateId', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    // Calculate Average AI Match Score
    const scoreAgg = await Application.aggregate([
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$matchAnalysis.score' },
        },
      },
    ]);

    const avgMatchScore = scoreAgg.length > 0 ? Math.round(scoreAgg[0].avgScore) : 0;

    const [totalResumes, completedResumes, failedResumes, processingResumes, totalAnalyses] = await Promise.all([
      Resume.countDocuments(),
      Resume.countDocuments({ processingStatus: 'completed' }),
      Resume.countDocuments({ processingStatus: 'failed' }),
      Resume.countDocuments({ processingStatus: { $in: ['queued', 'processing'] } }),
      ResumeAnalysis.countDocuments(),
    ]);

    const statusCounts = {
      applied: 0,
      screening: 0,
      interview: 0,
      offered: 0,
      rejected: 0,
    };

    applicationsByStatus.forEach((item) => {
      if (statusCounts[item._id] !== undefined) {
        statusCounts[item._id] = item.count;
      }
    });

    return {
      users: {
        total: totalUsers,
        candidates: totalCandidates,
        recruiters: totalRecruiters,
      },
      jobs: {
        total: totalJobs,
        active: activeJobs,
        closed: totalJobs - activeJobs,
      },
      applications: {
        total: totalApplications,
        avgMatchScore,
        byStatus: statusCounts,
        recent: recentApplications,
      },
      ai: {
        totalResumesProcessed: totalResumes,
        successfulAnalyses: completedResumes,
        failedAnalyses: failedResumes,
        currentlyProcessing: processingResumes,
        totalMatchAnalyses: totalAnalyses,
      },
    };
  }

  /**
   * Get all registered users
   */
  async getAllUsers({ role, search }) {
    const query = {};
    if (role && role !== 'all') {
      query.role = role;
    }
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 }).lean();
    return users;
  }

  /**
   * Update a user's role
   */
  async updateUserRole(userId, newRole) {
    const validRoles = ['candidate', 'recruiter', 'admin'];
    if (!validRoles.includes(newRole)) {
      throw ApiError.badRequest(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    user.role = newRole;
    await user.save();
    return user.toJSON();
  }

  /**
   * Suspend or reactivate a user account
   */
  async setUserActive(userId, isActive) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    user.isActive = !!isActive;
    await user.save();
    return user.toJSON();
  }

  /**
   * Get all applications platform-wide
   */
  async getAllApplications({ status, search } = {}) {
    const query = {};
    if (status && status !== 'all') query.status = status;

    let applications = await Application.find(query)
      .populate('jobId', 'title company location')
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      applications = applications.filter(
        (a) =>
          a.candidateId?.name?.toLowerCase().includes(term) ||
          a.candidateId?.email?.toLowerCase().includes(term) ||
          a.jobId?.title?.toLowerCase().includes(term)
      );
    }

    return applications;
  }

  /**
   * Delete a user and cascade related resources
   */
  async deleteUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Cascade deletions
    await Promise.all([
      Profile.deleteMany({ userId }),
      Job.deleteMany({ recruiterId: userId }),
      Application.deleteMany({
        $or: [{ candidateId: userId }, { recruiterId: userId }],
      }),
      Resume.deleteMany({ $or: [{ candidateId: userId }, { recruiterId: userId }] }),
      user.deleteOne(),
    ]);

    return { success: true, message: `User ${user.email} and related records deleted.` };
  }

  /**
   * Moderate/Get all jobs across platform
   */
  async getAllJobs() {
    return await Job.find()
      .populate('recruiterId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
  }
}

module.exports = new AdminService();
