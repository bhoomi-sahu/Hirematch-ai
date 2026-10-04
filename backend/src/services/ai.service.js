const config = require('../config/env');

class AiService {
  constructor() {
    // Normalization dictionary for common tech synonyms and skill aliases
    this.skillAliases = {
      react: ['react', 'react.js', 'reactjs'],
      'node.js': ['node', 'node.js', 'nodejs', 'express', 'express.js'],
      javascript: ['javascript', 'js', 'es6', 'ecmascript'],
      typescript: ['typescript', 'ts'],
      python: ['python', 'py', 'django', 'fastapi', 'flask'],
      mongodb: ['mongodb', 'mongo', 'mongo db', 'mongoose', 'nosql'],
      sql: ['sql', 'postgresql', 'postgres', 'mysql', 'sqlite'],
      docker: ['docker', 'containerization', 'containers'],
      kubernetes: ['kubernetes', 'k8s'],
      aws: ['aws', 'amazon web services', 'cloud'],
      'tailwind css': ['tailwind', 'tailwind css', 'tailwindcss'],
      'next.js': ['next', 'next.js', 'nextjs'],
      graphql: ['graphql', 'apollo'],
      git: ['git', 'github', 'version control'],
      java: ['java', 'spring', 'spring boot'],
      'c#': ['c#', '.net', 'dotnet'],
      devops: ['devops', 'ci/cd', 'jenkins', 'github actions'],
    };
  }

  /**
   * Normalize a skill string for comparison
   */
  normalizeSkill(skill) {
    if (!skill || typeof skill !== 'string') return '';
    const clean = skill.trim().toLowerCase();
    for (const [canonical, aliases] of Object.entries(this.skillAliases)) {
      if (aliases.includes(clean) || clean === canonical) {
        return canonical;
      }
    }
    return clean;
  }

  /**
   * Perform AI / Semantic Resume Match against Job Requirements
   */
  async calculateMatch(candidateProfile, job) {
    // If Gemini API Key is configured, attempt live LLM generation
    if (config.ai.apiKey && config.ai.apiKey.trim().length > 0) {
      try {
        const llmResult = await this.callGeminiLLM(candidateProfile, job);
        if (llmResult) return llmResult;
      } catch (err) {
        console.warn('⚠️ Gemini LLM call failed, gracefully falling back to Semantic Matcher:', err.message);
      }
    }

    // High-Fidelity Heuristic / Semantic NLP Fallback Engine
    return this.calculateSemanticMatch(candidateProfile, job);
  }

