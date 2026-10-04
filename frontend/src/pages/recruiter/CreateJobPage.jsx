import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobById, createJob, updateJob } from '../../services/jobService';
import { analyzeJobWithAI } from '../../services/aiService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TagInput from '../../components/ui/TagInput';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Briefcase, Sparkles, CheckCircle2 } from 'lucide-react';

const TYPES = ['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'];
const LEVELS = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead / Staff', 'Executive'];

const emptyForm = {
  title: '',
  company: '',
  location: 'Remote',
  type: 'Full-time',
  experienceLevel: 'Mid Level',
  salaryMin: 60000,
  salaryMax: 120000,
  currency: 'USD',
  description: '',
  requirementsText: '',
  skillsRequired: [],
  preferredSkills: [],
  educationRequirement: '',
  certificationsRequired: [],
  status: 'active',
};

const CreateJobPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = !!jobId;

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await getJobById(jobId);
        const job = res.data;
        setForm({
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          experienceLevel: job.experienceLevel,
          salaryMin: job.salaryRange?.min || 0,
          salaryMax: job.salaryRange?.max || 0,
          currency: job.salaryRange?.currency || 'USD',
          description: job.description,
          requirementsText: (job.requirements || []).join('\n'),
          skillsRequired: job.skillsRequired || [],
          preferredSkills: job.preferredSkills || [],
          educationRequirement: job.educationRequirement || '',
          certificationsRequired: job.certificationsRequired || [],
          status: job.status,
        });
      } catch (err) {
        toast.error('Failed to load job');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const handleAnalyzeWithAI = async () => {
    if (!form.description.trim()) {
      toast.error('Add a job description first so AI has something to analyze');
      return;
    }
    setAnalyzing(true);
    try {
      const res = await analyzeJobWithAI(form.title, form.description, form.requirementsText);
      const extracted = res.data;

      setForm((f) => ({
        ...f,
        skillsRequired: extracted.requiredSkills?.length > 0 ? extracted.requiredSkills : f.skillsRequired,
        preferredSkills: extracted.preferredSkills?.length > 0 ? extracted.preferredSkills : f.preferredSkills,
        experienceLevel: extracted.experience || f.experienceLevel,
        educationRequirement: extracted.education || f.educationRequirement,
        requirementsText:
          f.requirementsText.trim() || extracted.responsibilities?.length === 0
            ? f.requirementsText
            : extracted.responsibilities.join('\n'),
      }));
      setAiApplied(true);
      toast.success('AI extracted the job requirements — review and adjust the fields below');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI analysis failed — you can still fill this in manually');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.skillsRequired.length === 0) {
      toast.error('Please add at least one required skill');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        company: form.company,
        location: form.location,
        type: form.type,
        experienceLevel: form.experienceLevel,
        salaryRange: { min: Number(form.salaryMin), max: Number(form.salaryMax), currency: form.currency },
        description: form.description,
        requirements: form.requirementsText.split('\n').map((r) => r.trim()).filter(Boolean),
        skillsRequired: form.skillsRequired,
        preferredSkills: form.preferredSkills,
        educationRequirement: form.educationRequirement,
        certificationsRequired: form.certificationsRequired,
        status: form.status,
      };
      if (isEdit) {
        await updateJob(jobId, payload);
        toast.success('Job updated successfully');
      } else {
        await createJob(payload);
        toast.success('Job posted successfully');
      }
      navigate('/recruiter/jobs');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save job');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  const input = (label, key, type = 'text', required = false) => (
    <div>
      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{label}{required && ' *'}</label>
      <input
        type={type}
        required={required}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-shadow"
      />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-indigo-600" /> {isEdit ? 'Edit Job' : 'Post a New Job'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="p-6 space-y-4 animate-fadeInUp">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {input('Job Title', 'title', 'text', true)}
            {input('Company', 'company', 'text', true)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {input('Location', 'location')}
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Employment Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/30">
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Experience Level</label>
              <select value={form.experienceLevel} onChange={(e) => setForm((f) => ({ ...f, experienceLevel: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/30">
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {input('Min Salary', 'salaryMin', 'number')}
            {input('Max Salary', 'salaryMax', 'number')}
            {input('Currency', 'currency')}
          </div>
        </Card>

        <Card className="p-6 space-y-4 animate-fadeInUp stagger-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-600 block">Job Description *</label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              icon={aiApplied ? CheckCircle2 : Sparkles}
              loading={analyzing}
              onClick={handleAnalyzeWithAI}
              className={aiApplied ? '!text-emerald-700 !border-emerald-200' : ''}
            >
              {aiApplied ? 'Re-analyze with AI' : 'Analyze with AI'}
            </Button>
          </div>
          <div>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={6}
              placeholder='Paste or write the job description here, then click "Analyze with AI" to auto-extract skills, experience level, and education requirements.'
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Responsibilities / Requirements (one per line)</label>
            <textarea
              value={form.requirementsText}
              onChange={(e) => setForm((f) => ({ ...f, requirementsText: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
            />
          </div>
          {aiApplied && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
              AI pre-filled the skills, experience level, and education fields below — review and adjust before posting.
            </p>
          )}
        </Card>

        <Card className="p-6 space-y-4 animate-fadeInUp stagger-2">
          <TagInput label="Required Skills *" values={form.skillsRequired} onChange={(v) => setForm((f) => ({ ...f, skillsRequired: v }))} placeholder="e.g. React, then Enter" />
          <TagInput label="Preferred Skills" values={form.preferredSkills} onChange={(v) => setForm((f) => ({ ...f, preferredSkills: v }))} placeholder="Nice-to-have skills" />
          {input('Education Requirement (optional)', 'educationRequirement')}
          <TagInput label="Certifications Required (optional)" values={form.certificationsRequired} onChange={(v) => setForm((f) => ({ ...f, certificationsRequired: v }))} placeholder="e.g. AWS Certified" />
        </Card>

        <Card className="p-6 animate-fadeInUp stagger-3">
          <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Status</label>
          <div className="flex gap-2">
            {['draft', 'active', 'closed'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm((f) => ({ ...f, status: s }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize border transition-colors ${
                  form.status === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" variant="indigo" loading={saving}>{isEdit ? 'Save Changes' : 'Post Job'}</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/recruiter/jobs')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default CreateJobPage;
