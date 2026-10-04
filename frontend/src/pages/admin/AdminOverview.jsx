import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAdminStats } from '../../services/adminService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { Users, Layers, ClipboardList, TrendingUp, Bot, CheckCircle2, XCircle } from 'lucide-react';

const COLOR_MAP = {
  purple: 'bg-purple-50 text-purple-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
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

const AdminOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAdminStats();
        setStats(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-8 text-white shadow-sm animate-fadeIn">
        <p className="text-purple-100 text-sm font-medium mb-1">Admin Console</p>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome, {user?.name}</h1>
        <p className="text-purple-100 text-sm max-w-xl">Platform-wide visibility into users, jobs, applications, and AI processing health.</p>
      </div>

      {loading || !stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Users" value={stats.users.total} color="purple" delay={1} />
            <StatCard icon={Layers} label="Active Jobs" value={stats.jobs.active} color="indigo" delay={2} />
            <StatCard icon={ClipboardList} label="Applications" value={stats.applications.total} color="emerald" delay={3} />
            <StatCard icon={TrendingUp} label="Avg. Match Score" value={`${stats.applications.avgMatchScore}%`} color="amber" delay={4} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 animate-fadeInUp">
              <h2 className="text-base font-bold text-slate-900 mb-4">User Breakdown</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Candidates</span>
                  <Badge variant="blue">{stats.users.candidates}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Recruiters</span>
                  <Badge variant="indigo">{stats.users.recruiters}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Total Jobs</span>
                  <Badge variant="slate">{stats.jobs.total} ({stats.jobs.closed} closed)</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6 animate-fadeInUp stagger-1">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2"><Bot className="w-4 h-4 text-purple-600" /> AI Processing</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Successful Analyses</span>
                  <Badge variant="green">{stats.ai.successfulAnalyses}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-rose-500" /> Failed Analyses</span>
                  <Badge variant="rose">{stats.ai.failedAnalyses}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Total Match Analyses Run</span>
                  <Badge variant="purple">{stats.ai.totalMatchAnalyses}</Badge>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6 animate-fadeInUp stagger-2">
            <h2 className="text-base font-bold text-slate-900 mb-4">Recent Applications</h2>
            {stats.applications.recent?.length === 0 ? (
              <p className="text-sm text-slate-400">No applications yet.</p>
            ) : (
              <div className="space-y-2">
                {stats.applications.recent.map((app) => (
                  <div key={app._id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 text-sm">
                    <span className="font-medium text-slate-800">{app.candidateId?.name}</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-slate-600">{app.jobId?.title}</span>
                    <Badge variant="slate">{app.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminOverview;