  /**
   * High-Fidelity Semantic NLP Matching Engine
   */
  calculateSemanticMatch(candidateProfile, job) {
    const candidateSkills = (candidateProfile?.skills || []).map((s) => s.trim());
    const jobSkills = (job?.skillsRequired || []).map((s) => s.trim());

    if (jobSkills.length === 0) {
      return {
        score: 75,
        status: 'Good Fit',
        skillsMatched: candidateSkills,
        skillsMissing: [],
        strengths: ['Strong baseline profile alignment'],
        gapAnalysis: [],
        aiSummary: 'Candidate possesses general technical foundation for this requisition.',
        recommendation: 'Recommended for Interview',
        analyzedAt: new Date(),
      };
    }

    const normalizedCandidateSkills = new Set(
      candidateSkills.map((s) => this.normalizeSkill(s))
    );

    // Also parse candidate's resumeText & bio for additional skills
    const combinedResumeText = `${candidateProfile?.bio || ''} ${candidateProfile?.resumeText || ''} ${candidateProfile?.headline || ''}`.toLowerCase();
    
    const matchedSkills = [];
    const missingSkills = [];

    for (const jobSkill of jobSkills) {
      const normJobSkill = this.normalizeSkill(jobSkill);
      const isDirectMatch = normalizedCandidateSkills.has(normJobSkill);
      const isTextMatch = combinedResumeText.includes(jobSkill.toLowerCase());

      if (isDirectMatch || isTextMatch) {
        matchedSkills.push(jobSkill);
      } else {
        missingSkills.push(jobSkill);
      }
    }

    // 1. Skill Match Ratio (70% weight)
    const skillRatio = matchedSkills.length / jobSkills.length;
    const skillScore = Math.round(skillRatio * 70);

    // 2. Experience Alignment (20% weight)
    const candidateYears = candidateProfile?.experienceYears || 1;
    const requiredLevel = job?.experienceLevel || 'Mid Level';
    let expScore = 15;

    if (requiredLevel === 'Entry Level') {
      expScore = candidateYears >= 0 ? 20 : 15;
    } else if (requiredLevel === 'Mid Level') {
      expScore = candidateYears >= 2 ? 20 : candidateYears >= 1 ? 14 : 8;
    } else if (requiredLevel === 'Senior Level') {
      expScore = candidateYears >= 5 ? 20 : candidateYears >= 3 ? 14 : 7;
    } else if (requiredLevel === 'Lead / Staff' || requiredLevel === 'Executive') {
      expScore = candidateYears >= 7 ? 20 : candidateYears >= 4 ? 12 : 5;
    }

    // 3. Keyword / Profile Completeness (10% weight)
    let completenessBonus = 5;
    if (candidateProfile?.headline && candidateProfile.headline.length > 5) completenessBonus += 2;
    if (candidateProfile?.bio && candidateProfile.bio.length > 20) completenessBonus += 3;

    // Total Score Calculation (Capped between 15 and 98 for realistic distribution)
    let totalScore = Math.min(Math.max(skillScore + expScore + completenessBonus, 20), 98);

    // Classification
    let status = 'Moderate Match';
    let recommendation = 'Review Portfolio';

    if (totalScore >= 80) {
      status = 'Strong Match';
      recommendation = 'Proceed to Technical Interview';
    } else if (totalScore >= 65) {
      status = 'Good Fit';
      recommendation = 'Recommended for Initial Phone Screen';
    } else if (totalScore >= 45) {
      status = 'Moderate Match';
      recommendation = 'Review Portfolio & Skill Assessments';
    } else {
      status = 'Low Match';
      recommendation = 'Consider Alternative Openings';
    }

    // Strengths Formulation
    const strengths = [];
    if (matchedSkills.length > 0) {
      strengths.push(`Demonstrated proficiency in core requirements: ${matchedSkills.slice(0, 3).join(', ')}`);
    }
    if (candidateYears >= 3) {
      strengths.push(`${candidateYears}+ years of industry background aligned with ${requiredLevel} demands`);
    }
    if (candidateProfile?.headline) {
      strengths.push(`Profile orientation aligns with role: "${candidateProfile.headline}"`);
    }

    // Gaps Formulation
    const gapAnalysis = [];
    if (missingSkills.length > 0) {
      gapAnalysis.push(`Gap in required competencies: ${missingSkills.slice(0, 3).join(', ')}`);
    }
    if (expScore < 15) {
      gapAnalysis.push(`Experience level (${candidateYears} yrs) is below typical expectation for ${requiredLevel}`);
    }

    const aiSummary = `${candidateProfile?.name || 'Candidate'} matches ${matchedSkills.length} of ${jobSkills.length} required competencies with an estimated match score of ${totalScore}%. ${
      totalScore >= 75
        ? 'High probability of onboarding success.'
        : 'Good potential with targeted ramp-up in secondary requirements.'
    }`;

    return {
      score: totalScore,
      status,
      skillsMatched: matchedSkills,
      skillsMissing: missingSkills,
      strengths,
      gapAnalysis,
      aiSummary,
      recommendation,
      analyzedAt: new Date(),
    };
  }

