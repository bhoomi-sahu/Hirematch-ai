jest.mock('../../src/models', () => ({
  Application: { findOne: jest.fn(), create: jest.fn(), find: jest.fn(), findById: jest.fn() },
  Job: { findById: jest.fn(), findByIdAndUpdate: jest.fn() },
  Profile: { findOne: jest.fn(), create: jest.fn() },
  User: { findById: jest.fn() },
  Resume: { findById: jest.fn() },
}));

const { Application, Job, Resume } = require('../../src/models');
const applicationService = require('../../src/services/application.service');

const activeJob = {
  _id: 'job1',
  status: 'active',
  recruiterId: 'recruiter1',
  skillsRequired: ['React', 'Node.js'],
  preferredSkills: [],
  experienceLevel: 'Mid Level',
};

const completedResume = {
  _id: 'resume1',
  candidateId: 'candidate1',
  processingStatus: 'completed',
  extractedText: 'Built things with React and Node.js for 3 years.',
  parsed: {
    name: 'Jane Doe',
    skills: ['React', 'Node.js'],
    experience: [{ duration: '2021-2024' }],
    projects: [],
    education: [],
    certifications: [],
  },
};

describe('applicationService.applyToJob — resume-based matching path', () => {
  beforeEach(() => {
    Job.findById.mockResolvedValue({ ...activeJob });
    Application.findOne.mockResolvedValue(null);
    Resume.findById.mockResolvedValue({ ...completedResume });
    Application.create.mockImplementation(async (data) => ({ _id: 'app1', ...data }));
    Job.findByIdAndUpdate.mockResolvedValue({});
  });

  test('creates an application with a computed match score when a valid resume is given', async () => {
    const result = await applicationService.applyToJob('candidate1', 'job1', 'Cover letter text', 'resume1');
    expect(Application.create).toHaveBeenCalled();
    expect(result.matchAnalysis.score).toEqual(expect.any(Number));
    expect(result.matchAnalysis.skillsMatched).toEqual(expect.arrayContaining(['React', 'Node.js']));
    expect(result.resumeId).toBe('resume1');
  });

  test('increments the job applicant count after a successful application', async () => {
    await applicationService.applyToJob('candidate1', 'job1', '', 'resume1');
    expect(Job.findByIdAndUpdate).toHaveBeenCalledWith('job1', { $inc: { applicantCount: 1 } });
  });

  test('rejects applying to a job that does not exist', async () => {
    Job.findById.mockResolvedValue(null);
    await expect(applicationService.applyToJob('candidate1', 'missing-job', '', 'resume1')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  test('rejects applying to a closed/draft job', async () => {
    Job.findById.mockResolvedValue({ ...activeJob, status: 'closed' });
    await expect(applicationService.applyToJob('candidate1', 'job1', '', 'resume1')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  test('rejects a duplicate application to the same job', async () => {
    Application.findOne.mockResolvedValue({ _id: 'existing-app' });
    await expect(applicationService.applyToJob('candidate1', 'job1', '', 'resume1')).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(Application.create).not.toHaveBeenCalled();
  });

  test('rejects using a resume that belongs to a different candidate', async () => {
    Resume.findById.mockResolvedValue({ ...completedResume, candidateId: 'someone-else' });
    await expect(applicationService.applyToJob('candidate1', 'job1', '', 'resume1')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  test('rejects a resume that is still processing', async () => {
    Resume.findById.mockResolvedValue({ ...completedResume, processingStatus: 'processing' });
    await expect(applicationService.applyToJob('candidate1', 'job1', '', 'resume1')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  test('rejects a reference to a resume that does not exist', async () => {
    Resume.findById.mockResolvedValue(null);
    await expect(applicationService.applyToJob('candidate1', 'job1', '', 'nonexistent')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('applicationService.updateStatus', () => {
  const existingApp = { _id: 'app1', recruiterId: 'recruiter1', status: 'applied', save: jest.fn().mockResolvedValue(true) };

  beforeEach(() => {
    Application.findById.mockResolvedValue({ ...existingApp, save: jest.fn().mockResolvedValue(true) });
  });

  test('allows the owning recruiter to update status', async () => {
    const app = await applicationService.updateStatus('app1', 'recruiter1', 'screening');
    expect(app.status).toBe('screening');
  });

  test('blocks a recruiter who does not own the job/application', async () => {
    await expect(applicationService.updateStatus('app1', 'someone-else', 'screening')).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  test('allows an admin to update status regardless of ownership', async () => {
    const app = await applicationService.updateStatus('app1', 'admin-user', 'interview', true);
    expect(app.status).toBe('interview');
  });

  test('rejects an invalid status value', async () => {
    await expect(applicationService.updateStatus('app1', 'recruiter1', 'made-up-status')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  test('throws 404 for a non-existent application', async () => {
    Application.findById.mockResolvedValue(null);
    await expect(applicationService.updateStatus('missing', 'recruiter1', 'screening')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('applicationService.getJobApplications — recruiter ownership', () => {
  const chainable = (data) => ({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(data),
  });

  test('blocks a recruiter who does not own the job', async () => {
    Job.findById.mockResolvedValue({ ...activeJob, recruiterId: 'someone-else' });
    await expect(applicationService.getJobApplications('job1', 'recruiter1')).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  test('allows the owning recruiter to view applications', async () => {
    Job.findById.mockResolvedValue({ ...activeJob });
    Application.find.mockReturnValue(chainable([{ _id: 'app1' }]));
    const result = await applicationService.getJobApplications('job1', 'recruiter1');
    expect(result).toEqual([{ _id: 'app1' }]);
  });

  test('allows an admin to view applications for any job', async () => {
    Job.findById.mockResolvedValue({ ...activeJob, recruiterId: 'someone-else' });
    Application.find.mockReturnValue(chainable([]));
    await expect(applicationService.getJobApplications('job1', 'admin-user', true)).resolves.toEqual([]);
  });
});
