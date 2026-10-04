import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCandidateApplications } from '../../services/applicationService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { APP_STATUS_LABELS, APP_STATUS_BADGE, APP_STATUS_ORDER } from '../../utils/statusMaps';
import { FileText, CheckCircle2 } from 'lucide-react';

const MyApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getCandidateApplications();
        setApplications(res.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
        <p className="text-sm text-slate-500 mt-1">Track the status of every job you've applied to.</p>
      </div>

      {loading ? (
        <SkeletonTable rows={4} cols={4} />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications yet"
          description="Once you apply to jobs, they'll show up here with live status updates."
        />
      ) : (
        <div className="space-y-3">
          {applications.map((app, idx) => (
            <Card key={app._id} className={`p-5 animate-fadeInUp stagger-${(idx % 6) + 1}`} hover>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/candidate/jobs/${app.jobId?._id}`} className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors">
                    {app.jobId?.title || 'Job posting removed'}
                  </Link>
                  <p className="text-xs text-slate-500 mt-1">{app.jobId?.company} · Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  {typeof app.matchAnalysis?.score === 'number' && (
                    <Badge variant={app.matchAnalysis.score >= 80 ? 'green' : app.matchAnalysis.score >= 60 ? 'amber' : 'rose'}>
                      {app.matchAnalysis.score}% match
                    </Badge>
                  )}
                  <Badge variant={APP_STATUS_BADGE[app.status]} icon={CheckCircle2}>{APP_STATUS_LABELS[app.status]}</Badge>
                </div>
              </div>

              {/* Status timeline */}
              <div className="flex items-center gap-1 mt-4 pt-4 border-t border-slate-100">
                {APP_STATUS_ORDER.filter((s) => s !== 'rejected').map((s, i, arr) => {
                  const currentIdx = APP_STATUS_ORDER.indexOf(app.status);
                  const stepIdx = APP_STATUS_ORDER.indexOf(s);
                  const reached = app.status !== 'rejected' && stepIdx <= currentIdx;
                  return (
                    <React.Fragment key={s}>
                      <div className={`w-2 h-2 rounded-full transition-colors ${reached ? 'bg-blue-600' : 'bg-slate-200'}`} />
                      {i < arr.length - 1 && <div className={`flex-1 h-0.5 transition-colors ${reached && stepIdx < currentIdx ? 'bg-blue-600' : 'bg-slate-200'}`} />}
                    </React.Fragment>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyApplicationsPage;
