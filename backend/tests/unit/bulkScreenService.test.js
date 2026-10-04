jest.mock('../../src/models', () => ({
  Job: { findById: jest.fn() },
  Resume: { create: jest.fn(), find: jest.fn(), findById: jest.fn(), findByIdAndUpdate: jest.fn() },
  ResumeAnalysis: { findOneAndUpdate: jest.fn(), find: jest.fn() },
}));

jest.mock('../../src/services/resume.service', () => ({
  processResume: jest.fn(),
}));

const { Job, Resume, ResumeAnalysis } = require('../../src/models');
const resumeService = require('../../src/services/resume.service');
const bulkScreenService = require('../../src/services/bulkScreen.service');

describe('bulkScreenService.assertRecruiterOwnsJob', () => {
  test('throws 404 when the job does not exist', async () => {
    Job.findById.mockResolvedValue(null);
    await expect(bulkScreenService.assertRecruiterOwnsJob('job1', { _id: 'r1', role: 'recruiter' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  test('throws 403 when a different recruiter tries to screen for a job they do not own', async () => {
    Job.findById.mockResolvedValue({ _id: 'job1', recruiterId: 'owner-recruiter' });
    await expect(
      bulkScreenService.assertRecruiterOwnsJob('job1', { _id: 'someone-else', role: 'recruiter' })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test('allows the owning recruiter through', async () => {
    Job.findById.mockResolvedValue({ _id: 'job1', recruiterId: 'owner-recruiter' });
    await expect(
      bulkScreenService.assertRecruiterOwnsJob('job1', { _id: 'owner-recruiter', role: 'recruiter' })
    ).resolves.toBeTruthy();
  });

  test('allows an admin through regardless of ownership', async () => {
    Job.findById.mockResolvedValue({ _id: 'job1', recruiterId: 'owner-recruiter' });
    await expect(
      bulkScreenService.assertRecruiterOwnsJob('job1', { _id: 'admin1', role: 'admin' })
    ).resolves.toBeTruthy();
  });
});

describe('bulkScreenService.getBatchStatus — aggregation across mixed-status resumes', () => {
  test('correctly counts queued/processing/completed/failed and marks done only once all resolve', async () => {
    Job.findById.mockResolvedValue({ _id: 'job1', recruiterId: 'r1' });
    Resume.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { _id: 'r1', processingStatus: 'completed', originalFileName: 'a.pdf', parsed: { name: 'Alice' } },
        { _id: 'r2', processingStatus: 'completed', originalFileName: 'b.pdf', parsed: { name: 'Bob' } },
        { _id: 'r3', processingStatus: 'failed', originalFileName: 'c.pdf', processingError: 'bad pdf', parsed: {} },
        { _id: 'r4', processingStatus: 'processing', originalFileName: 'd.pdf', parsed: {} },
      ]),
    });
    ResumeAnalysis.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { resumeId: 'r1', overallScore: 92, matchCategory: 'Strong Match' },
        { resumeId: 'r2', overallScore: 55, matchCategory: 'Low Match' },
      ]),
    });

    const status = await bulkScreenService.getBatchStatus('job1', 'batch1', { _id: 'r1', role: 'recruiter' });

    expect(status.total).toBe(4);
    expect(status.completed).toBe(2);
    expect(status.failed).toBe(1);
    expect(status.processing).toBe(1);
    expect(status.done).toBe(false); // 2 completed + 1 failed = 3, not all 4 resolved yet
    expect(status.results.find((r) => r.resumeId === 'r1').overallScore).toBe(92);
    expect(status.results.find((r) => r.resumeId === 'r3').error).toBe('bad pdf');
  });

  test('reports done=true once every resume has reached a terminal state', async () => {
    Job.findById.mockResolvedValue({ _id: 'job1', recruiterId: 'r1' });
    Resume.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { _id: 'r1', processingStatus: 'completed', originalFileName: 'a.pdf', parsed: {} },
        { _id: 'r2', processingStatus: 'failed', originalFileName: 'b.pdf', parsed: {} },
      ]),
    });
    ResumeAnalysis.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

    const status = await bulkScreenService.getBatchStatus('job1', 'batch1', { _id: 'r1', role: 'recruiter' });
    expect(status.done).toBe(true);
  });
});

describe('bulkScreenService.processAndScoreOne — per-file failure isolation', () => {
  test('marks only the failing resume as failed without throwing, so the batch continues', async () => {
    resumeService.processResume.mockRejectedValue(new Error('disk read error'));
    Resume.findByIdAndUpdate.mockResolvedValue({});

    await expect(bulkScreenService.processAndScoreOne('bad-resume', 'job1')).resolves.toBeUndefined();
    expect(Resume.findByIdAndUpdate).toHaveBeenCalledWith(
      'bad-resume',
      expect.objectContaining({ processingStatus: 'failed' })
    );
  });

  test('skips scoring (no throw) when the resume finished processing but is not "completed"', async () => {
    resumeService.processResume.mockResolvedValue({});
    Resume.findById.mockResolvedValue({ _id: 'r1', processingStatus: 'failed' });
    Job.findById.mockResolvedValue({ _id: 'job1' });

    await expect(bulkScreenService.processAndScoreOne('r1', 'job1')).resolves.toBeUndefined();
    expect(ResumeAnalysis.findOneAndUpdate).not.toHaveBeenCalled();
  });
});

describe('bulkScreenService.updateScreeningStatus', () => {
  test('rejects an invalid status value', async () => {
    await expect(
      bulkScreenService.updateScreeningStatus('r1', 'not-a-real-status', { _id: 'recruiter1', role: 'recruiter' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('rejects updating a resume that is not a bulk-screened resume', async () => {
    Resume.findById.mockResolvedValue({ _id: 'r1', owner: 'candidate' });
    await expect(
      bulkScreenService.updateScreeningStatus('r1', 'shortlisted', { _id: 'recruiter1', role: 'recruiter' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test('blocks a recruiter who does not own the resume\'s batch', async () => {
    Resume.findById.mockResolvedValue({ _id: 'r1', owner: 'bulk', recruiterId: 'owner-recruiter', save: jest.fn() });
    await expect(
      bulkScreenService.updateScreeningStatus('r1', 'shortlisted', { _id: 'someone-else', role: 'recruiter' })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test('allows the owning recruiter to shortlist a candidate', async () => {
    const doc = { _id: 'r1', owner: 'bulk', recruiterId: 'recruiter1', screeningStatus: 'new', save: jest.fn().mockResolvedValue(true) };
    Resume.findById.mockResolvedValue(doc);
    const result = await bulkScreenService.updateScreeningStatus('r1', 'shortlisted', { _id: 'recruiter1', role: 'recruiter' });
    expect(result.screeningStatus).toBe('shortlisted');
    expect(doc.save).toHaveBeenCalled();
  });
});
