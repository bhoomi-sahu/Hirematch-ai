jest.mock('../../src/models', () => ({
  Resume: {
    updateMany: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('fs', () => ({
  promises: { readFile: jest.fn(), unlink: jest.fn() },
  existsSync: jest.fn(() => true),
  createReadStream: jest.fn(() => ({ pipe: jest.fn() })),
}));

jest.mock('pdf-parse', () => jest.fn());

jest.mock('../../src/services/ai.service', () => ({
  parseResumeText: jest.fn(),
}));

const fs = require('fs');
const pdfParse = require('pdf-parse');
const { Resume } = require('../../src/models');
const aiService = require('../../src/services/ai.service');
const resumeService = require('../../src/services/resume.service');

const makeResumeDoc = (overrides = {}) => ({
  _id: 'resume1',
  candidateId: 'candidate1',
  owner: 'candidate',
  filePath: '/tmp/fake.pdf',
  processingStatus: 'queued',
  processingError: '',
  extractedText: '',
  parsed: {},
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

describe('resumeService.processResume — text extraction & status transitions', () => {
  test('marks a resume completed with extracted text and parsed data on success', async () => {
    const doc = makeResumeDoc();
    Resume.findById.mockResolvedValue(doc);
    fs.promises.readFile.mockResolvedValue(Buffer.from('fake-pdf-bytes'));
    pdfParse.mockResolvedValue({ text: 'John Doe. Skilled in React and Node.js. john@doe.com' });
    aiService.parseResumeText.mockResolvedValue({ skills: ['React', 'Node.js'], source: 'deterministic' });

    await resumeService.processResume('resume1');

    expect(doc.processingStatus).toBe('completed');
    expect(doc.extractedText).toContain('React');
    expect(doc.parsed.skills).toEqual(['React', 'Node.js']);
    expect(doc.processingError).toBe('');
  });

  test('keeps a valid PDF upload as completed even when the PDF cannot be parsed cleanly', async () => {
    const doc = makeResumeDoc();
    Resume.findById.mockResolvedValue(doc);
    fs.promises.readFile.mockResolvedValue(Buffer.from('not-a-real-pdf'));
    pdfParse.mockRejectedValue(new Error('invalid PDF structure'));

    await resumeService.processResume('resume1');

    expect(doc.processingStatus).toBe('completed');
    expect(doc.processingError).toBe('');
  });

  test('keeps a valid PDF upload as completed when the PDF has no extractable text (empty/image-only PDF)', async () => {
    const doc = makeResumeDoc();
    Resume.findById.mockResolvedValue(doc);
    fs.promises.readFile.mockResolvedValue(Buffer.from('fake-pdf-bytes'));
    pdfParse.mockResolvedValue({ text: '   ' }); // whitespace only, simulating a scanned/image PDF

    await resumeService.processResume('resume1');

    expect(doc.processingStatus).toBe('completed');
    expect(doc.processingError).toBe('');
  });

  test('marks a resume failed when the AI/deterministic parser itself throws', async () => {
    const doc = makeResumeDoc();
    Resume.findById.mockResolvedValue(doc);
    fs.promises.readFile.mockResolvedValue(Buffer.from('fake-pdf-bytes'));
    pdfParse.mockResolvedValue({ text: 'Plenty of readable resume text right here.' });
    aiService.parseResumeText.mockRejectedValue(new Error('parser exploded'));

    await resumeService.processResume('resume1');

    expect(doc.processingStatus).toBe('failed');
    expect(doc.processingError).toBe('parser exploded');
  });

  test('transitions through "processing" status before finishing', async () => {
    const doc = makeResumeDoc();
    let statusDuringProcessing = null;
    Resume.findById.mockResolvedValue(doc);
    fs.promises.readFile.mockImplementation(async () => {
      statusDuringProcessing = doc.processingStatus;
      return Buffer.from('bytes');
    });
    pdfParse.mockResolvedValue({ text: 'Readable resume content here.' });
    aiService.parseResumeText.mockResolvedValue({ skills: [] });

    await resumeService.processResume('resume1');
    expect(statusDuringProcessing).toBe('processing');
    expect(doc.processingStatus).toBe('completed');
  });

  test('does nothing if the resume record no longer exists', async () => {
    Resume.findById.mockResolvedValue(null);
    await expect(resumeService.processResume('gone')).resolves.toBeUndefined();
  });
});

describe('resumeService ownership checks', () => {
  test('allows the owning candidate to access their own resume', () => {
    const doc = makeResumeDoc({ owner: 'candidate', candidateId: 'candidate1' });
    expect(() => resumeService.assertAccess(doc, { _id: 'candidate1', role: 'candidate' })).not.toThrow();
  });

  test('blocks a different candidate from accessing someone else\'s resume', () => {
    const doc = makeResumeDoc({ owner: 'candidate', candidateId: 'candidate1' });
    expect(() => resumeService.assertAccess(doc, { _id: 'candidate2', role: 'candidate' })).toThrow(
      expect.objectContaining({ statusCode: 403 })
    );
  });

  test('allows an admin to access any resume', () => {
    const doc = makeResumeDoc({ owner: 'candidate', candidateId: 'candidate1' });
    expect(() => resumeService.assertAccess(doc, { _id: 'admin1', role: 'admin' })).not.toThrow();
  });

  test('allows the owning recruiter to access a bulk-screened resume', () => {
    const doc = makeResumeDoc({ owner: 'bulk', candidateId: null, recruiterId: 'recruiter1' });
    expect(() => resumeService.assertAccess(doc, { _id: 'recruiter1', role: 'recruiter' })).not.toThrow();
  });

  test('blocks a recruiter from accessing another recruiter\'s bulk-screened resume', () => {
    const doc = makeResumeDoc({ owner: 'bulk', candidateId: null, recruiterId: 'recruiter1' });
    expect(() => resumeService.assertAccess(doc, { _id: 'recruiter2', role: 'recruiter' })).toThrow(
      expect.objectContaining({ statusCode: 403 })
    );
  });
});
