import React, { useEffect, useState, useCallback } from 'react';
import { getMyResumes, uploadResume, deleteResume, reprocessResume, getResumeFileUrl } from '../../services/resumeService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import FileDropzone from '../../components/ui/FileDropzone';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import { RESUME_STATUS_BADGE } from '../../utils/statusMaps';
import {
  FileText, Loader2, CheckCircle2, XCircle, RotateCw, Trash2,
  ExternalLink, Star, AlertCircle,
} from 'lucide-react';

const ResumesPage = () => {
  const toast = useToast();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [reprocessingId, setReprocessingId] = useState(null);

  const fetchResumes = useCallback(async () => {
    try {
      const res = await getMyResumes();
      setResumes(res.data || []);
    } catch (err) {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchResumes(); }, [fetchResumes]);

  // Poll while any resume is still queued/processing
  useEffect(() => {
    const hasPending = resumes.some((r) => ['queued', 'processing'].includes(r.processingStatus));
    if (!hasPending) return;
    const interval = setInterval(fetchResumes, 3000);
    return () => clearInterval(interval);
  }, [resumes, fetchResumes]);

  const handleUpload = async (files) => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      await uploadResume(file, setUploadProgress);
      toast.success('Resume uploaded and analyzed!');
      fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteResume(deleteTarget._id);
      toast.success('Resume deleted');
      setDeleteTarget(null);
      fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete resume');
    } finally {
      setDeleting(false);
    }
  };

  const handleReprocess = async (id) => {
    setReprocessingId(id);
    try {
      await reprocessResume(id);
      toast.success('Re-analysis complete');
      fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Re-analysis failed');
    } finally {
      setReprocessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold text-slate-900">My Resumes</h1>
        <p className="text-sm text-slate-500 mt-1">Upload a PDF resume — we'll extract and structure it automatically.</p>
      </div>

      <Card className="p-6 animate-fadeInUp">
        <FileDropzone onFiles={handleUpload} disabled={uploading} />
        {uploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Uploading & analyzing...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 progress-fill rounded-full" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}
      </Card>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <SkeletonCard key={i} />)}</div>
      ) : resumes.length === 0 ? (
        <EmptyState icon={FileText} title="No resumes uploaded yet" description="Upload your first resume to start applying and get match scores." />
      ) : (
        <div className="space-y-3">
          {resumes.map((resume, idx) => {
            const isPending = ['queued', 'processing'].includes(resume.processingStatus);
            return (
              <Card key={resume._id} className={`p-5 animate-fadeInUp stagger-${(idx % 6) + 1}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 text-sm truncate">{resume.originalFileName}</p>
                        {resume.isActive && (
                          <Badge variant="blue" icon={Star}>Active</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                        {resume.parsed?.skills?.length > 0 && ` · ${resume.parsed.skills.length} skills detected`}
                      </p>
                      {resume.processingStatus === 'failed' && (
                        <p className="text-xs text-rose-600 mt-1.5 inline-flex items-start gap-1">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {resume.processingError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={RESUME_STATUS_BADGE[resume.processingStatus]} className={isPending ? 'animate-pulse' : ''}>
                      {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                      {resume.processingStatus}
                    </Badge>
                    <a href={getResumeFileUrl(resume._id)} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View PDF">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleReprocess(resume._id)}
                      disabled={reprocessingId === resume._id}
                      className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Re-analyze"
                    >
                      <RotateCw className={`w-4 h-4 ${reprocessingId === resume._id ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(resume)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {resume.processingStatus === 'completed' && resume.parsed?.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-slate-100">
                    {resume.parsed.skills.slice(0, 10).map((s) => <Badge key={s} variant="slate">{s}</Badge>)}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        danger
        title="Delete resume?"
        message={`This will permanently remove "${deleteTarget?.originalFileName}" and its analysis.`}
        confirmLabel="Delete"
      />
    </div>
  );
};

export default ResumesPage;
