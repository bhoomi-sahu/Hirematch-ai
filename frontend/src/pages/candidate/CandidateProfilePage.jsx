import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyProfile, updateMyProfile } from '../../services/profileService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { UserCircle2, Save } from 'lucide-react';

const CandidateProfilePage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ headline: '', bio: '', location: '', phone: '', linkedin: '', github: '', portfolio: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyProfile();
        const p = res.data;
        setForm({
          headline: p.headline || '',
          bio: p.bio || '',
          location: p.location || '',
          phone: p.phone || '',
          linkedin: p.links?.linkedin || '',
          github: p.links?.github || '',
          portfolio: p.links?.portfolio || '',
        });
      } catch {
        // profile may not exist yet — fine, defaults apply
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMyProfile({
        headline: form.headline,
        bio: form.bio,
        location: form.location,
        phone: form.phone,
        links: { linkedin: form.linkedin, github: form.github, portfolio: form.portfolio },
      });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SkeletonCard />;

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          rows={4}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
          <p className="text-sm text-slate-500">{user?.email}</p>
        </div>
      </div>

      <Card className="p-6 animate-fadeInUp">
        <form onSubmit={handleSave} className="space-y-4">
          {field('Headline', 'headline', 'text', 'e.g. Full-Stack Developer')}
          {field('Bio', 'bio', 'textarea', 'A short summary about yourself...')}
          <div className="grid grid-cols-2 gap-4">
            {field('Location', 'location', 'text', 'e.g. Remote')}
            {field('Phone', 'phone', 'text', '+1 555 000 0000')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {field('LinkedIn', 'linkedin', 'url', 'https://linkedin.com/in/...')}
            {field('GitHub', 'github', 'url', 'https://github.com/...')}
            {field('Portfolio', 'portfolio', 'url', 'https://...')}
          </div>
          <Button type="submit" loading={saving} icon={Save}>Save Changes</Button>
        </form>
      </Card>

      <Card className="p-5 flex items-start gap-3 animate-fadeInUp stagger-1 bg-slate-50/50">
        <UserCircle2 className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500">
          Your skills, education, and experience are now automatically extracted from your uploaded resume PDF — manage those on the{' '}
          <span className="font-semibold text-slate-700">My Resumes</span> page.
        </p>
      </Card>
    </div>
  );
};

export default CandidateProfilePage;
