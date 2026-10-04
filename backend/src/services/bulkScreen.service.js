const { randomUUID } = require('crypto');
const { Job, Resume, ResumeAnalysis } = require('../models');
const ApiError = require('../utils/ApiError');
const resumeService = require('./resume.service');
const matchEngine = require('./matching/matchEngine');

class BulkScreenService {
  async assertRecruiterOwnsJob(jobId, user) {
    const job = await Job.findById(jobId);
    if (!job) throw ApiError.notFound('Job not found');
    const isAdmin = user.role === 'admin';
    if (!isAdmin && String(job.recruiterId) !== String(user._id)) {
      throw ApiError.forbidden('You are not authorized to screen candidates for this job');
    }
    return job;
  }

  /**
   * Kick off a bulk screening batch. Creates one Resume record per file (status "queued"),
   * responds immediately with the batch id, then processes every resume in the background
   * so a single bad file can never block or fail the rest of the batch.
   */
  async startBatch(jobId, recruiterId, files) {
    if (!files || files.length === 0) {
      throw ApiError.badRequest('At least one resume file is required');
    }

    const batchId = randomUUID();

    const resumeDocs = await Promise.all(
      files.map((file) =>
        Resume.create({
          owner: 'bulk',
          recruiterId,
          batchId,
          jobId,
          originalFileName: file.originalname,
          storedFileName: file.filename,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          processingStatus: 'queued',
        })
      )
    );

    // Fire-and-forget: process each resume independently in the background.
    // Failures are isolated per-file inside processAndScoreOne.
    setImmediate(() => {
      resumeDocs.forEach((doc, idx) => {
        // Small stagger avoids hammering the AI provider / disk all at once.
        setTimeout(() => this.processAndScoreOne(doc._id, jobId), idx * 150);
      });
    });

    return { batchId, total: resumeDocs.length, resumeIds: resumeDocs.map((d) => d._id) };
  }

  async processAndScoreOne(resumeId, jobId) {
    try {
      await resumeService.processResume(resumeId);

      const [resume, job] = await Promise.all([Resume.findById(resumeId), Job.findById(jobId)]);
      if (!resume || !job || resume.processingStatus !== 'completed') return;

      const result = matchEngine.computeMatch(resume, job);

      await ResumeAnalysis.findOneAndUpdate(
        { jobId, resumeId },
        {
          jobId,
          resumeId,
          candidateId: null,
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
          resumeVersion: resume.updatedAt,
          jobVersion: job.updatedAt,
        },
        { upsert: true }
      );
    } catch (err) {
      console.warn(`⚠️ Bulk screening failed for resume ${resumeId}:`, err.message);
      await Resume.findByIdAndUpdate(resumeId, {
        processingStatus: 'failed',
        processingError: err.message || 'Screening failed',
      });
    }
  }

  async getBatchStatus(jobId, batchId, user) {
    await this.assertRecruiterOwnsJob(jobId, user);

    const resumes = await Resume.find({ jobId, batchId }).lean();
    const total = resumes.length;
    const counts = { queued: 0, processing: 0, completed: 0, failed: 0 };
    resumes.forEach((r) => {
      counts[r.processingStatus] = (counts[r.processingStatus] || 0) + 1;
    });

    const analyses = await ResumeAnalysis.find({
      jobId,
      resumeId: { $in: resumes.map((r) => r._id) },
    }).lean();
    const scoreByResume = new Map(analyses.map((a) => [String(a.resumeId), a]));

    const results = resumes.map((r) => {
      const analysis = scoreByResume.get(String(r._id));
      return {
        resumeId: r._id,
        name: r.parsed?.name || r.originalFileName,
        fileName: r.originalFileName,
        status: r.processingStatus,
        error: r.processingError || null,
        overallScore: analysis?.overallScore ?? null,
        matchCategory: analysis?.matchCategory ?? null,
      };
    });

    return {
      batchId,
      total,
      completed: counts.completed,
      processing: counts.processing,
      queued: counts.queued,
      failed: counts.failed,
      done: counts.completed + counts.failed === total,
      results,
    };
  }

  async getCandidates(jobId, filters, user) {
    await this.assertRecruiterOwnsJob(jobId, user);

    const { status, minScore, maxScore, search, skill, sort = '-score', page = 1, limit = 10 } = filters;

    const resumeQuery = { jobId, owner: 'bulk', processingStatus: 'completed' };
    if (status && status !== 'all') resumeQuery.screeningStatus = status;
    if (search && search.trim()) {
      resumeQuery.$or = [
        { 'parsed.name': { $regex: search.trim(), $options: 'i' } },
        { originalFileName: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    if (skill && skill.trim()) {
      resumeQuery['parsed.skills'] = { $regex: skill.trim(), $options: 'i' };
    }

    const resumes = await Resume.find(resumeQuery).lean();
    const analyses = await ResumeAnalysis.find({
      jobId,
      resumeId: { $in: resumes.map((r) => r._id) },
    }).lean();
    const analysisByResume = new Map(analyses.map((a) => [String(a.resumeId), a]));

    let combined = resumes.map((r) => ({
      resumeId: r._id,
      name: r.parsed?.name || r.originalFileName,
      email: r.parsed?.email || null,
      fileName: r.originalFileName,
      screeningStatus: r.screeningStatus,
      skills: r.parsed?.skills || [],
      analysis: analysisByResume.get(String(r._id)) || null,
    }));

    const minS = minScore !== undefined ? Number(minScore) : null;
    const maxS = maxScore !== undefined ? Number(maxScore) : null;
    if (minS !== null) combined = combined.filter((c) => (c.analysis?.overallScore ?? 0) >= minS);
    if (maxS !== null) combined = combined.filter((c) => (c.analysis?.overallScore ?? 0) <= maxS);

    combined.sort((a, b) => {
      const scoreA = a.analysis?.overallScore ?? 0;
      const scoreB = b.analysis?.overallScore ?? 0;
      return sort === 'score' ? scoreA - scoreB : scoreB - scoreA;
    });

    const total = combined.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const start = (pageNum - 1) * limitNum;
    const pageItems = combined.slice(start, start + limitNum);

    return {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      candidates: pageItems,
    };
  }

  async updateScreeningStatus(resumeId, newStatus, user) {
    const validStatuses = ['new', 'shortlisted', 'rejected'];
    if (!validStatuses.includes(newStatus)) {
      throw ApiError.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const resume = await Resume.findById(resumeId);
    if (!resume || resume.owner !== 'bulk') throw ApiError.notFound('Candidate resume not found');

    const isAdmin = user.role === 'admin';
    if (!isAdmin && String(resume.recruiterId) !== String(user._id)) {
      throw ApiError.forbidden('You are not authorized to update this candidate');
    }

    resume.screeningStatus = newStatus;
    await resume.save();
    return resume;
  }
}

module.exports = new BulkScreenService();
