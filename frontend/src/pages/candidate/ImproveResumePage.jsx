import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateImprovement } from '../../services/resumeImproveService';
import { getJobById } from '../../services/jobService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft, Loader2, Sparkles, AlertTriangle, CheckCircle2,
  ArrowRight, Lightbulb,
} from 'lucide-react';

const ImproveResumePage = () => {
  const { resumeId, jobId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [job, setJob] = useState(null);
  const [improvement, setImprovement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const jobRes = await getJobById(jobId);
        setJob(jobRes.data);
        const res = await generateImprovement(resumeId, jobId);
        setImprovement(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to generate improvement suggestions');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId, jobId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-slate-500">Analyzing your resume against this role...</p>
      </div>
    );
  }

  if (!improvement) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-600" /> Improve My Resume
        </h1>
        <p className="text-sm text-slate-500 mt-1">for {job?.title} at {job?.company}</p>
      </div>

      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100 animate-fadeInUp">
        <p className="text-sm text-slate-700 leading-relaxed">{improvement.summary}</p>
      </Card>

      {improvement.warnings?.length > 0 && (
        <Card className="p-5 border-amber-200 bg-amber-50/50 animate-fadeInUp stagger-1">
          <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Important — Don't Fabricate
          </h3>
          <ul className="space-y-1.5 text-sm text-amber-800">
            {improvement.warnings.map((w, i) => <li key={i} className="flex gap-2"><span>•</span>{w}</li>)}
          </ul>
        </Card>
      )}

      {improvement.suggestedSkills?.length > 0 && (
        <Card className="p-5 animate-fadeInUp stagger-2">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Missing / Should Learn</h3>
          <div className="flex flex-wrap gap-1.5">
            {improvement.suggestedSkills.map((s) => <Badge key={s} variant="rose">{s}</Badge>)}
          </div>
          <p className="text-xs text-slate-400 mt-3">Only add these to your resume if you genuinely have real experience with them.</p>
        </Card>
      )}

      {improvement.improvements?.length > 0 && (
        <Card className="p-5 animate-fadeInUp stagger-3">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5"><Lightbulb className="w-4 h-4 text-blue-600" /> Improvement Suggestions</h3>
          <div className="space-y-3">
            {improvement.improvements.map((imp, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold text-blue-700 mb-1">{imp.area}</p>
                <p className="text-sm text-slate-600">{imp.suggestion}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {improvement.rewrittenSections?.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 animate-fadeIn">Suggested Rewrites</h2>
          {improvement.rewrittenSections.map((section, i) => (
            <Card key={i} className={`p-5 animate-fadeInUp stagger-${(i % 6) + 1}`}>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-bold text-slate-900">{section.section}</p>
                {section.supportedByResume ? (
                  <Badge variant="green" icon={CheckCircle2}>Fact-checked</Badge>
                ) : (
                  <Badge variant="amber" icon={AlertTriangle}>Review</Badge>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase mb-1.5">Original</p>
                  <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100 whitespace-pre-line">
                    {section.original}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-blue-500 uppercase mb-1.5 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" /> Suggested
                  </p>
                  <div className="text-sm text-slate-700 bg-blue-50/60 rounded-lg p-3 border border-blue-100 whitespace-pre-line">
                    {section.suggested}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-center text-slate-400 pb-4">
        These are suggestions only — nothing has been changed on your uploaded resume automatically.
      </p>
    </div>
  );
};

export default ImproveResumePage;
