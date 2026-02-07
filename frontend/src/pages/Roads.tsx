import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function Roads() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingRoad, setEditingRoad] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    zoneId: ''
  });

  const { data, isLoading } = useQuery('roads', async () => {
    const response = await api.get('/roads');
    return response.data.roads;
  });

  const { data: zones } = useQuery('zones', async () => {
    const response = await api.get('/zones');
    return response.data.zones;
  });

  const createMutation = useMutation(
    async (data: any) => {
      const response = await api.post('/roads', data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Road created successfully!');
        queryClient.invalidateQueries('roads');
        setShowModal(false);
        resetForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create road');
      }
    }
  );

  const updateMutation = useMutation(
    async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/roads/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Road updated successfully!');
        queryClient.invalidateQueries('roads');
        setShowModal(false);
        setEditingRoad(null);
        resetForm();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update road');
      }
    }
  );

  const deleteMutation = useMutation(
    async (id: string) => {
      await api.delete(`/roads/${id}`);
    },
    {
      onSuccess: () => {
        toast.success('Road deleted successfully!');
        queryClient.invalidateQueries('roads');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to delete road');
      }
    }
  );

  const resetForm = () => {
    setFormData({ name: '', zoneId: '' });
  };

  const handleEdit = (road: any) => {
    setEditingRoad(road);
    setFormData({
      name: road.name,
      zoneId: road.zoneId
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoad) {
      updateMutation.mutate({ id: editingRoad.id, data: formData });
    } else {
      createMutation.mutate(formData);
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
          <h1 className="text-3xl font-bold text-gray-900">Roads</h1>
          <p className="text-gray-600 mt-1">Manage roads by zone</p>
        </div>
        <button
          onClick={() => {
            setEditingRoad(null);
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          New Road
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Zone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Cases</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((road: any) => (
                <tr key={road.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{road.name}</td>
                  <td className="py-3 px-4">{road.zone?.name}</td>
                  <td className="py-3 px-4">{road._count?.cases || 0}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(road)}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this road?')) {
                            deleteMutation.mutate(road.id);
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
              {editingRoad ? 'Edit Road' : 'Create Road'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Zone *</label>
                <select
                  value={formData.zoneId}
                  onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                  required
                  className="input"
                >
                  <option value="">Select zone</option>
                  {zones?.map((zone: any) => (
                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                  ))}
                </select>
              </div>
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
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                >
                  {editingRoad ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRoad(null);
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
