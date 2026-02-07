import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Users() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'OTHERS',
    zoneId: ''
  });

  const { data, isLoading } = useQuery('users', async () => {
    const response = await api.get('/users');
    return response.data;
  });

  const { data: zones } = useQuery('zones', async () => {
    const response = await api.get('/zones');
    return response.data.zones;
  });

  const createMutation = useMutation(
    async (data: any) => {
      const response = await api.post('/users', data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('User created successfully!');
        queryClient.invalidateQueries('users');
        setShowModal(false);
        resetForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create user');
      }
    }
  );

  const updateMutation = useMutation(
    async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/users/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('User updated successfully!');
        queryClient.invalidateQueries('users');
        setShowModal(false);
        setEditingUser(null);
        resetForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update user');
      }
    }
  );

  const deleteMutation = useMutation(
    async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    {
      onSuccess: () => {
        toast.success('User deleted successfully!');
        queryClient.invalidateQueries('users');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to delete user');
      }
    }
  );

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'OTHERS',
      zoneId: ''
    });
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role,
      zoneId: user.zoneId || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (!submitData.password && editingUser) {
      delete submitData.password;
    }
    if (!submitData.zoneId) {
      delete submitData.zoneId;
    }

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage system users</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          New User
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Zone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.users?.map((user: any) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{user.name}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">{user.zone?.name || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this user?')) {
                            deleteMutation.mutate(user.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-2xl font-bold">
              {editingUser ? 'Edit User' : 'Create User'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="WORKER">Worker</option>
                  <option value="OTHERS">Others</option>
                </select>
              </div>
              <div>
                <label className="label">Zone (Optional)</label>
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
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                >
                  {editingUser ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
