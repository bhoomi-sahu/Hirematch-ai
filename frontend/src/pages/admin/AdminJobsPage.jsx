import React, { useEffect, useState } from 'react';
import { getAllJobs } from '../../services/adminService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { Layers } from 'lucide-react';

const STATUS_BADGE = { active: 'green', draft: 'slate', closed: 'rose' };

const AdminJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllJobs();
        setJobs(res.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold text-slate-900">Jobs</h1>
        <p className="text-sm text-slate-500 mt-1">All job postings across the platform.</p>
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : jobs.length === 0 ? (
        <EmptyState icon={Layers} title="No jobs posted yet" description="Jobs will appear here as recruiters create them." />
      ) : (
        <Card className="overflow-hidden animate-fadeInUp">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase">
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Recruiter</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Applicants</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Posted</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, idx) => (
                  <tr key={job._id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors animate-fadeIn stagger-${(idx % 6) + 1}`}>
                    <td className="px-5 py-4 font-semibold text-slate-900">{job.title}</td>
                    <td className="px-5 py-4 text-slate-500">{job.recruiterId?.name || '—'}</td>
                    <td className="px-5 py-4 text-slate-500">{job.location}</td>
                    <td className="px-5 py-4 text-slate-500">{job.applicantCount || 0}</td>
                    <td className="px-5 py-4"><Badge variant={STATUS_BADGE[job.status]}>{job.status}</Badge></td>
                    <td className="px-5 py-4 text-slate-500">{new Date(job.createdAt).toLocaleDateString()}</td>
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

export default AdminJobsPage;
