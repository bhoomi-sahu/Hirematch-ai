const aiService = require('../../src/services/ai.service');

describe('aiService.normalizeSkill', () => {
  test('maps common aliases to a canonical form', () => {
    expect(aiService.normalizeSkill('React.js')).toBe('react');
    expect(aiService.normalizeSkill('ReactJS')).toBe('react');
    expect(aiService.normalizeSkill('NodeJS')).toBe('node.js');
    expect(aiService.normalizeSkill('Mongo DB')).toBe('mongodb');
    expect(aiService.normalizeSkill('  TypeScript ')).toBe('typescript');
  });

  test('returns lowercased trimmed input for unknown skills', () => {
    expect(aiService.normalizeSkill('Blockchain')).toBe('blockchain');
  });

  test('handles empty/invalid input safely', () => {
    expect(aiService.normalizeSkill('')).toBe('');
    expect(aiService.normalizeSkill(null)).toBe('');
    expect(aiService.normalizeSkill(undefined)).toBe('');
    expect(aiService.normalizeSkill(42)).toBe('');
  });
});

describe('aiService.deterministicParseResume', () => {
  const sampleResume = `
John Smith
john.smith@example.com
+1 415-555-0134
linkedin.com/in/johnsmith
github.com/johnsmith

EXPERIENCE
Software Engineer at Acme Corp, 2020-2023. Built scalable APIs with Node.js and React.

EDUCATION
BSc in Computer Science, State University, 2019

PROJECTS
Personal Finance Tracker - a React and Node.js app for tracking expenses.

CERTIFICATIONS
AWS Certified Developer
Scrum Master Certified
`;

  test('extracts email and phone via regex', () => {
    const result = aiService.deterministicParseResume(sampleResume);
    expect(result.email).toBe('john.smith@example.com');
    expect(result.phone).toContain('415');
  });

  test('extracts a plausible name from the first lines', () => {
    const result = aiService.deterministicParseResume(sampleResume);
    expect(result.name).toBe('John Smith');
  });

  test('detects known technical skills from free text', () => {
    const result = aiService.deterministicParseResume(sampleResume);
    expect(result.skills).toEqual(expect.arrayContaining(['React', 'Node.js']));
  });

  test('extracts LinkedIn and GitHub links', () => {
    const result = aiService.deterministicParseResume(sampleResume);
    expect(result.links.linkedin).toContain('linkedin.com/in/johnsmith');
    expect(result.links.github).toContain('github.com/johnsmith');
  });

  test('marks the result source as deterministic', () => {
    const result = aiService.deterministicParseResume(sampleResume);
    expect(result.source).toBe('deterministic');
  });

  test('never invents data for an empty or near-empty resume', () => {
    const result = aiService.deterministicParseResume('');
    expect(result.name).toBeNull();
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.skills).toEqual([]);
    expect(result.education).toEqual([]);
    expect(result.experience).toEqual([]);
    expect(result.projects).toEqual([]);
    expect(result.certifications).toEqual([]);
  });

  test('does not crash on garbage/random binary-ish text', () => {
    expect(() => aiService.deterministicParseResume('\x00\x01\x02 random !@#$ garbage')).not.toThrow();
  });
});

describe('aiService.sanitizeParsedResume', () => {
  test('fills in safe defaults for a sparse/malformed AI response', () => {
    const result = aiService.sanitizeParsedResume({ skills: ['React', 42, null, 'Node.js'] });
    expect(result.skills).toEqual(['React', 'Node.js']);
    expect(result.name).toBeNull();
    expect(result.education).toEqual([]);
    expect(result.links).toEqual({ linkedin: '', github: '', portfolio: '' });
  });

  test('handles a completely empty object without throwing', () => {
    expect(() => aiService.sanitizeParsedResume({})).not.toThrow();
    const result = aiService.sanitizeParsedResume({});
    expect(result.skills).toEqual([]);
  });

  test('never lets non-array fields through as arrays', () => {
    const result = aiService.sanitizeParsedResume({ skills: 'not-an-array', education: 'nope' });
    expect(Array.isArray(result.skills)).toBe(true);
    expect(Array.isArray(result.education)).toBe(true);
  });
});

describe('aiService.parseResumeText (fallback path when no AI key configured)', () => {
  test('falls back to the deterministic parser when AI_API_KEY is empty', async () => {
    const result = await aiService.parseResumeText('Experienced with Python and Docker. john@doe.com');
    expect(result.source).toBe('deterministic');
    expect(result.skills).toEqual(expect.arrayContaining(['Python', 'Docker']));
  });

  test('returns an empty deterministic shape for very short/empty text without crashing', async () => {
    const result = await aiService.parseResumeText('hi');
    expect(result.skills).toEqual([]);
  });
});

describe('aiService.calculateSemanticMatch', () => {
  const job = { skillsRequired: ['React', 'Node.js'], experienceLevel: 'Mid Level' };

  test('scores a well-matched candidate profile highly', () => {
    const profile = { skills: ['React', 'Node.js'], experienceYears: 3, headline: 'Full-stack engineer', bio: 'Building things for years with React and Node.' };
    const result = aiService.calculateSemanticMatch(profile, job);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.skillsMissing).toEqual([]);
  });

  test('never returns a score above 98 or below 20 (defined bounds)', () => {
    const emptyProfile = { skills: [], experienceYears: 0 };
    const result = aiService.calculateSemanticMatch(emptyProfile, job);
    expect(result.score).toBeGreaterThanOrEqual(20);
    expect(result.score).toBeLessThanOrEqual(98);
  });

  test('gives a neutral "Good Fit" result when the job defines no required skills', () => {
    const result = aiService.calculateSemanticMatch({ skills: [] }, { skillsRequired: [] });
    expect(result.status).toBe('Good Fit');
  });
});
