jest.mock('../../src/models', () => ({
  Job: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
  },
  Profile: { findOne: jest.fn() },
  Resume: { deleteMany: jest.fn() },
  ResumeAnalysis: { deleteMany: jest.fn() },
}));

const { Job, Profile, Resume, ResumeAnalysis } = require('../../src/models');
const jobService = require('../../src/services/job.service');

describe('jobService.createJob', () => {
  test('attaches the recruiterId to the created job', async () => {
    Job.create.mockResolvedValue({ _id: 'job1', title: 'Engineer' });
    await jobService.createJob('recruiter1', { title: 'Engineer', skillsRequired: ['React'] });
    expect(Job.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Engineer', recruiterId: 'recruiter1' })
    );
  });
});

describe('jobService.getJobs — filtering & pagination', () => {
  const chainable = (jobs) => ({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(jobs),
  });

  test('returns jobs with pagination metadata', async () => {
    Job.countDocuments.mockResolvedValue(25);
    Job.find.mockReturnValue(chainable([{ _id: 'job1' }, { _id: 'job2' }]));

    const result = await jobService.getJobs({ page: 2, limit: 10 });
    expect(result.jobs).toHaveLength(2);
    expect(result.meta).toEqual({ page: 2, limit: 10, total: 25, totalPages: 3 });
  });

  test('only searches active jobs by default', async () => {
    Job.countDocuments.mockResolvedValue(0);
    Job.find.mockReturnValue(chainable([]));
    await jobService.getJobs({});
    expect(Job.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
  });

  test('caps limit at 50 even if a larger value is requested', async () => {
    Job.countDocuments.mockResolvedValue(0);
    Job.find.mockReturnValue(chainable([]));
    const result = await jobService.getJobs({ limit: 500 });
    expect(result.meta.limit).toBe(50);
  });

  test('enriches jobs with a personalized match score when a candidate profile exists', async () => {
    Job.countDocuments.mockResolvedValue(1);
    Job.find.mockReturnValue(chainable([{ _id: 'job1', skillsRequired: ['React'] }]));
    Profile.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ skills: ['React'], experienceYears: 3 }) });

    const result = await jobService.getJobs({ candidateId: 'candidate1' });
    expect(result.jobs[0].matchScore).toEqual(expect.any(Number));
    expect(result.jobs[0].skillsMatched).toEqual(expect.arrayContaining(['React']));
  });

  test('does not attach match data when the candidate has no profile yet', async () => {
    Job.countDocuments.mockResolvedValue(1);
    Job.find.mockReturnValue(chainable([{ _id: 'job1', skillsRequired: ['React'] }]));
    Profile.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const result = await jobService.getJobs({ candidateId: 'candidate1' });
    expect(result.jobs[0].matchScore).toBeUndefined();
  });
});

describe('jobService.updateJob — ownership', () => {
  test('allows the owning recruiter to update their job', async () => {
    const job = { _id: 'job1', recruiterId: { toString: () => 'recruiter1' }, save: jest.fn().mockResolvedValue(true) };
    Job.findById.mockResolvedValue(job);
    const result = await jobService.updateJob('job1', 'recruiter1', { title: 'New Title' });
    expect(result.title).toBe('New Title');
    expect(job.save).toHaveBeenCalled();
  });

  test('blocks a recruiter who does not own the job', async () => {
    const job = { _id: 'job1', recruiterId: { toString: () => 'owner-recruiter' } };
    Job.findById.mockResolvedValue(job);
    await expect(jobService.updateJob('job1', 'someone-else', { title: 'Hacked' })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  test('allows an admin to update any job', async () => {
    const job = { _id: 'job1', recruiterId: { toString: () => 'owner-recruiter' }, save: jest.fn().mockResolvedValue(true) };
    Job.findById.mockResolvedValue(job);
    const result = await jobService.updateJob('job1', 'admin1', { status: 'closed' }, true);
    expect(result.status).toBe('closed');
  });

  test('throws 404 for a non-existent job', async () => {
    Job.findById.mockResolvedValue(null);
    await expect(jobService.updateJob('missing', 'recruiter1', {})).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('jobService.deleteJob — ownership & cascade', () => {
  test('blocks a recruiter who does not own the job from deleting it', async () => {
    const job = { _id: 'job1', recruiterId: { toString: () => 'owner-recruiter' } };
    Job.findById.mockResolvedValue(job);
    await expect(jobService.deleteJob('job1', 'someone-else')).rejects.toMatchObject({ statusCode: 403 });
    expect(Resume.deleteMany).not.toHaveBeenCalled();
  });

  test('cascades deletion of bulk-screened resumes and analyses when a job is deleted', async () => {
    const job = {
      _id: 'job1',
      recruiterId: { toString: () => 'recruiter1' },
      deleteOne: jest.fn().mockResolvedValue(true),
    };
    Job.findById.mockResolvedValue(job);
    Resume.deleteMany.mockResolvedValue({});
    ResumeAnalysis.deleteMany.mockResolvedValue({});

    const result = await jobService.deleteJob('job1', 'recruiter1');

    expect(Resume.deleteMany).toHaveBeenCalledWith({ jobId: 'job1', owner: 'bulk' });
    expect(ResumeAnalysis.deleteMany).toHaveBeenCalledWith({ jobId: 'job1' });
    expect(job.deleteOne).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });
});

describe('jobService.getRecruiterJobs', () => {
  test('scopes the query to only the given recruiter', async () => {
    const chain = { sort: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([{ _id: 'job1' }]) };
    Job.find.mockReturnValue(chain);
    await jobService.getRecruiterJobs('recruiter1');
    expect(Job.find).toHaveBeenCalledWith({ recruiterId: 'recruiter1' });
  });
});
