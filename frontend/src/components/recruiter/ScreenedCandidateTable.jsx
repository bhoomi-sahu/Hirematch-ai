import React, { useEffect, useState, useCallback } from 'react';
import { getScreenedCandidates, updateCandidateStatus } from '../../services/bulkScreenService';
import { getResumeFileUrl } from '../../services/resumeService';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import Pagination from '../ui/Pagination';
import { SkeletonTable } from '../ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import { MATCH_CATEGORY_BADGE, SCREENING_STATUS_BADGE } from '../../utils/statusMaps';
import { Users, Search, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';

const ScreenedCandidateTable = ({ jobId, refreshKey = 0 }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ status: 'all', minScore: '', search: '', skill: '', page: 1 });
  const [updatingId, setUpdatingId] = useState(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, limit: 10 };
      Object.keys(params).forEach((k) => (params[k] === '' || params[k] === 'all') && delete params[k]);
      const res = await getScreenedCandidates(jobId, params);
      setCandidates(res.data.candidates || []);
      setMeta({ page: res.data.page, totalPages: res.data.totalPages });
    } catch (err) {
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, filters]);

  useEffect(() => {
    const t = setTimeout(fetchCandidates, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCandidates, refreshKey]);

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: 1 }));

  const setStatus = async (resumeId, status) => {
    setUpdatingId(resumeId);
    try {
      await updateCandidateStatus(jobId, resumeId, status);
      setCandidates((prev) => prev.map((c) => (c.resumeId === resumeId ? { ...c, screeningStatus: status } : c)));
      toast.success(`Candidate ${status === 'shortlisted' ? 'shortlisted' : status === 'rejected' ? 'rejected' : 'reset'}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update candidate');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search candidate name..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <input
            value={filters.skill}
            onChange={(e) => updateFilter('skill', e.target.value)}
            placeholder="Filter by skill"
            className="w-full sm:w-40 px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <select value={filters.minScore} onChange={(e) => updateFilter('minScore', e.target.value)} className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/30">
            <option value="">All Scores</option>
            <option value="80">Strong (80+)</option>
            <option value="60">Moderate (60+)</option>
            <option value="0">Low (0+)</option>
          </select>
          <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/30">
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </Card>

      {loading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : candidates.length === 0 ? (
        <EmptyState icon={Users} title="No screened candidates yet" description="Upload resumes in bulk to see ranked candidates here." />
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase">
                    <th className="px-5 py-3">Candidate</th>
                    <th className="px-5 py-3">Score</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Skills</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c, idx) => (
                    <tr key={c.resumeId} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors animate-fadeIn stagger-${(idx % 6) + 1}`}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.email || c.fileName}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={(c.analysis?.overallScore ?? 0) >= 80 ? 'green' : (c.analysis?.overallScore ?? 0) >= 60 ? 'amber' : 'rose'}>
                          {c.analysis?.overallScore ?? 0}%
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        {c.analysis?.matchCategory && <Badge variant={MATCH_CATEGORY_BADGE[c.analysis.matchCategory]}>{c.analysis.matchCategory}</Badge>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(c.skills || []).slice(0, 3).map((s) => <Badge key={s} variant="slate">{s}</Badge>)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={SCREENING_STATUS_BADGE[c.screeningStatus]}>{c.screeningStatus}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <a href={getResumeFileUrl(c.resumeId)} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="View resume">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            disabled={updatingId === c.resumeId}
                            onClick={() => setStatus(c.resumeId, 'shortlisted')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Shortlist"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            disabled={updatingId === c.resumeId}
                            onClick={() => setStatus(c.resumeId, 'rejected')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Pagination page={meta.page} totalPages={meta.totalPages} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
        </>
      )}
    </div>
  );
};

export default ScreenedCandidateTable;
