import React, { useEffect, useState, useMemo } from 'react';
import { getAdminUsers, updateUserRole, suspendUser, activateUser, deleteUser } from '../../services/adminService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { useToast } from '../../context/ToastContext';
import { Users, Search, Lock, Unlock, Trash2 } from 'lucide-react';

const ROLE_BADGE = { candidate: 'blue', recruiter: 'indigo', admin: 'purple' };
const TITLES = { all: 'All Users', recruiter: 'Recruiters', candidate: 'Candidates' };

const UsersPage = ({ roleFilter = 'all' }) => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      const res = await getAdminUsers(params);
      setUsers(res.data || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [roleFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const term = search.toLowerCase();
    return users.filter((u) => u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term));
  }, [users, search]);

  const toggleActive = async (u) => {
    setUpdatingId(u._id);
    try {
      if (u.isActive === false) {
        await activateUser(u._id);
        toast.success('User reactivated');
      } else {
        await suspendUser(u._id);
        toast.success('User suspended');
      }
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setUpdatingId(null);
    }
  };

  const changeRole = async (u, role) => {
    setUpdatingId(u._id);
    try {
      await updateUserRole(u._id, role);
      toast.success('Role updated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget._id);
      toast.success('User deleted');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold text-slate-900">{TITLES[roleFilter]}</h1>
        <p className="text-sm text-slate-500 mt-1">Manage roles and account access.</p>
      </div>

      <Card className="p-4 animate-fadeInUp">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-purple-500/30"
          />
        </div>
      </Card>

      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try a different search." />
      ) : (
        <Card className="overflow-hidden animate-fadeInUp">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => (
                  <tr key={u._id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors animate-fadeIn stagger-${(idx % 6) + 1}`}>
                    <td className="px-5 py-4 font-semibold text-slate-900">{u.name}</td>
                    <td className="px-5 py-4 text-slate-500">{u.email}</td>
                    <td className="px-5 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u, e.target.value)}
                        disabled={updatingId === u._id}
                        className="text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-purple-500/30"
                      >
                        <option value="candidate">Candidate</option>
                        <option value="recruiter">Recruiter</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={u.isActive === false ? 'rose' : 'green'}>{u.isActive === false ? 'Suspended' : 'Active'}</Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="ghost" icon={u.isActive === false ? Unlock : Lock} loading={updatingId === u._id} onClick={() => toggleActive(u)}>
                          {u.isActive === false ? 'Activate' : 'Suspend'}
                        </Button>
                        <button onClick={() => setDeleteTarget(u)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        danger
        title="Delete this account?"
        message={`This permanently deletes "${deleteTarget?.name}" and all related data (profile, jobs, applications, resumes).`}
        confirmLabel="Delete"
      />
    </div>
  );
};

export default UsersPage;
