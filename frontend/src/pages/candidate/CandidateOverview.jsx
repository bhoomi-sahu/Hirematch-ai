import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getJobs } from '../../services/jobService';
import { getCandidateApplications } from '../../services/applicationService';
import { getMyResumes } from '../../services/resumeService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { APP_STATUS_LABELS, APP_STATUS_BADGE } from '../../utils/statusMaps';
import { Briefcase, FileText, TrendingUp, CheckCircle2, ArrowRight, UploadCloud, Search } from 'lucide-react';

const COLOR_MAP = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  purple: 'bg-purple-50 text-purple-600',
  rose: 'bg-rose-50 text-rose-600',
};

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <Card className={`p-5 animate-fadeInUp stagger-${delay}`} hover>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 mt-1">{value}</p>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${COLOR_MAP[color] || COLOR_MAP.blue}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </Card>
);

const CandidateOverview = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [resumes, setResumes] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [jobsRes, appsRes, resumesRes] = await Promise.all([
          getJobs({ limit: 4 }),
          getCandidateApplications(),
          getMyResumes(),
        ]);
        setJobs(jobsRes.data || []);
        setApplications(appsRes.data || []);
        setResumes(resumesRes.data || []);
      } catch (err) {
        console.error('Failed to load overview', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const shortlisted = applications.filter((a) => ['screening', 'interview', 'offered'].includes(a.status)).length;
  const avgScore = applications.length
    ? Math.round(applications.reduce((sum, a) => sum + (a.matchAnalysis?.score || 0), 0) / applications.length)
    : 0;
  const activeResume = resumes.find((r) => r.isActive);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-sm animate-fadeIn">
        <p className="text-blue-100 text-sm font-medium mb-1">Welcome back</p>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{user?.name}</h1>
        <p className="text-blue-100 text-sm max-w-xl">
          Track applications, upload resumes, and see exactly how well you match each role.
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <Link to="/candidate/jobs">
            <Button variant="secondary" icon={Search} className="!bg-white !text-blue-700 hover:!bg-blue-50">
              Browse Jobs
            </Button>
          </Link>
          <Link to="/candidate/resumes">
            <Button variant="outline" icon={UploadCloud} className="!bg-blue-500/20 !border-blue-300 !text-white hover:!bg-blue-500/30">
              Upload Resume
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Briefcase} label="Applications" value={applications.length} color="blue" delay={1} />
          <StatCard icon={CheckCircle2} label="Shortlisted" value={shortlisted} color="emerald" delay={2} />
          <StatCard icon={TrendingUp} label="Avg. Match Score" value={applications.length ? `${avgScore}%` : '—'} color="amber" delay={3} />
          <StatCard
            icon={FileText}
            label="Resume Status"
            value={activeResume ? (activeResume.processingStatus === 'completed' ? 'Ready' : 'Processing') : 'None'}
            color="indigo"
            delay={4}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 animate-fadeInUp">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recommended Jobs</h2>
            <Link to="/candidate/jobs" className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
          ) : jobs.length === 0 ? (
            <EmptyState icon={Briefcase} title="No open roles yet" description="Check back soon or browse the full job board." />
          ) : (
            <div className="space-y-3">
              {jobs.map((job, idx) => (
                <Link
                  key={job._id}
                  to={`/candidate/jobs/${job._id}`}
                  className={`flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors animate-fadeInUp stagger-${idx + 1}`}
                >
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{job.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {job.company} · {job.location} · {job.type}
                    </p>
                  </div>
                  {typeof job.matchScore === 'number' && (
                    <Badge variant={job.matchScore >= 80 ? 'green' : job.matchScore >= 60 ? 'amber' : 'rose'}>
                      {job.matchScore}% match
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 animate-fadeInUp stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Applications</h2>
            <Link to="/candidate/applications" className="text-xs font-semibold text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1, 2].map((i) => <SkeletonCard key={i} />)}</div>
          ) : applications.length === 0 ? (
            <EmptyState icon={FileText} title="No applications yet" description="Apply to a job to see status here." />
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 5).map((app) => (
                <div key={app._id} className="p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{app.jobId?.title || 'Job'}</p>
                    <Badge variant={APP_STATUS_BADGE[app.status]}>{APP_STATUS_LABELS[app.status]}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{app.jobId?.company}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CandidateOverview;
