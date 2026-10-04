import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRecruiterJobs } from '../../services/jobService';
import { startBulkScreen, getBatchStatus } from '../../services/bulkScreenService';
import ScreenedCandidateTable from '../../components/recruiter/ScreenedCandidateTable';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import FileDropzone from '../../components/ui/FileDropzone';
import { useToast } from '../../context/ToastContext';
import { ScanSearch, Layers, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const BulkScreeningPage = () => {
  const { jobId: paramJobId } = useParams();
  const toast = useToast();

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(paramJobId || '');
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [batch, setBatch] = useState(null); // {batchId, total, completed, processing, queued, failed, done, results}
  const [refreshKey, setRefreshKey] = useState(0);
  const pollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getRecruiterJobs();
        setJobs(res.data || []);
        if (!selectedJob && res.data?.length > 0) setSelectedJob(res.data[0]._id);
      } finally {
        setLoadingJobs(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pollStatus = useCallback((jobIdArg, batchId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await getBatchStatus(jobIdArg, batchId);
        setBatch(res.data);
        if (res.data.done) {
          clearInterval(pollRef.current);
          setRefreshKey((k) => k + 1);
        }
      } catch {
        clearInterval(pollRef.current);
      }
    }, 2000);
  }, []);

  useEffect(() => () => pollRef.current && clearInterval(pollRef.current), []);

  const handleUpload = async (files) => {
    if (!selectedJob) {
      toast.error('Select a job first');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setBatch(null);
    try {
      const res = await startBulkScreen(selectedJob, files, setUploadProgress);
      const { batchId, total } = res.data;
      toast.success(`Screening started for ${total} resumes`);
      setBatch({ batchId, total, completed: 0, processing: 0, queued: total, failed: 0, done: false, results: [] });
      pollStatus(selectedJob, batchId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start bulk screening');
    } finally {
      setUploading(false);
    }
  };

  const progressPct = batch?.total ? Math.round(((batch.completed + batch.failed) / batch.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><ScanSearch className="w-6 h-6 text-indigo-600" /> Bulk Resume Screening</h1>
          <p className="text-sm text-slate-500 mt-1">Upload up to 20 resumes at once and rank them instantly.</p>
        </div>
        {jobs.length > 0 && (
          <select
            value={selectedJob}
            onChange={(e) => { setSelectedJob(e.target.value); setBatch(null); }}
            className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/30 min-w-[220px]"
          >
            {jobs.map((j) => <option key={j._id} value={j._id}>{j.title}</option>)}
          </select>
        )}
      </div>

      {loadingJobs ? null : jobs.length === 0 ? (
        <EmptyState icon={Layers} title="No jobs to screen candidates for" description="Create a job posting first." action={<Link to="/recruiter/jobs/new"><Button variant="indigo">Post a Job</Button></Link>} />
      ) : (
        <>
          <Card className="p-6 animate-fadeInUp">
            <FileDropzone onFiles={handleUpload} multiple maxFiles={20} disabled={uploading} />
            {uploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 progress-fill rounded-full" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </Card>

          {batch && (
            <Card className="p-6 animate-fadeInUp stagger-1">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-slate-900">
                  {batch.done ? 'Screening complete' : 'Screening in progress'} — {batch.completed + batch.failed} / {batch.total} completed
                </p>
                {!batch.done && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />}
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-indigo-600 progress-fill rounded-full" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="green" icon={CheckCircle2}>{batch.completed} completed</Badge>
                {batch.processing > 0 && <Badge variant="amber">{batch.processing} processing</Badge>}
                {batch.queued > 0 && <Badge variant="slate">{batch.queued} queued</Badge>}
                {batch.failed > 0 && <Badge variant="rose" icon={XCircle}>{batch.failed} failed</Badge>}
              </div>
            </Card>
          )}

          <div className="animate-fadeInUp stagger-2">
            <h2 className="text-base font-bold text-slate-900 mb-3">Ranked Candidates</h2>
            <ScreenedCandidateTable jobId={selectedJob} refreshKey={refreshKey} />
          </div>
        </>
      )}
    </div>
  );
};

export default BulkScreeningPage;
