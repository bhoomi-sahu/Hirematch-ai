import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getRecruiterApplications, updateApplicationStatus } from '../../services/applicationService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import { APP_STATUS_LABELS, APP_STATUS_BADGE } from '../../utils/statusMaps';
import { ClipboardList, Search } from 'lucide-react';

const STATUS_OPTIONS = ['all', 'applied', 'screening', 'interview', 'offered', 'rejected'];

const RecruiterApplicationsPage = () => {
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getRecruiterApplications();
        setApplications(res.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const changeStatus = async (appId, status) => {
    setUpdatingId(appId);
    try {
      await updateApplicationStatus(appId, status);
      setApplications((prev) => prev.map((a) => (a._id === appId ? { ...a, status } : a)));
      toast.success(`Status updated to ${APP_STATUS_LABELS[status]}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (search.trim()) {
        const term = search.toLowerCase();
        return a.candidateId?.name?.toLowerCase().includes(term) || a.jobId?.title?.toLowerCase().includes(term);
      }
      return true;
    });
  }, [applications, statusFilter, search]);

  return (
    <div className="space-y-6">
      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
        <p className="text-sm text-slate-500 mt-1">All applications received across your job postings.</p>
      </div>

      <Card className="p-4 animate-fadeInUp">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by candidate or job title..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/30">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : APP_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
      </Card>

      {loading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No applications found" description="Try adjusting your filters." />
      ) : (
        <Card className="overflow-hidden animate-fadeInUp">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase">
                  <th className="px-5 py-3">Candidate</th>
                  <th className="px-5 py-3">Job</th>
                  <th className="px-5 py-3">Match</th>
                  <th className="px-5 py-3">Applied</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app, idx) => (
                  <tr key={app._id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors animate-fadeIn stagger-${(idx % 6) + 1}`}>
                    <td className="px-5 py-4 font-semibold text-slate-900">{app.candidateId?.name}</td>
                    <td className="px-5 py-4">
                      <Link to={`/recruiter/jobs/${app.jobId?._id}/applicants`} className="text-indigo-600 hover:underline">{app.jobId?.title}</Link>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={app.matchAnalysis?.score >= 80 ? 'green' : app.matchAnalysis?.score >= 60 ? 'amber' : 'rose'}>
                        {app.matchAnalysis?.score ?? 0}%
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <select
                        value={app.status}
                        onChange={(e) => changeStatus(app._id, e.target.value)}
                        disabled={updatingId === app._id}
                        className="text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-500/30"
                      >
                        {STATUS_OPTIONS.filter((s) => s !== 'all').map((s) => <option key={s} value={s}>{APP_STATUS_LABELS[s]}</option>)}
                      </select>
                    </td>
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

export default RecruiterApplicationsPage;
