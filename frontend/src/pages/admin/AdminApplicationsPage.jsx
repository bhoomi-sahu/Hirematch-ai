import React, { useEffect, useState } from 'react';
import { getAllApplicationsAdmin } from '../../services/adminService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { APP_STATUS_LABELS, APP_STATUS_BADGE } from '../../utils/statusMaps';
import { ClipboardList, Search } from 'lucide-react';

const AdminApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const res = await getAllApplicationsAdmin(params);
      setApplications(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchData(search ? { search } : {}), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
        <p className="text-sm text-slate-500 mt-1">All applications submitted platform-wide.</p>
      </div>

      <Card className="p-4 animate-fadeInUp">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candidate or job title..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-purple-500/30"
          />
        </div>
      </Card>

      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : applications.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No applications found" description="Applications will appear here platform-wide." />
      ) : (
        <Card className="overflow-hidden animate-fadeInUp">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase">
                  <th className="px-5 py-3">Candidate</th>
                  <th className="px-5 py-3">Job</th>
                  <th className="px-5 py-3">Recruiter</th>
                  <th className="px-5 py-3">Match</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Applied</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app, idx) => (
                  <tr key={app._id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors animate-fadeIn stagger-${(idx % 6) + 1}`}>
                    <td className="px-5 py-4 font-semibold text-slate-900">{app.candidateId?.name}</td>
                    <td className="px-5 py-4 text-slate-600">{app.jobId?.title}</td>
                    <td className="px-5 py-4 text-slate-500">{app.recruiterId?.name}</td>
                    <td className="px-5 py-4">
                      <Badge variant={app.matchAnalysis?.score >= 80 ? 'green' : app.matchAnalysis?.score >= 60 ? 'amber' : 'rose'}>
                        {app.matchAnalysis?.score ?? 0}%
                      </Badge>
                    </td>
                    <td className="px-5 py-4"><Badge variant={APP_STATUS_BADGE[app.status]}>{APP_STATUS_LABELS[app.status]}</Badge></td>
                    <td className="px-5 py-4 text-slate-500">{new Date(app.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminApplicationsPage;
