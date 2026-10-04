import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Settings, Mail, Calendar, ShieldCheck } from 'lucide-react';

const CandidateSettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" /> Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account preferences.</p>
      </div>

      <Card className="p-6 animate-fadeInUp">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Account Information</h2>
        <dl className="divide-y divide-slate-100 text-sm">
          <div className="py-3 flex items-center justify-between">
            <dt className="text-slate-500 flex items-center gap-2"><Mail className="w-4 h-4" /> Email</dt>
            <dd className="font-medium text-slate-900">{user?.email}</dd>
          </div>
          <div className="py-3 flex items-center justify-between">
            <dt className="text-slate-500 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Role</dt>
            <dd><Badge variant="blue">{user?.role}</Badge></dd>
          </div>
          <div className="py-3 flex items-center justify-between">
            <dt className="text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Member Since</dt>
            <dd className="font-medium text-slate-900">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</dd>
          </div>
        </dl>
      </Card>

      <Card className="p-6 animate-fadeInUp stagger-1">
        <h2 className="text-sm font-bold text-slate-900 mb-2">Notifications</h2>
        <p className="text-xs text-slate-500">Email notification preferences will appear here in a future update.</p>
      </Card>
    </div>
  );
};

export default CandidateSettingsPage;
