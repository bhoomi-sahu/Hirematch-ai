const { Job, Resume, ResumeImprovement } = require('../models');
const ApiError = require('../utils/ApiError');
const matchEngine = require('./matching/matchEngine');
const aiService = require('./ai.service');
const config = require('../config/env');

class ResumeImproveService {
  async generateImprovement(candidateId, resumeId, jobId) {
    const [resume, job] = await Promise.all([Resume.findById(resumeId), Job.findById(jobId)]);

    if (!resume) throw ApiError.notFound('Resume not found');
    if (String(resume.candidateId) !== String(candidateId)) {
      throw ApiError.forbidden('You are not authorized to improve this resume');
    }
    if (!job) throw ApiError.notFound('Job not found');
    if (resume.processingStatus !== 'completed') {
      throw ApiError.badRequest('Resume must finish processing before generating improvement suggestions');
    }

    const match = matchEngine.computeMatch(resume, job);
    const parsed = resume.parsed || {};

    const improvements = [];
    const warnings = [];
    const changes = [];

    // Missing keywords
    if (match.missingSkills.length > 0) {
      improvements.push({
        area: 'Keywords',
        suggestion: `This role looks for ${match.missingSkills.join(', ')}. Only add these if you genuinely have experience with them.`,
      });
      warnings.push(
        `Do not claim ${match.missingSkills.join(', ')} unless you have real experience with them — recruiters and AI screeners cross-check resumes against interviews.`
      );
    }

    // Skills present but not highlighted (mentioned in raw text but not in structured skills list)
    if (match.partialSkills.length > 0) {
      improvements.push({
        area: 'Skills Section',
        suggestion: `${match.partialSkills.join(', ')} appear in your resume text but aren't clearly listed in your skills section. Add them there if accurate, so ATS systems catch them.`,
      });
    }

    // Weak / missing sections
    if (!parsed.projects || parsed.projects.length === 0) {
      improvements.push({
        area: 'Projects',
        suggestion: 'No projects were detected. Adding 1–2 relevant projects with technologies used can significantly strengthen your match score.',
      });
    }
    if (!parsed.certifications || parsed.certifications.length === 0) {
      improvements.push({
        area: 'Certifications',
        suggestion: 'Consider adding relevant certifications if you hold any that weren\'t detected, or pursuing one relevant to this role.',
      });
    }

    // Weak wording detection: experience descriptions without any numbers/metrics
    const hasMetric = (text) => /\d+(%|\+)?/.test(text || '');
    (parsed.experience || []).forEach((exp, idx) => {
      if (exp.description && !hasMetric(exp.description)) {
        improvements.push({
          area: `Experience #${idx + 1}${exp.title ? ` (${exp.title})` : ''}`,
          suggestion: 'This description has no quantifiable metrics. Numbers (e.g. "improved performance by 20%") make achievements more credible and ATS-friendly — only add real figures.',
        });
      }
    });

    // Rewritten sections (AI-assisted where possible, always fact-checked/original fallback)
    const rewrittenSections = [];
    const relevantKeywords = [...match.matchedSkills, ...match.partialSkills];

    for (const [idx, exp] of (parsed.experience || []).entries()) {
      if (!exp.description) continue;
      const result = await aiService.improveSection(`Experience: ${exp.title || `Role #${idx + 1}`}`, exp.description, {
        title: job.title,
        relevantKeywords,
      });
      rewrittenSections.push({
        section: `Experience: ${exp.title || `Role #${idx + 1}`}`,
        original: exp.description,
        suggested: result.suggested,
        supportedByResume: result.supportedByResume,
      });
      if (result.changed) changes.push(`Rewrote "${exp.title || `Experience #${idx + 1}`}" for clarity and impact`);
    }

    for (const [idx, proj] of (parsed.projects || []).entries()) {
      if (!proj.description) continue;
      const result = await aiService.improveSection(`Project: ${proj.name || `Project #${idx + 1}`}`, proj.description, {
        title: job.title,
        relevantKeywords,
      });
      rewrittenSections.push({
        section: `Project: ${proj.name || `Project #${idx + 1}`}`,
        original: proj.description,
        suggested: result.suggested,
        supportedByResume: result.supportedByResume,
      });
      if (result.changed) changes.push(`Rewrote "${proj.name || `Project #${idx + 1}`}" for clarity and impact`);
    }

    const summary = `Your resume currently matches ${match.overallScore}% of this role's requirements (${match.matchCategory}). ${
      match.missingSkills.length > 0
        ? `The biggest opportunity is closing the gap on: ${match.missingSkills.slice(0, 3).join(', ')}.`
        : 'Your skill coverage is strong for this role — focus on sharpening how existing experience is described.'
    }`;

    const improvement = await ResumeImprovement.create({
      candidateId,
      resumeId,
      jobId,
      summary,
      suggestedSkills: match.missingSkills,
      improvements,
      rewrittenSections,
      changes,
      warnings,
      source: config.ai.apiKey ? 'ai' : 'deterministic',
    });

    return improvement.toObject();
  }

  async getImprovements(candidateId, resumeId) {
    return ResumeImprovement.find({ candidateId, resumeId }).sort({ createdAt: -1 }).lean();
  }
}

module.exports = new ResumeImproveService();
