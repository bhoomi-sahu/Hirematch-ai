const { Job, Resume, ResumeAnalysis } = require('../models');
const ApiError = require('../utils/ApiError');
const matchEngine = require('./matching/matchEngine');

class AnalysisService {
  async assertAccess(job, resume, user) {
    const isAdmin = user.role === 'admin';
    const isCandidateOwner = resume.owner === 'candidate' && String(resume.candidateId) === String(user._id);
    const isRecruiterOwner = String(job.recruiterId) === String(user._id);

    if (!isAdmin && !isCandidateOwner && !isRecruiterOwner) {
      throw ApiError.forbidden('You are not authorized to view this analysis');
    }
  }

  async getOrComputeAnalysis(jobId, resumeId, user) {
    const [job, resume] = await Promise.all([Job.findById(jobId), Resume.findById(resumeId)]);

    if (!job) throw ApiError.notFound('Job not found');
    if (!resume) throw ApiError.notFound('Resume not found');

    await this.assertAccess(job, resume, user);

    if (resume.processingStatus === 'queued' || resume.processingStatus === 'processing') {
      return { status: 'processing', message: 'Resume is still being analyzed. Please check back shortly.' };
    }
    if (resume.processingStatus === 'failed') {
      return {
        status: 'failed',
        message: resume.processingError || 'Resume processing failed. Please re-upload or re-analyze your resume.',
      };
    }

    const existing = await ResumeAnalysis.findOne({ jobId, resumeId });
    const resumeVersion = resume.updatedAt;
    const jobVersion = job.updatedAt;

    if (
      existing &&
      existing.resumeVersion.getTime() === resumeVersion.getTime() &&
      existing.jobVersion.getTime() === jobVersion.getTime()
    ) {
      return { status: 'completed', cached: true, analysis: existing.toObject() };
    }

    const result = matchEngine.computeMatch(resume, job);

    const analysis = await ResumeAnalysis.findOneAndUpdate(
      { jobId, resumeId },
      {
        jobId,
        resumeId,
        candidateId: resume.owner === 'candidate' ? resume.candidateId : null,
        overallScore: result.overallScore,
        skillScore: result.skillScore,
        experienceScore: result.experienceScore,
        projectScore: result.projectScore,
        educationScore: result.educationScore,
        certificationScore: result.certificationScore,
        matchedSkills: result.matchedSkills,
        missingSkills: result.missingSkills,
        partialSkills: result.partialSkills,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        recommendations: result.recommendations,
        matchCategory: result.matchCategory,
        resumeVersion,
        jobVersion,
      },
      { upsert: true, new: true }
    );

    return { status: 'completed', cached: false, analysis: analysis.toObject() };
  }
}

module.exports = new AnalysisService();