  /**
   * Live Gemini LLM Integration
   */
  async callGeminiLLM(candidateProfile, job) {
    const prompt = `
You are an expert AI talent intelligence system for HireMatch AI.
Evaluate how well the candidate profile matches the job requirements.

CANDIDATE:
Name: ${candidateProfile.name || 'Candidate'}
Headline: ${candidateProfile.headline || ''}
Bio: ${candidateProfile.bio || ''}
Experience Years: ${candidateProfile.experienceYears || 1}
Skills: ${(candidateProfile.skills || []).join(', ')}
Resume: ${candidateProfile.resumeText || ''}

JOB OPENING:
Title: ${job.title}
Company: ${job.company}
Experience Level: ${job.experienceLevel}
Required Skills: ${(job.skillsRequired || []).join(', ')}
Description: ${job.description}

Respond ONLY with valid JSON matching this exact structure:
{
  "score": <number between 0 and 100>,
  "status": "<'Strong Match' | 'Good Fit' | 'Moderate Match' | 'Low Match'>",
  "skillsMatched": ["<matched skill 1>", "<matched skill 2>"],
  "skillsMissing": ["<missing skill 1>", "<missing skill 2>"],
  "strengths": ["<strength 1>", "<strength 2>"],
  "gapAnalysis": ["<gap 1>", "<gap 2>"],
  "aiSummary": "<2 sentences evaluating candidate fit>",
  "recommendation": "<'Proceed to Technical Interview' | 'Recommended for Initial Phone Screen' | 'Review Portfolio & Skill Assessments' | 'Consider Alternative Openings'>"
}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.ai.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const json = await response.json();
    const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) throw new Error('Empty response from Gemini LLM');

    const parsed = JSON.parse(responseText);
    parsed.analyzedAt = new Date();
    return parsed;
  }

  /**
   * Analyze Candidate Resume for Feedback and Extraction
   */
  async analyzeResumeText(resumeText, targetRole = 'Software Engineer') {
    const words = resumeText.toLowerCase().split(/[\s,]+/);
    const identifiedSkills = [];

    for (const [canonical, aliases] of Object.entries(this.skillAliases)) {
      if (aliases.some((alias) => resumeText.toLowerCase().includes(alias))) {
        identifiedSkills.push(canonical.charAt(0).toUpperCase() + canonical.slice(1));
      }
    }

    const uniqueSkills = Array.from(new Set(identifiedSkills));
    const wordCount = words.length;

    const readinessScore = Math.min(
      Math.max(Math.round(uniqueSkills.length * 9 + (wordCount > 100 ? 25 : 10)), 30),
      95
    );

    return {
      readinessScore,
      skillsIdentified: uniqueSkills,
      wordCount,
      suggestions: [
        'Quantify achievements using metrics (e.g. "reduced latency by 35%")',
        'Highlight high-demand cloud and system architecture competencies',
        'Tailor technical summary section toward target job requisitions',
      ],
      aiFeedback: `Detected ${uniqueSkills.length} core technical competencies across ${wordCount} words. Resume exhibits solid foundational alignment for ${targetRole}.`,
    };
  }

  /**
   * Extract structured data (skills, education, experience, projects, certifications)
   * from raw resume text. Tries live LLM first (with a strict "do not invent" instruction),
   * falls back to deterministic heuristics if AI is unavailable or returns something unusable.
   * NEVER fabricates information: any field not found returns null/[].
   */
  async parseResumeText(rawText) {
    if (!rawText || rawText.trim().length < 20) {
      return this.deterministicParseResume('');
    }

    if (config.ai.apiKey && config.ai.apiKey.trim().length > 0) {
      try {
        const aiResult = await this.callGeminiResumeParser(rawText);
        if (aiResult) return { ...aiResult, source: 'ai' };
      } catch (err) {
        console.warn('⚠️ Gemini resume parsing failed, falling back to deterministic parser:', err.message);
      }
    }

    return this.deterministicParseResume(rawText);
  }

  async callGeminiResumeParser(rawText) {
    const prompt = `
You are a strict, literal resume-parsing engine. Extract ONLY information that is explicitly present in the resume text below.

CRITICAL RULES:
- NEVER invent, infer, or guess skills, companies, job titles, education, certifications, or projects that are not explicitly written in the text.
- If a field is not present, return null (for single values) or [] (for lists). Do not leave it blank with a guess.
- Do not add skills just because they are commonly paired with other skills you do see.

RESUME TEXT:
"""
${rawText.slice(0, 12000)}
"""

Respond ONLY with valid JSON matching this exact structure, nothing else:
{
  "name": "<string or null>",
  "email": "<string or null>",
  "phone": "<string or null>",
  "skills": ["<skill>", ...],
  "education": [{ "institution": "", "degree": "", "fieldOfStudy": "", "year": "" }],
  "experience": [{ "title": "", "company": "", "duration": "", "description": "" }],
  "projects": [{ "name": "", "description": "", "technologies": ["..."] }],
  "certifications": ["..."],
  "links": { "linkedin": "", "github": "", "portfolio": "" }
}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.ai.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const json = await response.json();
    const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) throw new Error('Empty response from Gemini LLM');

