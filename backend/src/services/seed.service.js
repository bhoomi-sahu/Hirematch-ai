const { User, Profile, Job, Application } = require('../models');
const aiService = require('./ai.service');

class SeedService {
  async seedDemoData() {
    // 1. Create or Find Seed Users
    const usersData = [
      {
        name: 'Sarah Chen (Recruiter)',
        email: 'recruiter@jobmatch.ai',
        password: 'password123',
        role: 'recruiter',
      },
      {
        name: 'David Miller (Recruiter)',
        email: 'david.recruiter@jobmatch.ai',
        password: 'password123',
        role: 'recruiter',
      },
      {
        name: 'Alex Rivera (Candidate)',
        email: 'candidate@jobmatch.ai',
        password: 'password123',
        role: 'candidate',
      },
      {
        name: 'Emma Watson (Candidate)',
        email: 'emma.candidate@jobmatch.ai',
        password: 'password123',
        role: 'candidate',
      },
      {
        name: 'System Admin',
        email: 'admin@jobmatch.ai',
        password: 'password123',
        role: 'admin',
      },
    ];

    const createdUsers = {};

    for (const u of usersData) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = await User.create(u);
      }
      createdUsers[u.email] = user;
    }

    const recruiter1 = createdUsers['recruiter@jobmatch.ai'];
    const recruiter2 = createdUsers['david.recruiter@jobmatch.ai'];
    const candidate1 = createdUsers['candidate@jobmatch.ai'];
    const candidate2 = createdUsers['emma.candidate@jobmatch.ai'];

    // 2. Candidate Profiles
    await Profile.findOneAndUpdate(
      { userId: candidate1._id },
      {
        userId: candidate1._id,
        headline: 'Full-Stack Software Engineer | React, Node.js & Cloud',
        bio: 'Passionate full-stack developer with 4 years building reactive, high-scale web platforms. Experienced in modern JavaScript/TypeScript architectures.',
        location: 'San Francisco, CA (Remote)',
        experienceYears: 4,
        skills: ['React', 'Node.js', 'JavaScript', 'TypeScript', 'Tailwind CSS', 'MongoDB', 'Docker', 'Git'],
        experience: [
          {
            title: 'Full-Stack Developer',
            company: 'TechFlow Systems',
            location: 'Remote',
            startDate: '2022',
            endDate: 'Present',
            current: true,
            description: 'Engineered high-throughput REST APIs and responsive React applications with MongoDB.',
          },
          {
            title: 'Frontend Engineer',
            company: 'Nexus Media',
            location: 'Austin, TX',
            startDate: '2020',
            endDate: '2022',
            current: false,
            description: 'Created UI component design system using Tailwind CSS and React.',
          },
        ],
        education: [
          {
            institution: 'University of California, Berkeley',
            degree: 'B.S. in Computer Science',
            fieldOfStudy: 'Software Engineering',
            startYear: '2016',
            endYear: '2020',
          },
        ],
        resumeText: 'Alex Rivera is a 4-year experienced Full-Stack Engineer skilled in React, Node.js, JavaScript, TypeScript, Tailwind CSS, MongoDB, RESTful APIs, and Docker containerization.',
      },
      { upsert: true, new: true }
    );

    await Profile.findOneAndUpdate(
      { userId: candidate2._id },
      {
        userId: candidate2._id,
        headline: 'AI & Data Infrastructure Engineer',
        bio: 'Machine learning practitioner specializing in Python, data pipelines, and cloud systems.',
        location: 'New York, NY',
        experienceYears: 3,
        skills: ['Python', 'FastAPI', 'Docker', 'Kubernetes', 'AWS', 'SQL', 'PostgreSQL'],
        experienceYears: 3,
      },
      { upsert: true, new: true }
    );

    // 3. Seed Jobs
    const jobsData = [
      {
        title: 'Senior Full-Stack Engineer',
        company: 'Veloce AI',
        recruiterId: recruiter1._id,
        location: 'Remote',
        type: 'Full-time',
        experienceLevel: 'Senior Level',
        salaryRange: { min: 130000, max: 175000, currency: 'USD' },
        description: 'Lead development of next-generation AI workflows using React, TypeScript, Node.js, and MongoDB microservices. Build clean, responsive interfaces with Tailwind CSS.',
        requirements: [
          '4+ years building full-stack applications with React & Node.js',
          'Proficiency with MongoDB and document schemas',
          'Strong TypeScript and containerization experience (Docker)',
        ],
        skillsRequired: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Docker', 'Tailwind CSS'],
        status: 'active',
      },
      {
        title: 'Frontend React & UI Engineer',
        company: 'Nova Cloud',
        recruiterId: recruiter1._id,
        location: 'San Francisco, CA / Hybrid',
        type: 'Full-time',
        experienceLevel: 'Mid Level',
        salaryRange: { min: 110000, max: 145000, currency: 'USD' },
        description: 'Design accessible, high-performance UI systems in React and Tailwind CSS. Collaborate directly with design and product teams.',
        requirements: [
          '2+ years professional frontend engineering',
          'Mastery of modern React hooks and Tailwind CSS',
          'Experience building responsive web applications',
        ],
        skillsRequired: ['React', 'JavaScript', 'Tailwind CSS', 'Git'],
        status: 'active',
      },
      {
        title: 'AI Platform & Cloud Backend Engineer',
        company: 'Cognitive Dynamics',
        recruiterId: recruiter2._id,
        location: 'Remote (US/Canada)',
        type: 'Full-time',
        experienceLevel: 'Senior Level',
        salaryRange: { min: 140000, max: 190000, currency: 'USD' },
        description: 'Scale LLM inference pipelines and API middleware deployed across Kubernetes and AWS.',
        requirements: [
          'Strong Python and distributed systems knowledge',
          'Hands-on AWS and Docker/Kubernetes container orchestration',
        ],
        skillsRequired: ['Python', 'Docker', 'Kubernetes', 'AWS', 'SQL'],
        status: 'active',
      },
      {
        title: 'DevOps & Site Reliability Engineer',
        company: 'Veloce AI',
        recruiterId: recruiter1._id,
        location: 'Remote',
        type: 'Contract',
        experienceLevel: 'Senior Level',
        salaryRange: { min: 120000, max: 160000, currency: 'USD' },
        description: 'Automate CI/CD pipelines, container cluster deployments, and infrastructure as code.',
        requirements: [
          'Deep expertise in Kubernetes, Docker, and AWS',
          'Proficiency with GitHub Actions CI/CD',
        ],
        skillsRequired: ['Docker', 'Kubernetes', 'AWS', 'DevOps'],
        status: 'active',
      },
      {
        title: 'Junior Web Developer',
        company: 'Elevate Digital',
        recruiterId: recruiter2._id,
        location: 'Austin, TX (Hybrid)',
        type: 'Full-time',
        experienceLevel: 'Entry Level',
        salaryRange: { min: 65000, max: 85000, currency: 'USD' },
        description: 'Great entry point for enthusiastic engineers excited about modern web development with JavaScript and React.',
        requirements: [
          'Solid understanding of HTML, CSS, and modern JavaScript',
          'Familiarity with Git and React basics',
        ],
        skillsRequired: ['JavaScript', 'React', 'Git'],
        status: 'active',
      },
    ];

    const createdJobs = [];
    for (const j of jobsData) {
      const existing = await Job.findOne({ title: j.title, company: j.company });
      if (!existing) {
        const job = await Job.create(j);
        createdJobs.push(job);
      } else {
        createdJobs.push(existing);
      }
    }

    // 4. Seed Applications with Real AI Scoring
    const alexProfile = await Profile.findOne({ userId: candidate1._id });

    if (alexProfile && createdJobs.length >= 2) {
      const job1 = createdJobs[0]; // Senior Full-Stack Engineer
      const existingApp1 = await Application.findOne({ jobId: job1._id, candidateId: candidate1._id });

      if (!existingApp1) {
        const match1 = aiService.calculateSemanticMatch(
          { ...alexProfile.toObject(), name: candidate1.name },
          job1
        );

        await Application.create({
          jobId: job1._id,
          candidateId: candidate1._id,
          recruiterId: job1.recruiterId,
          status: 'interview',
          coverLetter: 'I have 4 years of hands-on experience building full-stack MERN architectures and would love to contribute to Veloce AI.',
          resumeSnapshot: {
            headline: alexProfile.headline,
            experienceYears: alexProfile.experienceYears,
            skills: alexProfile.skills,
            resumeText: alexProfile.resumeText,
          },
          matchAnalysis: match1,
          notes: [
            {
              author: 'Sarah Chen (Recruiter)',
              text: 'Exceptional match score (90%+). Scheduled technical screen for next Tuesday.',
              createdAt: new Date(),
            },
          ],
        });
        await Job.findByIdAndUpdate(job1._id, { $inc: { applicantCount: 1 } });
      }

      const job2 = createdJobs[1]; // Frontend React
      const existingApp2 = await Application.findOne({ jobId: job2._id, candidateId: candidate1._id });

      if (!existingApp2) {
        const match2 = aiService.calculateSemanticMatch(
          { ...alexProfile.toObject(), name: candidate1.name },
          job2
        );

        await Application.create({
          jobId: job2._id,
          candidateId: candidate1._id,
          recruiterId: job2.recruiterId,
          status: 'screening',
          coverLetter: 'Experienced in Tailwind CSS and modern React components. Excited about your design system.',
          resumeSnapshot: {
            headline: alexProfile.headline,
            experienceYears: alexProfile.experienceYears,
            skills: alexProfile.skills,
            resumeText: alexProfile.resumeText,
          },
          matchAnalysis: match2,
        });
        await Job.findByIdAndUpdate(job2._id, { $inc: { applicantCount: 1 } });
      }
    }

    return {
      message: 'Demo dataset successfully seeded with 5 users, 5 active jobs, and pre-scored AI applications!',
      users: [
        { role: 'Candidate', email: 'candidate@jobmatch.ai', password: 'password123' },
        { role: 'Recruiter', email: 'recruiter@jobmatch.ai', password: 'password123' },
        { role: 'Admin', email: 'admin@jobmatch.ai', password: 'password123' },
      ],
      jobCount: createdJobs.length,
    };
  }
}

module.exports = new SeedService();
