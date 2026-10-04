import React, { useEffect, useState } from 'react';
import { getAdminStats } from '../../services/adminService';
import Card from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { APP_STATUS_LABELS } from '../../utils/statusMaps';
import { PieChart, BarChart3 } from 'lucide-react';

const STATUS_COLORS = { applied: 'blue', screening: 'indigo', interview: 'amber', offered: 'emerald', rejected: 'rose' };

const AnalyticsPage = () => {
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

  if (loading || !stats) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{[1, 2].map((i) => <SkeletonCard key={i} />)}</div>;
  }

  const statusEntries = Object.entries(stats.applications.byStatus || {});
  const maxStatusCount = Math.max(1, ...statusEntries.map(([, v]) => v));

  const aiTotal = Math.max(1, stats.ai.totalResumesProcessed);

  return (
    <div className="space-y-6">
      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><PieChart className="w-6 h-6 text-purple-600" /> Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Platform trends drawn from real database data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 animate-fadeInUp">
          <h2 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-600" /> Applications by Status</h2>
          <div className="space-y-4">
            {statusEntries.map(([status, count]) => (
              <ProgressBar
                key={status}
                label={APP_STATUS_LABELS[status] || status}
                value={count}
                max={maxStatusCount}
                color={STATUS_COLORS[status] || 'blue'}
                suffix={` (${count})`}
              />
            ))}
          </div>
        </Card>

        <Card className="p-6 animate-fadeInUp stagger-1">
          <h2 className="text-base font-bold text-slate-900 mb-5">AI Resume Processing</h2>
          <div className="space-y-4">
            <ProgressBar label="Successfully Analyzed" value={stats.ai.successfulAnalyses} max={aiTotal} color="emerald" suffix={` / ${aiTotal}`} />
            <ProgressBar label="Failed" value={stats.ai.failedAnalyses} max={aiTotal} color="rose" suffix={` / ${aiTotal}`} />
            <ProgressBar label="Currently Processing" value={stats.ai.currentlyProcessing} max={aiTotal} color="amber" suffix={` / ${aiTotal}`} />
          </div>
        </Card>

        <Card className="p-6 animate-fadeInUp stagger-2 lg:col-span-2">
          <h2 className="text-base font-bold text-slate-900 mb-5">Platform Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Total Users', value: stats.users.total },
              { label: 'Total Jobs', value: stats.jobs.total },
              { label: 'Total Applications', value: stats.applications.total },
              { label: 'Match Analyses Run', value: stats.ai.totalMatchAnalyses },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-xl bg-slate-50">
                <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
