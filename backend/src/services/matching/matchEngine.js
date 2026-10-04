const aiService = require('../ai.service');

const DEFAULT_WEIGHTS = {
  skills: 50,
  experience: 20,
  projects: 15,
  education: 10,
  certifications: 5,
};

const EXPERIENCE_LEVEL_YEARS = {
  'Entry Level': 0,
  'Mid Level': 2,
  'Senior Level': 5,
  'Lead / Staff': 7,
  Executive: 10,
};

class MatchEngine {
  normalize(skill) {
    return aiService.normalizeSkill(skill);
  }

  /**
   * Estimate total years of experience from parsed resume experience entries.
   * Deliberately conservative: only counts what's actually present.
   */
  estimateExperienceYears(parsed) {
    const entries = parsed?.experience || [];
    if (entries.length === 0) return 0;

    let totalYears = 0;
    let matchedAny = false;

    for (const entry of entries) {
      const duration = (entry.duration || '').toLowerCase();
      const yearRangeMatch = duration.match(/(\d{4})\s*[-–to]+\s*(\d{4}|present|current)/i);
      if (yearRangeMatch) {
        const start = parseInt(yearRangeMatch[1], 10);
        const end =
          /present|current/i.test(yearRangeMatch[2]) ? new Date().getFullYear() : parseInt(yearRangeMatch[2], 10);
        if (!isNaN(start) && !isNaN(end) && end >= start) {
          totalYears += end - start;
          matchedAny = true;
          continue;
        }
      }
      const yearsMatch = duration.match(/(\d+(\.\d+)?)\s*(\+)?\s*year/);
      if (yearsMatch) {
        totalYears += parseFloat(yearsMatch[1]);
        matchedAny = true;
      }
    }

    if (matchedAny) return Math.round(totalYears * 10) / 10;
    // Fallback: assume each listed role is roughly 1.5 years if no explicit duration could be parsed
    return Math.round(entries.length * 1.5 * 10) / 10;
  }

  computeSkillScore(resumeSkills, requiredSkills, preferredSkills, weight) {
    const normResumeSkills = new Set(resumeSkills.map((s) => this.normalize(s)));

    const matched = [];
    const missing = [];

    for (const skill of requiredSkills) {
      const norm = this.normalize(skill);
      if (normResumeSkills.has(norm)) {
        matched.push(skill);
      } else {
        missing.push(skill);
      }
    }

    const preferredMatched = [];
    for (const skill of preferredSkills) {
      const norm = this.normalize(skill);
      if (normResumeSkills.has(norm)) {
        preferredMatched.push(skill);
      }
    }

    const requiredRatio = requiredSkills.length > 0 ? matched.length / requiredSkills.length : 1;
    const preferredRatio = preferredSkills.length > 0 ? preferredMatched.length / preferredSkills.length : 0;

    // Required skills drive 85% of the skill weight, preferred skills add a small bonus on top
    const blended = requiredSkills.length > 0 ? requiredRatio * 0.85 + preferredRatio * 0.15 : 0.5;
    const score = Math.round(Math.min(blended, 1) * weight);

    return { score, matched, missing, preferredMatched };
  }

  computeExperienceScore(candidateYears, requiredLevel, weight) {
    const requiredYears = EXPERIENCE_LEVEL_YEARS[requiredLevel] ?? 2;
    if (requiredYears === 0) return weight; // entry level: any experience satisfies it fully
    const ratio = Math.min(candidateYears / requiredYears, 1);
    return Math.round(ratio * weight);
  }

  computeProjectScore(projects, requiredSkills, jobText, weight) {
    if (!projects || projects.length === 0) return 0;

    const normRequired = new Set(requiredSkills.map((s) => this.normalize(s)));
    let relevantCount = 0;

    for (const project of projects) {
      const techs = (project.technologies || []).map((t) => this.normalize(t));
      const text = `${project.name || ''} ${project.description || ''}`.toLowerCase();
      const hasSkillOverlap = techs.some((t) => normRequired.has(t));
      const hasTextOverlap = requiredSkills.some((s) => text.includes(s.toLowerCase()));
      if (hasSkillOverlap || hasTextOverlap) relevantCount += 1;
    }

    const presenceRatio = Math.min(projects.length / 2, 1); // having 2+ projects is "complete"
    const relevanceRatio = projects.length > 0 ? relevantCount / projects.length : 0;
    const blended = presenceRatio * 0.4 + relevanceRatio * 0.6;

    return Math.round(blended * weight);
  }

  computeEducationScore(education, educationRequirement, weight) {
    if (!education || education.length === 0) return 0;

    if (!educationRequirement || !educationRequirement.trim()) {
      // No specific requirement: having any education entry earns full credit
      return weight;
    }

    const reqLower = educationRequirement.toLowerCase();
    const hasMatch = education.some((e) => {
      const combined = `${e.degree || ''} ${e.fieldOfStudy || ''}`.toLowerCase();
      return reqLower.split(/[\s,/]+/).some((word) => word.length > 2 && combined.includes(word));
    });

    return hasMatch ? weight : Math.round(weight * 0.4);
  }

