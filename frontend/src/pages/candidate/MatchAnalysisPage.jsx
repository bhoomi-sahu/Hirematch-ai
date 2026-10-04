import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getMatchAnalysis } from '../../services/analysisService';
import { getMyResumes } from '../../services/resumeService';
import { getJobById } from '../../services/jobService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ScoreRing from '../../components/ui/ScoreRing';
import ProgressBar from '../../components/ui/ProgressBar';
import EmptyState from '../../components/ui/EmptyState';
import { MATCH_CATEGORY_BADGE } from '../../utils/statusMaps';
import {
  ArrowLeft, CheckCircle2, XCircle, MinusCircle, Sparkles, Loader2,
  TrendingUp, TrendingDown, Lightbulb, RotateCw, FileText,
} from 'lucide-react';

const MatchAnalysisPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const runAnalysis = useCallback(async (resumeId) => {
    if (!resumeId) return;
    setAnalyzing(true);
    try {
      const res = await getMatchAnalysis(jobId, resumeId);
      setResult(res.data);
    } catch (err) {
      setResult({ status: 'failed', message: err.response?.data?.message || 'Analysis failed' });
    } finally {
      setAnalyzing(false);
    }
  }, [jobId]);

  useEffect(() => {
    (async () => {
      try {
        const [jobRes, resumesRes] = await Promise.all([getJobById(jobId), getMyResumes()]);
        setJob(jobRes.data);
        const completed = (resumesRes.data || []).filter((r) => r.processingStatus === 'completed');
        setResumes(completed);
        const active = completed.find((r) => r.isActive) || completed[0];
        if (active) {
          setSelectedResume(active._id);
          await runAnalysis(active._id);
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <EmptyState
          icon={FileText}
          title="Upload your resume to analyze this job"
          description="We need a processed resume before we can calculate your match score."
          action={<Link to="/candidate/resumes"><Button>Upload Resume</Button></Link>}
        />
      </div>
    );
  }

  const analysis = result?.analysis;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Match Analysis</h1>
          <p className="text-sm text-slate-500 mt-1">{job?.title} at {job?.company}</p>
        </div>
        {resumes.length > 1 && (
          <select
            value={selectedResume}
            onChange={(e) => { setSelectedResume(e.target.value); runAnalysis(e.target.value); }}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            {resumes.map((r) => <option key={r._id} value={r._id}>{r.originalFileName}</option>)}
          </select>
        )}
      </div>

      {analyzing ? (
        <Card className="p-16 flex flex-col items-center justify-center gap-3 animate-fadeIn">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500">Analyzing your match...</p>
        </Card>
      ) : result?.status === 'processing' ? (
        <Card className="p-10 text-center animate-fadeIn">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-600">{result.message}</p>
        </Card>
      ) : result?.status === 'failed' ? (
        <Card className="p-10 text-center animate-fadeIn">
          <XCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <p className="text-sm text-slate-600 mb-4">{result.message}</p>
          <Button variant="outline" icon={RotateCw} onClick={() => runAnalysis(selectedResume)}>Retry Analysis</Button>
        </Card>
      ) : analysis ? (
        <>
          <Card className="p-8 animate-fadeInUp">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <ScoreRing score={analysis.overallScore} size={140} label="Overall Match" />
              <div className="flex-1 w-full space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={MATCH_CATEGORY_BADGE[analysis.matchCategory]}>{analysis.matchCategory}</Badge>
                  {result.cached && <span className="text-xs text-slate-400">Cached result</span>}
                </div>
                <ProgressBar label="Skill Match" value={analysis.skillScore} max={50} color="blue" suffix="/50" />
                <ProgressBar label="Experience Match" value={analysis.experienceScore} max={20} color="indigo" suffix="/20" />
                <ProgressBar label="Project Relevance" value={analysis.projectScore} max={15} color="purple" suffix="/15" />
                <div className="grid grid-cols-2 gap-4">
                  <ProgressBar label="Education Match" value={analysis.educationScore} max={10} color="emerald" suffix="/10" />
                  <ProgressBar label="Certifications" value={analysis.certificationScore} max={5} color="amber" suffix="/5" />
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 animate-fadeInUp stagger-1">
              <h3 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Matched Skills</h3>
              <div className="space-y-1.5">
                {analysis.matchedSkills.length === 0 ? <p className="text-xs text-slate-400">None matched</p> : analysis.matchedSkills.map((s) => (
                  <div key={s} className="text-sm text-slate-700 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />{s}</div>
                ))}
              </div>
            </Card>
            <Card className="p-5 animate-fadeInUp stagger-2">
              <h3 className="text-sm font-bold text-rose-700 mb-3 flex items-center gap-1.5"><XCircle className="w-4 h-4" /> Missing Skills</h3>
              <div className="space-y-1.5">
                {analysis.missingSkills.length === 0 ? <p className="text-xs text-slate-400">None missing</p> : analysis.missingSkills.map((s) => (
                  <div key={s} className="text-sm text-slate-700 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />{s}</div>
                ))}
              </div>
            </Card>
            <Card className="p-5 animate-fadeInUp stagger-3">
              <h3 className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-1.5"><MinusCircle className="w-4 h-4" /> Partial Skills</h3>
              <div className="space-y-1.5">
                {analysis.partialSkills.length === 0 ? <p className="text-xs text-slate-400">None</p> : analysis.partialSkills.map((s) => (
                  <div key={s} className="text-sm text-slate-700 flex items-center gap-1.5"><MinusCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />{s}</div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 animate-fadeInUp stagger-1">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-emerald-600" /> Strengths</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {analysis.strengths.map((s, i) => <li key={i} className="flex gap-2"><span className="text-emerald-500">•</span>{s}</li>)}
              </ul>
            </Card>
            <Card className="p-5 animate-fadeInUp stagger-2">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5"><TrendingDown className="w-4 h-4 text-rose-500" /> Weaknesses</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {analysis.weaknesses.map((s, i) => <li key={i} className="flex gap-2"><span className="text-rose-400">•</span>{s}</li>)}
              </ul>
            </Card>
          </div>

          <Card className="p-5 animate-fadeInUp stagger-3 bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5"><Lightbulb className="w-4 h-4 text-blue-600" /> Recommendations</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              {analysis.recommendations.map((s, i) => <li key={i} className="flex gap-2"><span className="text-blue-500">•</span>{s}</li>)}
            </ul>
            <Link to={`/candidate/resumes/${selectedResume}/improve/${jobId}`} className="inline-block mt-4">
              <Button icon={Sparkles} size="sm">Improve My Resume for This Job</Button>
            </Link>
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default MatchAnalysisPage;
