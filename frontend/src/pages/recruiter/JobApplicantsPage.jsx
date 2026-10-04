import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobApplications, updateApplicationStatus } from '../../services/applicationService';
import { getJobById } from '../../services/jobService';
import { getResumeFileUrl } from '../../services/resumeService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import { APP_STATUS_LABELS, APP_STATUS_BADGE } from '../../utils/statusMaps';
import { ArrowLeft, Users, ExternalLink, Eye, CheckCircle2, XCircle } from 'lucide-react';

const STATUS_OPTIONS = ['applied', 'screening', 'interview', 'offered', 'rejected'];

const JobApplicantsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [jobRes, appsRes] = await Promise.all([getJobById(jobId), getJobApplications(jobId)]);
        setJob(jobRes.data);
        setApplications(appsRes.data || []);
      } catch (err) {
        toast.error('Failed to load applicants');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const changeStatus = async (appId, status) => {
    setUpdatingId(appId);
    try {
      await updateApplicationStatus(appId, status);
      setApplications((prev) => prev.map((a) => (a._id === appId ? { ...a, status } : a)));
      toast.success(`Status updated to ${APP_STATUS_LABELS[status]}`);
      if (detail?._id === appId) setDetail((d) => ({ ...d, status }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold text-slate-900">Applicants</h1>
        <p className="text-sm text-slate-500 mt-1">{job?.title} · {applications.length} applicant{applications.length !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : applications.length === 0 ? (
        <EmptyState icon={Users} title="No applicants yet" description="Applications will appear here, ranked by AI match score." />
      ) : (
        <Card className="overflow-hidden animate-fadeInUp">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase">
                  <th className="px-5 py-3">Candidate</th>
                  <th className="px-5 py-3">Match Score</th>
                  <th className="px-5 py-3">Skills Matched</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app, idx) => (
                  <tr key={app._id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors animate-fadeIn stagger-${(idx % 6) + 1}`}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{app.candidateId?.name}</p>
                      <p className="text-xs text-slate-500">{app.candidateId?.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={app.matchAnalysis?.score >= 80 ? 'green' : app.matchAnalysis?.score >= 60 ? 'amber' : 'rose'}>
                        {app.matchAnalysis?.score ?? 0}%
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(app.matchAnalysis?.skillsMatched || []).slice(0, 3).map((s) => <Badge key={s} variant="slate">{s}</Badge>)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={app.status}
                        onChange={(e) => changeStatus(app._id, e.target.value)}
                        disabled={updatingId === app._id}
                        className="text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-500/30"
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{APP_STATUS_LABELS[s]}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button onClick={() => setDetail(app)} className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="View analysis">
                          <Eye className="w-4 h-4" />
                        </button>
                        {app.resumeId && (
                          <a href={getResumeFileUrl(app.resumeId)} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="View resume">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.candidateId?.name || 'Candidate Analysis'} size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant={APP_STATUS_BADGE[detail.status]}>{APP_STATUS_LABELS[detail.status]}</Badge>
              <Badge variant={detail.matchAnalysis?.score >= 80 ? 'green' : detail.matchAnalysis?.score >= 60 ? 'amber' : 'rose'}>
                {detail.matchAnalysis?.score ?? 0}% Match
              </Badge>
            </div>
            {detail.coverLetter && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Cover Letter</p>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 whitespace-pre-line">{detail.coverLetter}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-emerald-700 mb-1.5 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Matched Skills</p>
                <div className="flex flex-wrap gap-1">{(detail.matchAnalysis?.skillsMatched || []).map((s) => <Badge key={s} variant="green">{s}</Badge>)}</div>
              </div>
              <div>
                <p className="text-xs font-semibold text-rose-700 mb-1.5 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Missing Skills</p>
                <div className="flex flex-wrap gap-1">{(detail.matchAnalysis?.skillsMissing || []).map((s) => <Badge key={s} variant="rose">{s}</Badge>)}</div>
              </div>
            </div>
            {detail.matchAnalysis?.aiSummary && (
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Recommendation</p>
                <p className="text-sm text-slate-600">{detail.matchAnalysis.aiSummary}</p>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => changeStatus(detail._id, 'screening')}>Shortlist</Button>
              <Button size="sm" variant="danger" onClick={() => changeStatus(detail._id, 'rejected')}>Reject</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default JobApplicantsPage;
