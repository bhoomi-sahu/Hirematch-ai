import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRecruiterJobs } from '../../services/jobService';
import ScreenedCandidateTable from '../../components/recruiter/ScreenedCandidateTable';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { Users, Layers } from 'lucide-react';

const RecruiterCandidatesPage = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getRecruiterJobs();
        setJobs(res.data || []);
        if (res.data?.length > 0) setSelectedJob(res.data[0]._id);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Users className="w-6 h-6 text-indigo-600" /> Candidates</h1>
          <p className="text-sm text-slate-500 mt-1">Ranked candidates screened against a specific role.</p>
        </div>
        {jobs.length > 0 && (
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/30 min-w-[220px]"
          >
            {jobs.map((j) => <option key={j._id} value={j._id}>{j.title}</option>)}
          </select>
        )}
      </div>

      {loading ? null : jobs.length === 0 ? (
        <EmptyState icon={Layers} title="No jobs to screen candidates for" description="Create a job posting first." action={<Link to="/recruiter/jobs/new"><Button variant="indigo">Post a Job</Button></Link>} />
      ) : selectedJob ? (
        <ScreenedCandidateTable jobId={selectedJob} />
      ) : null}
    </div>
  );
};

export default RecruiterCandidatesPage;
