import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getJobs } from '../../services/jobService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { Search, MapPin, Briefcase, Clock, X, SlidersHorizontal } from 'lucide-react';

const TYPES = ['all', 'Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'];
const LEVELS = ['all', 'Entry Level', 'Mid Level', 'Senior Level', 'Lead / Staff', 'Executive'];

const JobsListPage = () => {
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', location: '', type: 'all', experienceLevel: 'all', skill: '', page: 1 });
  const [showFilters, setShowFilters] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, limit: 9 };
      Object.keys(params).forEach((k) => (params[k] === 'all' || params[k] === '') && delete params[k]);
      const res = await getJobs(params);
      setJobs(res.data || []);
      setMeta(res.meta || { page: 1, totalPages: 1 });
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(fetchJobs, 300);
    return () => clearTimeout(t);
  }, [fetchJobs]);

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  return (
    <div className="space-y-6">
      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold text-slate-900">Find Your Next Role</h1>
        <p className="text-sm text-slate-500 mt-1">Search and filter active job postings.</p>
      </div>

      <Card className="p-4 animate-fadeInUp">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search by title, company, or skill..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-shadow"
            />
          </div>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={filters.location}
              onChange={(e) => updateFilter('location', e.target.value)}
              placeholder="Location"
              className="w-full sm:w-40 pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-shadow"
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 animate-fadeIn">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Employment Type</label>
              <select
                value={filters.type}
                onChange={(e) => updateFilter('type', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {TYPES.map((t) => <option key={t} value={t}>{t === 'all' ? 'Any Type' : t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Experience Level</label>
              <select
                value={filters.experienceLevel}
                onChange={(e) => updateFilter('experienceLevel', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {LEVELS.map((l) => <option key={l} value={l}>{l === 'all' ? 'Any Level' : l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Skill</label>
              <input
                value={filters.skill}
                onChange={(e) => updateFilter('skill', e.target.value)}
                placeholder="e.g. React"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>
        )}
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No matching jobs found"
          description="Try adjusting your filters or search terms."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job, idx) => (
              <Link key={job._id} to={`/candidate/jobs/${job._id}`}>
                <Card hover className={`p-5 h-full flex flex-col animate-fadeInUp stagger-${(idx % 6) + 1}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug pr-2">{job.title}</h3>
                    {typeof job.matchScore === 'number' && (
                      <Badge variant={job.matchScore >= 80 ? 'green' : job.matchScore >= 60 ? 'amber' : 'rose'} className="flex-shrink-0">
                        {job.matchScore}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{job.company}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(job.skillsRequired || []).slice(0, 3).map((s) => (
                      <Badge key={s} variant="slate">{s}</Badge>
                    ))}
                    {job.skillsRequired?.length > 3 && <Badge variant="slate">+{job.skillsRequired.length - 3}</Badge>}
                  </div>
                  <div className="mt-auto flex items-center gap-3 text-xs text-slate-500 pt-3 border-t border-slate-100">
                    <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{job.type}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          <Pagination page={meta.page} totalPages={meta.totalPages} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
        </>
      )}
    </div>
  );
};

export default JobsListPage;
