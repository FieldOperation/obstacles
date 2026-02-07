import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function Zones() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState<any>(null);
  const [name, setName] = useState('');

  const { data, isLoading } = useQuery('zones', async () => {
    const response = await api.get('/zones');
    return response.data.zones;
  });

  const createMutation = useMutation(
    async (name: string) => {
      const response = await api.post('/zones', { name });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Zone created successfully!');
        queryClient.invalidateQueries('zones');
        setShowModal(false);
        setName('');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create zone');
      }
    }
  );

  const updateMutation = useMutation(
    async ({ id, name }: { id: string; name: string }) => {
      const response = await api.put(`/zones/${id}`, { name });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Zone updated successfully!');
        queryClient.invalidateQueries('zones');
        setShowModal(false);
        setEditingZone(null);
        setName('');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update zone');
      }
    }
  );

  const deleteMutation = useMutation(
    async (id: string) => {
      await api.delete(`/zones/${id}`);
    },
    {
      onSuccess: () => {
        toast.success('Zone deleted successfully!');
        queryClient.invalidateQueries('zones');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to delete zone');
      }
    }
  );

  const handleEdit = (zone: any) => {
    setEditingZone(zone);
    setName(zone.name);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingZone) {
      updateMutation.mutate({ id: editingZone.id, name });
    } else {
      createMutation.mutate(name);
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
          <h1 className="text-3xl font-bold text-gray-900">Zones</h1>
          <p className="text-gray-600 mt-1">Manage zones</p>
        </div>
        <button
          onClick={() => {
            setEditingZone(null);
            setName('');
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          New Zone
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((zone: any) => (
          <div key={zone.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{zone.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {zone._count?.roads || 0} roads, {zone._count?.cases || 0} cases
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(zone)}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this zone?')) {
                      deleteMutation.mutate(zone.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h2 className="text-2xl font-bold">
              {editingZone ? 'Edit Zone' : 'Create Zone'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  {editingZone ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingZone(null);
                    setName('');
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
