import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { usersService, zonesService } from '../services/supabaseService';
import { emailToUsername } from '../lib/authConstants';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Users as UsersIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonTable } from '../components/ui/Skeleton';

export default function Users() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [formData, setFormData] = useState<{
    username: string;
    password: string;
    name: string;
    role: 'ADMIN' | 'WORKER' | 'OTHERS';
    zoneId: string;
  }>({
    username: '',
    password: '',
    name: '',
    role: 'OTHERS',
    zoneId: '',
  });

  const { data, isLoading } = useQuery('users', () => usersService.getAll({}, 1, 100));
  const { data: zones } = useQuery('zones', () => zonesService.getAll().then((r) => r.zones));

  const createMutation = useMutation(
    (data: any) => usersService.create(data),
    {
      onSuccess: () => {
        toast.success('User created successfully!');
        queryClient.invalidateQueries('users');
        setShowModal(false);
        resetForm();
      },
      onError: (err: any) => { toast.error(err.message || 'Failed to create user'); },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => {
      const updateData: any = { name: data.name, role: data.role };
      if (data.zoneId) updateData.zone_id = data.zoneId;
      else if (data.zoneId === '') updateData.zone_id = null;
      return usersService.update(id, updateData);
    },
    {
      onSuccess: () => {
        toast.success('User updated successfully!');
        queryClient.invalidateQueries('users');
        setShowModal(false);
        setEditingUser(null);
        resetForm();
      },
      onError: (err: any) => { toast.error(err.message || 'Failed to update user'); },
    }
  );

  const deleteMutation = useMutation(
    (id: string) => usersService.delete(id),
    {
      onSuccess: () => {
        toast.success('User deleted successfully!');
        queryClient.invalidateQueries('users');
        setDeleteTarget(null);
      },
      onError: (err: any) => { toast.error(err.message || 'Failed to delete user'); },
    }
  );

  const resetForm = () => {
    setFormData({ username: '', password: '', name: '', role: 'OTHERS', zoneId: '' });
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: emailToUsername(user.email || ''),
      password: '',
      name: user.name || '',
      role: user.role,
      zoneId: user.zone_id || user.zoneId || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }
    if (!editingUser && !formData.username?.trim()) {
      toast.error('Username is required');
      return;
    }
    const { password, zoneId, username, name, role } = formData;
    const submitData: any = { name, role, zoneId: zoneId || undefined };
    if (password && !editingUser) submitData.password = password;
    if (!editingUser) submitData.username = username.trim();
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage system users</p>
        </div>
        <SkeletonTable rows={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage system users</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary shrink-0"
        >
          <Plus size={20} className="mr-2" />
          New User
        </button>
      </div>

      {data?.users?.length ? (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username (login)</th>
                <th>Role</th>
                <th>Zone</th>
                <th>Created</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u: any) => (
                <tr key={u.id}>
                  <td className="font-medium text-gray-900 dark:text-gray-100">{u.name || '—'}</td>
                  <td className="text-gray-600 dark:text-gray-400">{emailToUsername(u.email)}</td>
                  <td><Badge variant="role">{u.role}</Badge></td>
                  <td className="text-gray-600 dark:text-gray-400">{(u.zones as any)?.name || u.zone?.name || '—'}</td>
                  <td className="text-gray-600 dark:text-gray-400 text-sm">
                    {format(new Date(u.created_at || u.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => handleEdit(u)}
                        className="btn btn-ghost p-2 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                        aria-label="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ id: u.id, name: u.name || 'this user' })}
                        className="btn btn-ghost p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        aria-label="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Card>
          <EmptyState icon={UsersIcon} title="No users yet" description="Create a user to get started." />
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingUser(null); resetForm(); }}
        title={editingUser ? 'Edit User' : 'Create User'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Username (login) *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required={!editingUser}
              disabled={!!editingUser}
              className="input"
              placeholder="e.g. johndoe"
            />
            {editingUser && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Username cannot be changed.</p>}
          </div>
          {!editingUser && (
            <div>
              <label className="label">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="input"
                placeholder="Minimum 6 characters"
                minLength={6}
              />
            </div>
          )}
          <div>
            <label className="label">Display name (optional)</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="label">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'WORKER' | 'OTHERS' })}
              className="input"
            >
              <option value="ADMIN">Admin</option>
              <option value="WORKER">Worker</option>
              <option value="OTHERS">Others</option>
            </select>
          </div>
          <div>
            <label className="label">Zone (optional)</label>
            <select
              value={formData.zoneId}
              onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
              className="input"
            >
              <option value="">No Zone</option>
              {zones?.map((zone: any) => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {editingUser ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => { setShowModal(false); setEditingUser(null); resetForm(); }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete user"
        message={deleteTarget ? `Are you sure you want to delete ${deleteTarget.name}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteMutation.isLoading}
      />
    </div>
  );
}
