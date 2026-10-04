const matchEngine = require('../../src/services/matching/matchEngine');

const baseJob = {
  skillsRequired: ['React', 'Node.js', 'MongoDB'],
  preferredSkills: ['Docker'],
  experienceLevel: 'Mid Level',
  educationRequirement: '',
  certificationsRequired: [],
};

const strongResume = {
  extractedText: 'Experienced full-stack engineer. React, Node.js, MongoDB, Docker.',
  parsed: {
    skills: ['React', 'Node.js', 'MongoDB', 'Docker'],
    experience: [
      { title: 'Software Engineer', company: 'Acme', duration: '2019-2023', description: 'Built things' },
    ],
    projects: [
      { name: 'Dashboard', description: 'Built a React + Node.js dashboard', technologies: ['React', 'Node.js'] },
    ],
    education: [{ institution: 'State University', degree: 'BSc Computer Science', fieldOfStudy: 'CS', year: '2018' }],
    certifications: ['AWS Certified Developer'],
  },
};

const weakResume = {
  extractedText: 'Marketing graduate looking for opportunities. Familiar with Excel and PowerPoint.',
  parsed: {
    skills: ['Excel', 'PowerPoint'],
    experience: [],
    projects: [],
    education: [],
    certifications: [],
  },
};

describe('matchEngine.computeMatch', () => {
  test('gives a high score and "Strong Match" for a well-aligned resume', () => {
    const result = matchEngine.computeMatch(strongResume, baseJob);
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.matchCategory).toBe('Strong Match');
    expect(result.matchedSkills).toEqual(expect.arrayContaining(['React', 'Node.js', 'MongoDB']));
    expect(result.missingSkills).toEqual([]);
  });

  test('gives a low score and "Low Match" for a poorly-aligned resume', () => {
    const result = matchEngine.computeMatch(weakResume, baseJob);
    expect(result.overallScore).toBeLessThan(60);
    expect(result.matchCategory).toBe('Low Match');
    expect(result.missingSkills).toEqual(expect.arrayContaining(['React', 'Node.js', 'MongoDB']));
  });

  test('never returns a score outside the 0-100 range', () => {
    const result = matchEngine.computeMatch(weakResume, baseJob);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  test('treats skill matching as alias-aware (React.js == React)', () => {
    const resume = {
      extractedText: 'Built apps with React.js and NodeJS.',
      parsed: { skills: ['React.js', 'NodeJS', 'Mongo DB'], experience: [], projects: [], education: [], certifications: [] },
    };
    const result = matchEngine.computeMatch(resume, baseJob);
    expect(result.matchedSkills).toEqual(expect.arrayContaining(['React', 'Node.js', 'MongoDB']));
  });

  test('classifies skills mentioned in raw text but not the structured list as "partial", not "missing"', () => {
    const resume = {
      extractedText: 'I have some experience with MongoDB in side projects.',
      parsed: { skills: ['React', 'Node.js'], experience: [], projects: [], education: [], certifications: [] },
    };
    const result = matchEngine.computeMatch(resume, baseJob);
    expect(result.partialSkills).toContain('MongoDB');
    expect(result.missingSkills).not.toContain('MongoDB');
  });

  test('never fabricates matched skills that are not present anywhere in the resume', () => {
    const result = matchEngine.computeMatch(weakResume, baseJob);
    expect(result.matchedSkills).not.toContain('Node.js');
  });

  test('does not use any protected-characteristic fields in scoring', () => {
    const resumeWithProtectedFields = {
      ...strongResume,
      parsed: { ...strongResume.parsed, gender: 'female', age: 45, religion: 'n/a', race: 'n/a' },
    };
    const resultA = matchEngine.computeMatch(strongResume, baseJob);
    const resultB = matchEngine.computeMatch(resumeWithProtectedFields, baseJob);
    expect(resultA.overallScore).toBe(resultB.overallScore);
  });

  test('respects custom job-defined match weights', () => {
    const jobWithCustomWeights = { ...baseJob, matchWeights: { skills: 90, experience: 5, projects: 2, education: 2, certifications: 1 } };
    const result = matchEngine.computeMatch(strongResume, jobWithCustomWeights);
    // With skills weighted at 90 and a full skill match, skillScore should dominate the total
    expect(result.skillScore).toBeGreaterThan(70);
  });

  test('experience score gives full credit for Entry Level roles regardless of years', () => {
    const entryJob = { ...baseJob, experienceLevel: 'Entry Level' };
    const noExperienceResume = { ...weakResume, parsed: { ...weakResume.parsed, skills: baseJob.skillsRequired } };
    const result = matchEngine.computeMatch(noExperienceResume, entryJob);
    expect(result.experienceScore).toBe(20);
  });

  test('education score gives full credit when job has no specific requirement but resume has any education', () => {
    const result = matchEngine.computeMatch(strongResume, baseJob);
    expect(result.educationScore).toBe(10);
  });

  test('returns zero education score when resume has no education entries at all', () => {
    const result = matchEngine.computeMatch(weakResume, baseJob);
    expect(result.educationScore).toBe(0);
  });

  test('always returns non-empty strengths/weaknesses/recommendations arrays', () => {
    const result = matchEngine.computeMatch(weakResume, baseJob);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.weaknesses.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  test('handles a job with zero required skills without throwing', () => {
    const noSkillsJob = { ...baseJob, skillsRequired: [] };
    expect(() => matchEngine.computeMatch(strongResume, noSkillsJob)).not.toThrow();
  });

  test('gives close to zero (only baseline credit) for a resume with a completely empty parsed object', () => {
    const emptyResume = { extractedText: '', parsed: {} };
    expect(() => matchEngine.computeMatch(emptyResume, baseJob)).not.toThrow();
    const result = matchEngine.computeMatch(emptyResume, baseJob);
    // Small non-zero baseline is expected (e.g. certification baseline credit when
    // the job requires none) — the key assertion is that it stays very low.
    expect(result.overallScore).toBeLessThan(10);
  });
});

describe('matchEngine.estimateExperienceYears', () => {
  test('parses explicit year ranges like "2019-2023"', () => {
    const years = matchEngine.estimateExperienceYears({
      experience: [{ duration: '2019-2023' }],
    });
    expect(years).toBe(4);
  });

  test('treats "present" as the current year', () => {
    const currentYear = new Date().getFullYear();
    const years = matchEngine.estimateExperienceYears({
      experience: [{ duration: `2020-Present` }],
    });
    expect(years).toBe(currentYear - 2020);
  });

  test('falls back to a per-role estimate when duration text cannot be parsed', () => {
    const years = matchEngine.estimateExperienceYears({
      experience: [{ duration: '' }, { duration: '' }],
    });
    expect(years).toBe(3); // 2 roles * 1.5 fallback years
  });

  test('returns 0 for a candidate with no experience entries', () => {
    expect(matchEngine.estimateExperienceYears({ experience: [] })).toBe(0);
    expect(matchEngine.estimateExperienceYears({})).toBe(0);
  });
});