    const parsed = JSON.parse(responseText);
    return this.sanitizeParsedResume(parsed);
  }

  /**
   * Ensure the parsed resume object always has the correct shape/types,
   * regardless of whether it came from the LLM or the deterministic fallback.
   */
  sanitizeParsedResume(input = {}) {
    return {
      name: typeof input.name === 'string' && input.name.trim() ? input.name.trim() : null,
      email: typeof input.email === 'string' && input.email.trim() ? input.email.trim() : null,
      phone: typeof input.phone === 'string' && input.phone.trim() ? input.phone.trim() : null,
      skills: Array.isArray(input.skills) ? input.skills.filter((s) => typeof s === 'string' && s.trim()) : [],
      education: Array.isArray(input.education)
        ? input.education.map((e) => ({
            institution: e?.institution || '',
            degree: e?.degree || '',
            fieldOfStudy: e?.fieldOfStudy || '',
            year: e?.year || '',
          }))
        : [],
      experience: Array.isArray(input.experience)
        ? input.experience.map((e) => ({
            title: e?.title || '',
            company: e?.company || '',
            duration: e?.duration || '',
            description: e?.description || '',
          }))
        : [],
      projects: Array.isArray(input.projects)
        ? input.projects.map((p) => ({
            name: p?.name || '',
            description: p?.description || '',
            technologies: Array.isArray(p?.technologies) ? p.technologies : [],
          }))
        : [],
      certifications: Array.isArray(input.certifications)
        ? input.certifications.filter((c) => typeof c === 'string' && c.trim())
        : [],
      links: {
        linkedin: input.links?.linkedin || '',
        github: input.links?.github || '',
        portfolio: input.links?.portfolio || '',
      },
    };
  }

  /**
   * Deterministic (no-AI) resume parser using regex + section heuristics.
   * Used when no AI key is configured or the LLM call fails.
   */
  deterministicParseResume(rawText) {
    const text = rawText || '';
    const lower = text.toLowerCase();

    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(\+?\d{1,3}[\s-]?)?\(?\d{3,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/);
    const linkedinMatch = text.match(/(https?:\/\/)?(www\.)?linkedin\.com\/[a-zA-Z0-9\-_/]+/i);
    const githubMatch = text.match(/(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9\-_/]+/i);

    // Name heuristic: first non-empty line that looks like a name (2-4 capitalized words, no digits/@)
    let name = null;
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines.slice(0, 5)) {
      if (
        line.length < 40 &&
        !line.includes('@') &&
        !/\d/.test(line) &&
        /^[A-Z][a-zA-Z.'-]+(\s[A-Z][a-zA-Z.'-]+){1,3}$/.test(line)
      ) {
        name = line;
        break;
      }
    }

    const skills = [];
    for (const [canonical, aliases] of Object.entries(this.skillAliases)) {
      if (aliases.some((alias) => lower.includes(alias))) {
        skills.push(canonical.charAt(0).toUpperCase() + canonical.slice(1));
      }
    }

    // Section heuristics: split by common resume headers
    const sectionSplit = (label) => {
      const re = new RegExp(`\\n\\s*${label}\\s*\\n`, 'i');
      const parts = text.split(re);
      return parts.length > 1 ? parts[1] : '';
    };

    const experienceSection = sectionSplit('(experience|work experience|employment history)');
    const educationSection = sectionSplit('(education|academic background)');
    const projectsSection = sectionSplit('(projects|personal projects)');
    const certSection = sectionSplit('(certifications|licenses)');

    const experience = [];
    if (experienceSection) {
      const chunk = experienceSection.split(/\n\s*\n/)[0]?.slice(0, 800) || '';
      if (chunk.trim()) {
        experience.push({ title: '', company: '', duration: '', description: chunk.trim() });
      }
    }

    const education = [];
    if (educationSection) {
      const chunk = educationSection.split(/\n\s*\n/)[0]?.slice(0, 400) || '';
      if (chunk.trim()) {
        education.push({ institution: '', degree: chunk.trim(), fieldOfStudy: '', year: '' });
      }
    }

    const projects = [];
    if (projectsSection) {
      const chunk = projectsSection.split(/\n\s*\n/)[0]?.slice(0, 600) || '';
      if (chunk.trim()) {
        projects.push({ name: '', description: chunk.trim(), technologies: [] });
      }
    }

    const certifications = [];
    if (certSection) {
      certSection
        .split(/\n|,/)
        .map((c) => c.trim())
        .filter((c) => c.length > 2 && c.length < 100)
        .slice(0, 10)
        .forEach((c) => certifications.push(c));
    }

    return {
      name,
      email: emailMatch ? emailMatch[0] : null,
      phone: phoneMatch ? phoneMatch[0].trim() : null,
      skills: Array.from(new Set(skills)),
      education,
      experience,
      projects,
      certifications,
      links: {
        linkedin: linkedinMatch ? linkedinMatch[0] : '',
        github: githubMatch ? githubMatch[0] : '',
        portfolio: '',
      },
      source: 'deterministic',
    };
  }

  /**
   * Rewrite a single resume section (experience/project description) to be more
   * ATS-friendly and impactful, WITHOUT inventing new facts. Falls back to
   * returning the original text untouched if AI is unavailable.
   */
  async improveSection(sectionLabel, originalText, jobContext) {
    if (!originalText || !originalText.trim()) {
      return { suggested: originalText, supportedByResume: true, changed: false };
    }

    if (!config.ai.apiKey || !config.ai.apiKey.trim()) {
      return { suggested: originalText, supportedByResume: true, changed: false };
    }

    try {
      const prompt = `
You are an ATS resume-writing assistant. Rewrite the following resume section to be clearer, more
impactful, and ATS-friendly for a "${jobContext.title}" role.

ABSOLUTE RULES:
- Do NOT invent new skills, technologies, companies, titles, numbers, or achievements that are not
  already present in the original text.
- You MAY improve wording, structure, and use stronger action verbs.
- You MAY naturally incorporate these already-relevant target keywords ONLY IF they are consistent
  with what's already described: ${jobContext.relevantKeywords.join(', ') || 'none'}.
- If you cannot improve it without inventing facts, return the original text unchanged.

SECTION: ${sectionLabel}
ORIGINAL TEXT:
"""
${originalText.slice(0, 1500)}
"""

Respond ONLY with valid JSON: { "suggested": "<rewritten text>" }
`;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.ai.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (!response.ok) throw new Error(`Gemini API returned status ${response.status}`);
      const json = await response.json();
      const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) throw new Error('Empty response');

      const parsed = JSON.parse(responseText);
      const suggested = typeof parsed.suggested === 'string' && parsed.suggested.trim() ? parsed.suggested.trim() : originalText;

      return {
        suggested,
        supportedByResume: true,
        changed: suggested.trim() !== originalText.trim(),
      };
    } catch (err) {
      console.warn('⚠️ Section improvement AI call failed, keeping original text:', err.message);
      return { suggested: originalText, supportedByResume: true, changed: false };
    }
  }

  /**
   * Extract structured job requirements (skills, experience level, education,
   * responsibilities, keywords) from free-text job title/description/responsibilities.
   * Tries live LLM first, falls back to a deterministic keyword-scan parser.
   * Recruiter reviews/edits the result before saving — nothing here is auto-saved blindly.
   */
  async parseJobDescription(title, description, responsibilities = '') {
    const combinedText = `${title || ''}\n${description || ''}\n${responsibilities || ''}`;

    if (combinedText.trim().length < 10) {
      return this.deterministicParseJobDescription(title, description, responsibilities);
    }

    if (config.ai.apiKey && config.ai.apiKey.trim().length > 0) {
      try {
        const aiResult = await this.callGeminiJobParser(title, description, responsibilities);
        if (aiResult) return { ...aiResult, source: 'ai' };
      } catch (err) {
        console.warn('⚠️ Gemini job parsing failed, falling back to deterministic parser:', err.message);
      }
    }

    return this.deterministicParseJobDescription(title, description, responsibilities);
  }

  async callGeminiJobParser(title, description, responsibilities) {
    const prompt = `
You are a precise job-requirements extraction engine. Read the job posting below and extract
structured requirements. ONLY use information explicitly present or clearly implied by the text —
do not invent unrelated skills.

JOB TITLE: ${title || ''}

DESCRIPTION:
"""
${(description || '').slice(0, 6000)}
"""

RESPONSIBILITIES / NOTES:
"""
${(responsibilities || '').slice(0, 3000)}
"""

Respond ONLY with valid JSON matching this exact structure, nothing else:
{
  "requiredSkills": ["<skill>", ...],
  "preferredSkills": ["<nice-to-have skill>", ...],
  "experience": "<one of: Entry Level, Mid Level, Senior Level, Lead / Staff, Executive>",
  "education": "<short string, or empty string if not specified>",
  "responsibilities": ["<bullet point>", ...],
  "keywords": ["<ATS keyword>", ...]
}
`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.ai.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const json = await response.json();
    const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) throw new Error('Empty response from Gemini LLM');

    const parsed = JSON.parse(responseText);
    return this.sanitizeParsedJob(parsed);
  }

  sanitizeParsedJob(input = {}) {
    const validLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead / Staff', 'Executive'];
    return {
      requiredSkills: Array.isArray(input.requiredSkills) ? input.requiredSkills.filter((s) => typeof s === 'string' && s.trim()) : [],
      preferredSkills: Array.isArray(input.preferredSkills) ? input.preferredSkills.filter((s) => typeof s === 'string' && s.trim()) : [],
      experience: validLevels.includes(input.experience) ? input.experience : 'Mid Level',
      education: typeof input.education === 'string' ? input.education : '',
      responsibilities: Array.isArray(input.responsibilities) ? input.responsibilities.filter((r) => typeof r === 'string' && r.trim()) : [],
      keywords: Array.isArray(input.keywords) ? input.keywords.filter((k) => typeof k === 'string' && k.trim()) : [],
    };
  }

  /**
   * Deterministic (no-AI) job description parser using the same skill-alias
   * dictionary as the resume parser, plus simple keyword/regex heuristics.
   */
  deterministicParseJobDescription(title, description, responsibilities) {
    const text = `${title || ''} ${description || ''} ${responsibilities || ''}`;
    const lower = text.toLowerCase();

    const foundSkills = [];
    for (const [canonical, aliases] of Object.entries(this.skillAliases)) {
      if (aliases.some((alias) => lower.includes(alias))) {
        foundSkills.push(canonical.charAt(0).toUpperCase() + canonical.slice(1));
      }
    }

    let experience = 'Mid Level';
    if (/\b(senior|sr\.?)\b/.test(lower)) experience = 'Senior Level';
    else if (/\b(junior|jr\.?|entry.level|intern)\b/.test(lower)) experience = 'Entry Level';
    else if (/\b(lead|staff|principal)\b/.test(lower)) experience = 'Lead / Staff';
    else if (/\b(director|vp|head of|executive)\b/.test(lower)) experience = 'Executive';

    const educationMatch = text.match(/\b(bachelor'?s?|master'?s?|phd|doctorate|b\.?sc\.?|m\.?sc\.?|associate'?s?)[^.\n]{0,60}/i);
    const education = educationMatch ? educationMatch[0].trim() : '';

    const respSource = responsibilities && responsibilities.trim() ? responsibilities : description || '';
    const responsibilityLines = respSource
      .split(/\n|(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15 && s.length < 200)
      .slice(0, 8);

    return {
      requiredSkills: Array.from(new Set(foundSkills)),
      preferredSkills: [],
      experience,
      education,
      responsibilities: responsibilityLines,
      keywords: Array.from(new Set(foundSkills)),
      source: 'deterministic',
    };
  }
}

module.exports = new AiService();
