const aiService = require('../../src/services/ai.service');

describe('aiService.deterministicParseJobDescription', () => {
  const title = 'Senior Frontend Engineer';
  const description = `We are looking for a Senior Frontend Engineer to join our team.
You will build scalable UIs using React, TypeScript, and Tailwind CSS.
Experience with Node.js and GraphQL APIs is a plus.
Bachelor's degree in Computer Science or related field preferred.`;

  test('detects known technical skills mentioned in the description', () => {
    const result = aiService.deterministicParseJobDescription(title, description, '');
    expect(result.requiredSkills).toEqual(expect.arrayContaining(['React', 'Typescript', 'Tailwind css', 'Node.js', 'Graphql']));
  });

  test('infers Senior Level experience from the word "Senior" in the title', () => {
    const result = aiService.deterministicParseJobDescription(title, description, '');
    expect(result.experience).toBe('Senior Level');
  });

  test('infers Entry Level experience from "junior"/"intern" wording', () => {
    const result = aiService.deterministicParseJobDescription('Junior Developer', 'Great entry level opportunity for a junior developer.', '');
    expect(result.experience).toBe('Entry Level');
  });

  test('defaults to Mid Level when no seniority cues are present', () => {
    const result = aiService.deterministicParseJobDescription('Software Engineer', 'Build great software with our team.', '');
    expect(result.experience).toBe('Mid Level');
  });

  test('extracts an education requirement when mentioned', () => {
    const result = aiService.deterministicParseJobDescription(title, description, '');
    expect(result.education.toLowerCase()).toContain("bachelor");
  });

  test('returns an empty education string when none is mentioned', () => {
    const result = aiService.deterministicParseJobDescription('Engineer', 'Build things with React.', '');
    expect(result.education).toBe('');
  });

  test('never invents skills that are not mentioned anywhere in the text', () => {
    const result = aiService.deterministicParseJobDescription('Engineer', 'We use React for everything.', '');
    expect(result.requiredSkills).not.toContain('Kubernetes');
    expect(result.requiredSkills).not.toContain('Python');
  });

  test('always returns the full expected shape, even for minimal input', () => {
    const result = aiService.deterministicParseJobDescription('', '', '');
    expect(result).toEqual(
      expect.objectContaining({
        requiredSkills: expect.any(Array),
        preferredSkills: expect.any(Array),
        experience: expect.any(String),
        education: expect.any(String),
        responsibilities: expect.any(Array),
        keywords: expect.any(Array),
        source: 'deterministic',
      })
    );
  });

  test('keywords mirror the detected required skills', () => {
    const result = aiService.deterministicParseJobDescription(title, description, '');
    expect(result.keywords).toEqual(result.requiredSkills);
  });
});

describe('aiService.parseJobDescription (fallback path when no AI key configured)', () => {
  test('falls back to the deterministic parser when AI_API_KEY is empty', async () => {
    const result = await aiService.parseJobDescription('Backend Engineer', 'Work with Python and Docker daily.', '');
    expect(result.source).toBe('deterministic');
    expect(result.requiredSkills).toEqual(expect.arrayContaining(['Python', 'Docker']));
  });

  test('handles a near-empty job description without throwing', async () => {
    await expect(aiService.parseJobDescription('', '', '')).resolves.toBeDefined();
  });
});

describe('aiService.sanitizeParsedJob', () => {
  test('rejects an invalid experience level and substitutes a safe default', () => {
    const result = aiService.sanitizeParsedJob({ experience: 'Not A Real Level' });
    expect(result.experience).toBe('Mid Level');
  });

  test('filters out non-string entries from skill arrays', () => {
    const result = aiService.sanitizeParsedJob({ requiredSkills: ['React', 42, null, 'Node.js'] });
    expect(result.requiredSkills).toEqual(['React', 'Node.js']);
  });

  test('handles a completely empty object without throwing', () => {
    expect(() => aiService.sanitizeParsedJob({})).not.toThrow();
  });
});
