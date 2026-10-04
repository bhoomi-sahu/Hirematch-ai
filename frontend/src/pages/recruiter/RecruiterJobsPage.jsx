import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getRecruiterJobs, updateJob, deleteJob } from '../../services/jobService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import { Layers, Plus, Users, Edit2, Trash2, Lock, Unlock, ScanSearch } from 'lucide-react';

const STATUS_BADGE = { active: 'green', draft: 'slate', closed: 'rose' };

const RecruiterJobsPage = () => {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await getRecruiterJobs();
      setJobs(res.data || []);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const toggleStatus = async (job) => {
    setUpdatingId(job._id);
    try {
      const newStatus = job.status === 'active' ? 'closed' : 'active';
      await updateJob(job._id, { status: newStatus });
      toast.success(`Job ${newStatus === 'active' ? 'reopened' : 'closed'}`);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update job');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteJob(deleteTarget._id);
      toast.success('Job deleted');
      setDeleteTarget(null);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete job');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Jobs</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your job postings and their status.</p>
        </div>
        <Link to="/recruiter/jobs/new">
          <Button icon={Plus} variant="indigo">Post a Job</Button>
        </Link>
      </div>

      {loading ? (
        <SkeletonTable rows={4} cols={4} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No jobs posted yet"
          description="Create your first job requisition to start receiving applications."
          action={<Link to="/recruiter/jobs/new"><Button variant="indigo">Post a Job</Button></Link>}
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job, idx) => (
            <Card key={job._id} className={`p-5 animate-fadeInUp stagger-${(idx % 6) + 1}`} hover>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-slate-900 text-sm">{job.title}</p>
                    <Badge variant={STATUS_BADGE[job.status]}>{job.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{job.location} · {job.type} · {job.applicantCount || 0} applicants</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/recruiter/jobs/${job._id}/applicants`}>
                    <Button size="sm" variant="outline" icon={Users}>Applicants</Button>
                  </Link>
                  <Link to={`/recruiter/bulk-screening/${job._id}`}>
                    <Button size="sm" variant="outline" icon={ScanSearch}>Bulk Screen</Button>
                  </Link>
                  <Link to={`/recruiter/jobs/${job._id}/edit`}>
                    <Button size="sm" variant="outline" icon={Edit2}>Edit</Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={job.status === 'active' ? Lock : Unlock}
                    loading={updatingId === job._id}
                    onClick={() => toggleStatus(job)}
                  >
                    {job.status === 'active' ? 'Close' : 'Reopen'}
                  </Button>
                  <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeleteTarget(job)} className="!text-rose-600 hover:!bg-rose-50" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        danger
        title="Delete job posting?"
        message={`This will permanently remove "${deleteTarget?.title}" and its screening data.`}
        confirmLabel="Delete"
      />
    </div>
  );
};

export default RecruiterJobsPage;
