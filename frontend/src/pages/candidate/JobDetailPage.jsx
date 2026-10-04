import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getJobById } from '../../services/jobService';
import { applyToJob } from '../../services/applicationService';
import { getMyResumes } from '../../services/resumeService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import {
  MapPin, Clock, Briefcase, DollarSign, ArrowLeft, Sparkles,
  CheckCircle2, FileWarning,
} from 'lucide-react';

const JobDetailPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState([]);
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedResume, setSelectedResume] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [jobRes, resumesRes] = await Promise.all([getJobById(jobId), getMyResumes()]);
        setJob(jobRes.data);
        setResumes(resumesRes.data || []);
        const active = (resumesRes.data || []).find((r) => r.isActive && r.processingStatus === 'completed');
        if (active) setSelectedResume(active._id);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load job');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const handleApply = async () => {
    setApplying(true);
    try {
      await applyToJob(jobId, coverLetter, selectedResume || null);
      toast.success('Application submitted successfully!');
      setApplied(true);
      setApplyOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto"><SkeletonCard /></div>;
  }
  if (!job) return null;

  const completedResumes = resumes.filter((r) => r.processingStatus === 'completed');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <Card className="p-7 animate-fadeInUp">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
            <p className="text-slate-500 mt-1">{job.company}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
              <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" />{job.type}</span>
              <span className="inline-flex items-center gap-1"><Briefcase className="w-4 h-4" />{job.experienceLevel}</span>
              {job.salaryRange && (
                <span className="inline-flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {job.salaryRange.min?.toLocaleString()}–{job.salaryRange.max?.toLocaleString()} {job.salaryRange.currency}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            {applied ? (
              <Badge variant="green" className="justify-center py-2"><CheckCircle2 className="w-3.5 h-3.5" /> Applied</Badge>
            ) : (
              <Button onClick={() => setApplyOpen(true)}>Apply Now</Button>
            )}
            {completedResumes.length > 0 && (
              <Link to={`/candidate/jobs/${jobId}/match`}>
                <Button variant="outline" icon={Sparkles} className="w-full">Check My Match</Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-7 animate-fadeInUp stagger-1">
        <h2 className="font-bold text-slate-900 mb-3">Job Description</h2>
        <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{job.description}</p>

        {job.requirements?.length > 0 && (
          <>
            <h3 className="font-bold text-slate-900 mt-6 mb-2 text-sm">Responsibilities & Requirements</h3>
            <ul className="text-sm text-slate-600 space-y-1.5 list-disc list-inside">
              {job.requirements.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </>
        )}

        <h3 className="font-bold text-slate-900 mt-6 mb-2 text-sm">Required Skills</h3>
        <div className="flex flex-wrap gap-1.5">
          {job.skillsRequired?.map((s) => <Badge key={s} variant="blue">{s}</Badge>)}
        </div>

        {job.preferredSkills?.length > 0 && (
          <>
            <h3 className="font-bold text-slate-900 mt-4 mb-2 text-sm">Preferred Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {job.preferredSkills.map((s) => <Badge key={s} variant="slate">{s}</Badge>)}
            </div>
          </>
        )}
      </Card>

      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} title={`Apply to ${job.title}`}>
        {completedResumes.length === 0 ? (
          <div className="text-center py-4">
            <FileWarning className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-slate-600 mb-4">You need an analyzed resume before applying.</p>
            <Link to="/candidate/resumes">
              <Button>Upload a Resume</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Select Resume</label>
              <select
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {completedResumes.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.originalFileName} {r.isActive ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Cover Letter (optional)</label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={4}
                placeholder="Briefly say why you're a great fit..."
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
              />
            </div>
            <Button onClick={handleApply} loading={applying} className="w-full">Submit Application</Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default JobDetailPage;
