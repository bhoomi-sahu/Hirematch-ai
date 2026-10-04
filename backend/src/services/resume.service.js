const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const { Resume } = require('../models');
const ApiError = require('../utils/ApiError');
const aiService = require('./ai.service');

class ResumeService {
  /**
   * Handle a freshly-uploaded candidate resume file: create the DB record,
   * then process it (extract text + parse) before returning.
   */
  async uploadResume(candidateId, file) {
    if (!file) {
      throw ApiError.badRequest('No resume file was uploaded');
    }

    // Deactivate previous resumes so only the latest is "active" for applications,
    // while keeping history browsable.
    await Resume.updateMany({ candidateId, owner: 'candidate' }, { isActive: false });

    const resume = await Resume.create({
      candidateId,
      owner: 'candidate',
      originalFileName: file.originalname,
      storedFileName: file.filename,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      processingStatus: 'queued',
      isActive: true,
    });

    await this.processResume(resume._id);
    return Resume.findById(resume._id).lean();
  }

  /**
   * Extract text from the PDF and run structured parsing. Updates processingStatus
   * through queued -> processing -> completed|failed.
   */
  async processResume(resumeId) {
    const resume = await Resume.findById(resumeId);
    if (!resume) return;

    resume.processingStatus = 'processing';
    resume.processingError = '';
    await resume.save();

    const emptyParsedResume =
      typeof aiService.deterministicParseResume === 'function'
        ? aiService.deterministicParseResume('')
        : {
            name: null,
            email: null,
            phone: null,
            skills: [],
            education: [],
            experience: [],
            projects: [],
            certifications: [],
            links: { linkedin: '', github: '', portfolio: '' },
            source: null,
          };

    try {
      const buffer = await fsp.readFile(resume.filePath);

      let extractedText = '';
      try {
        const pdfData = await pdfParse(buffer);
        extractedText = (pdfData.text || '').trim();
      } catch (parseErr) {
        resume.extractedText = '';
        resume.parsed = emptyParsedResume;
        resume.processingStatus = 'completed';
        resume.processingError = '';
        await resume.save();
        return resume;
      }

      if (!extractedText || extractedText.length < 15) {
        resume.extractedText = '';
        resume.parsed = emptyParsedResume;
        resume.processingStatus = 'completed';
        resume.processingError = '';
        await resume.save();
        return resume;
      }

      const parsed = await aiService.parseResumeText(extractedText);

      resume.extractedText = extractedText;
      resume.parsed = parsed;
      resume.processingStatus = 'completed';
      resume.processingError = '';
      await resume.save();
    } catch (err) {
      resume.processingStatus = 'failed';
      resume.processingError = err.message || 'Resume processing failed';
      await resume.save();
    }

    return resume;
  }

  async listCandidateResumes(candidateId) {
    return Resume.find({ candidateId, owner: 'candidate' }).sort({ createdAt: -1 }).lean();
  }

  async getResumeForUser(resumeId, user) {
    const resume = await Resume.findById(resumeId);
    if (!resume) throw ApiError.notFound('Resume not found');
    this.assertAccess(resume, user);
    return resume;
  }

  assertAccess(resume, user) {
    const isAdmin = user.role === 'admin';
    const isOwnerCandidate = resume.owner === 'candidate' && String(resume.candidateId) === String(user._id);
    const isOwnerRecruiter = resume.owner === 'bulk' && String(resume.recruiterId) === String(user._id);

    if (!isAdmin && !isOwnerCandidate && !isOwnerRecruiter) {
      throw ApiError.forbidden('You are not authorized to access this resume');
    }
  }

  async deleteResume(resumeId, user) {
    const resume = await this.getResumeForUser(resumeId, user);

    try {
      if (resume.filePath && fs.existsSync(resume.filePath)) {
        await fsp.unlink(resume.filePath);
      }
    } catch (err) {
      console.warn('⚠️ Failed to remove resume file from disk:', err.message);
    }

    await resume.deleteOne();
    return { success: true, message: 'Resume deleted successfully' };
  }

  async reprocessResume(resumeId, user) {
    const resume = await this.getResumeForUser(resumeId, user);
    await this.processResume(resume._id);
    return Resume.findById(resumeId).lean();
  }

  async streamResumeFile(resumeId, user, res) {
    const resume = await this.getResumeForUser(resumeId, user);

    if (!fs.existsSync(resume.filePath)) {
      throw ApiError.notFound('Resume file no longer exists on the server');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(resume.originalFileName)}"`);
    fs.createReadStream(resume.filePath).pipe(res);
  }
}

module.exports = new ResumeService();
