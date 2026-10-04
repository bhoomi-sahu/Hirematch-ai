import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { seedDemoData } from '../../services/adminService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { Settings, Mail, ShieldCheck, Database } from 'lucide-react';

const AdminSettingsPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDemoData();
      toast.success('Demo data seeded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to seed demo data');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Settings className="w-6 h-6 text-purple-600" /> Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Platform administration preferences.</p>
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
            <dd><Badge variant="purple">{user?.role}</Badge></dd>
          </div>
        </dl>
      </Card>

      <Card className="p-6 animate-fadeInUp stagger-1">
        <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2"><Database className="w-4 h-4" /> Demo Data</h2>
        <p className="text-xs text-slate-500 mb-4">Seed a small set of demo accounts and jobs to explore the platform.</p>
        <Button variant="outline" loading={seeding} onClick={handleSeed}>Seed Demo Data</Button>
      </Card>
    </div>
  );
};

export default AdminSettingsPage;