  computeCertificationScore(certifications, certificationsRequired, weight) {
    if (!certificationsRequired || certificationsRequired.length === 0) {
      return certifications && certifications.length > 0 ? weight : Math.round(weight * 0.5);
    }
    if (!certifications || certifications.length === 0) return 0;

    const normCandidate = certifications.map((c) => c.toLowerCase());
    const matchedCount = certificationsRequired.filter((req) =>
      normCandidate.some((c) => c.includes(req.toLowerCase()) || req.toLowerCase().includes(c))
    ).length;

    const ratio = matchedCount / certificationsRequired.length;
    return Math.round(ratio * weight);
  }

  /**
   * Main entry point.
   * @param {Object} resume - must expose { parsed: {...}, extractedText }
   * @param {Object} job - must expose { skillsRequired, preferredSkills, experienceLevel, educationRequirement, certificationsRequired, description, matchWeights }
   */
  computeMatch(resume, job, customWeights = null) {
    const weights = {
      ...DEFAULT_WEIGHTS,
      ...(job.matchWeights || {}),
      ...(customWeights || {}),
    };

    const parsed = resume.parsed || {};
    const resumeSkills = parsed.skills || [];
    const requiredSkills = job.skillsRequired || [];
    const preferredSkills = job.preferredSkills || [];

    const skillResult = this.computeSkillScore(resumeSkills, requiredSkills, preferredSkills, weights.skills);

    const candidateYears = this.estimateExperienceYears(parsed);
    const experienceScore = this.computeExperienceScore(candidateYears, job.experienceLevel, weights.experience);

    const projectScore = this.computeProjectScore(
      parsed.projects,
      requiredSkills,
      job.description || '',
      weights.projects
    );

    const educationScore = this.computeEducationScore(
      parsed.education,
      job.educationRequirement,
      weights.education
    );

    const certificationScore = this.computeCertificationScore(
      parsed.certifications,
      job.certificationsRequired,
      weights.certifications
    );

    // "Partial" skills: appear somewhere in raw resume text but weren't captured in structured skills list
    const rawText = (resume.extractedText || '').toLowerCase();
    const partialSkills = skillResult.missing.filter((skill) => rawText.includes(skill.toLowerCase()));
    const trueMissing = skillResult.missing.filter((skill) => !partialSkills.includes(skill));

    const overallScore = Math.min(
      100,
      Math.max(
        0,
        skillResult.score + experienceScore + projectScore + educationScore + certificationScore
      )
    );

    let matchCategory = 'Low Match';
    if (overallScore >= 80) matchCategory = 'Strong Match';
    else if (overallScore >= 60) matchCategory = 'Moderate Match';

    const strengths = [];
    if (skillResult.matched.length > 0) {
      strengths.push(`Matches ${skillResult.matched.length} of ${requiredSkills.length} required skills: ${skillResult.matched.slice(0, 5).join(', ')}`);
    }
    if (skillResult.preferredMatched.length > 0) {
      strengths.push(`Also covers preferred skills: ${skillResult.preferredMatched.join(', ')}`);
    }
    if (candidateYears > 0) {
      strengths.push(`Approximately ${candidateYears} year(s) of relevant experience`);
    }
    if (parsed.projects?.length > 0 && projectScore >= weights.projects * 0.6) {
      strengths.push('Portfolio of projects aligns with the role requirements');
    }
    if (strengths.length === 0) strengths.push('Profile on file, but limited overlap detected with this role');

    const weaknesses = [];
    if (trueMissing.length > 0) {
      weaknesses.push(`Missing required skills: ${trueMissing.slice(0, 5).join(', ')}`);
    }
    if (partialSkills.length > 0) {
      weaknesses.push(`Skills mentioned in resume text but not clearly listed: ${partialSkills.slice(0, 5).join(', ')}`);
    }
    const requiredYears = EXPERIENCE_LEVEL_YEARS[job.experienceLevel] ?? 2;
    if (candidateYears < requiredYears) {
      weaknesses.push(`Role typically expects ~${requiredYears}+ years; resume shows about ${candidateYears}`);
    }
    if (!parsed.projects || parsed.projects.length === 0) {
      weaknesses.push('No projects detected on the resume');
    }

    const recommendations = [];
    if (trueMissing.length > 0) {
      recommendations.push(`Consider gaining or highlighting experience with: ${trueMissing.slice(0, 3).join(', ')}`);
    }
    if (partialSkills.length > 0) {
      recommendations.push(`Add ${partialSkills.slice(0, 3).join(', ')} explicitly to the skills section if genuinely used`);
    }
    if (!parsed.certifications || parsed.certifications.length === 0) {
      recommendations.push('Relevant certifications could strengthen this application');
    }
    if (recommendations.length === 0) {
      recommendations.push('Strong alignment — tailor the resume summary to this specific role for best results');
    }

    return {
      overallScore,
      skillScore: skillResult.score,
      experienceScore,
      projectScore,
      educationScore,
      certificationScore,
      matchedSkills: skillResult.matched,
      missingSkills: trueMissing,
      partialSkills,
      strengths,
      weaknesses,
      recommendations,
      matchCategory,
      weightsUsed: weights,
      candidateYears,
    };
  }
}

module.exports = new MatchEngine();
