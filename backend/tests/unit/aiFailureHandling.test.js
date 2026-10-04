const config = require('../../src/config/env');
const aiService = require('../../src/services/ai.service');

describe('AI failure handling — parseResumeText falls back gracefully', () => {
  const originalFetch = global.fetch;
  const originalKey = config.ai.apiKey;

  afterEach(() => {
    global.fetch = originalFetch;
    config.ai.apiKey = originalKey;
  });

  test('falls back to the deterministic parser when the Gemini API returns a non-OK HTTP status', async () => {
    config.ai.apiKey = 'fake-key-for-test';
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });

    const result = await aiService.parseResumeText('Skilled in Python and Docker. jane@doe.com');
    expect(result.source).toBe('deterministic');
    expect(result.skills).toEqual(expect.arrayContaining(['Python', 'Docker']));
  });

  test('falls back to the deterministic parser when the Gemini API returns malformed JSON', async () => {
    config.ai.apiKey = 'fake-key-for-test';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: '{not valid json' }] } }] }),
    });

    const result = await aiService.parseResumeText('Skilled in Python and Docker. jane@doe.com');
    expect(result.source).toBe('deterministic');
  });

  test('falls back to the deterministic parser when the Gemini API response has no candidates at all', async () => {
    config.ai.apiKey = 'fake-key-for-test';
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ candidates: [] }) });

    const result = await aiService.parseResumeText('Skilled in Python and Docker. jane@doe.com');
    expect(result.source).toBe('deterministic');
  });

  test('falls back to the deterministic parser when the network call throws (timeout/connection error)', async () => {
    config.ai.apiKey = 'fake-key-for-test';
    global.fetch = jest.fn().mockRejectedValue(new Error('network timeout'));

    const result = await aiService.parseResumeText('Skilled in Python and Docker. jane@doe.com');
    expect(result.source).toBe('deterministic');
  });

  test('uses the deterministic parser directly (no network call at all) when no API key is configured', async () => {
    config.ai.apiKey = '';
    global.fetch = jest.fn();

    await aiService.parseResumeText('Skilled in Python and Docker. jane@doe.com');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('a successful, well-formed AI response is used and marked as AI-sourced', async () => {
    config.ai.apiKey = 'fake-key-for-test';
    const structured = { skills: ['Python'], education: [], experience: [], projects: [], certifications: [], links: {} };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(structured) }] } }] }),
    });

    const result = await aiService.parseResumeText('Skilled in Python. jane@doe.com');
    expect(result.source).toBe('ai');
    expect(result.skills).toEqual(['Python']);
  });
});

describe('AI failure handling — calculateMatch falls back to the semantic matcher', () => {
  const originalFetch = global.fetch;
  const originalKey = config.ai.apiKey;

  afterEach(() => {
    global.fetch = originalFetch;
    config.ai.apiKey = originalKey;
  });

  test('falls back to calculateSemanticMatch when the Gemini call fails', async () => {
    config.ai.apiKey = 'fake-key-for-test';
    global.fetch = jest.fn().mockRejectedValue(new Error('rate limited'));

    const profile = { skills: ['React'], experienceYears: 2 };
    const job = { skillsRequired: ['React'], experienceLevel: 'Mid Level' };

    const result = await aiService.calculateMatch(profile, job);
    // The semantic fallback always returns these fields — proves it didn't crash or hang
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('skillsMatched');
  });

  test('goes straight to the semantic matcher (no network call) when no API key is set', async () => {
    config.ai.apiKey = '';
    global.fetch = jest.fn();
    await aiService.calculateMatch({ skills: [] }, { skillsRequired: [] });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('AI failure handling — improveSection never blocks on AI failure', () => {
  const originalFetch = global.fetch;
  const originalKey = config.ai.apiKey;

  afterEach(() => {
    global.fetch = originalFetch;
    config.ai.apiKey = originalKey;
  });

  test('returns the original text unchanged when the AI call fails', async () => {
    config.ai.apiKey = 'fake-key-for-test';
    global.fetch = jest.fn().mockRejectedValue(new Error('service unavailable'));

    const result = await aiService.improveSection('Experience', 'Built things with React.', {
      title: 'Frontend Engineer',
      relevantKeywords: ['React'],
    });

    expect(result.suggested).toBe('Built things with React.');
    expect(result.changed).toBe(false);
  });

  test('returns the original text unchanged when no API key is configured', async () => {
    config.ai.apiKey = '';
    const result = await aiService.improveSection('Experience', 'Built things with React.', {
      title: 'Frontend Engineer',
      relevantKeywords: [],
    });
    expect(result.suggested).toBe('Built things with React.');
  });
});
