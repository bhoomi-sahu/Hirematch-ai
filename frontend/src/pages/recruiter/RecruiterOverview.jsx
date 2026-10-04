import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRecruiterJobs } from '../../services/jobService';
import { getRecruiterApplications } from '../../services/applicationService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { APP_STATUS_LABELS, APP_STATUS_BADGE } from '../../utils/statusMaps';
import { Layers, Users, TrendingUp, Plus, ArrowRight, Briefcase, ScanSearch } from 'lucide-react';

const COLOR_MAP = {
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  purple: 'bg-purple-50 text-purple-600',
};

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <Card className={`p-5 animate-fadeInUp stagger-${delay}`} hover>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 mt-1">{value}</p>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${COLOR_MAP[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </Card>
);

const RecruiterOverview = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [jobsRes, appsRes] = await Promise.all([getRecruiterJobs(), getRecruiterApplications()]);
        setJobs(jobsRes.data || []);
        setApplications(appsRes.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeJobs = jobs.filter((j) => j.status === 'active').length;
  const strongMatches = applications.filter((a) => (a.matchAnalysis?.score || 0) >= 80).length;
  const uniqueCandidates = new Set(applications.map((a) => a.candidateId?._id)).size;

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-8 text-white shadow-sm animate-fadeIn">
        <p className="text-indigo-100 text-sm font-medium mb-1">Welcome back</p>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{user?.name}</h1>
        <p className="text-indigo-100 text-sm max-w-xl">Post roles, screen candidates at scale, and find your strongest matches faster.</p>
        <div className="flex flex-wrap gap-3 mt-6">
          <Link to="/recruiter/jobs/new">
            <Button variant="secondary" icon={Plus} className="!bg-white !text-indigo-700 hover:!bg-indigo-50">Post a Job</Button>
          </Link>
          <Link to="/recruiter/bulk-screening">
            <Button variant="outline" icon={ScanSearch} className="!bg-indigo-500/20 !border-indigo-300 !text-white hover:!bg-indigo-500/30">Bulk Screen Resumes</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Layers} label="Active Jobs" value={activeJobs} color="indigo" delay={1} />
          <StatCard icon={Users} label="Total Applications" value={applications.length} color="emerald" delay={2} />
          <StatCard icon={Briefcase} label="Total Candidates" value={uniqueCandidates} color="purple" delay={3} />
          <StatCard icon={TrendingUp} label="Strong Matches" value={strongMatches} color="amber" delay={4} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 animate-fadeInUp">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Your Jobs</h2>
            <Link to="/recruiter/jobs" className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1">
              Manage all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
          ) : jobs.length === 0 ? (
            <EmptyState icon={Layers} title="No jobs posted yet" description="Create your first job requisition to start receiving applications." action={<Link to="/recruiter/jobs/new"><Button size="sm">Post a Job</Button></Link>} />
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job, idx) => (
                <Link key={job._id} to={`/recruiter/jobs/${job._id}/applicants`} className={`flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors animate-fadeInUp stagger-${idx + 1}`}>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{job.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{job.applicantCount || 0} applicants</p>
                  </div>
                  <Badge variant={job.status === 'active' ? 'green' : job.status === 'draft' ? 'slate' : 'rose'}>{job.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 animate-fadeInUp stagger-2">
          <h2 className="text-base font-bold text-slate-900 mb-4">Recent Applications</h2>
          {loading ? (
            <div className="space-y-3">{[1, 2].map((i) => <SkeletonCard key={i} />)}</div>
          ) : applications.length === 0 ? (
            <EmptyState icon={Users} title="No applications yet" description="Applications will appear here as candidates apply." />
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 5).map((app) => (
                <div key={app._id} className="p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{app.candidateId?.name}</p>
                    <Badge variant={APP_STATUS_BADGE[app.status]}>{APP_STATUS_LABELS[app.status]}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{app.jobId?.title}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default RecruiterOverview;
