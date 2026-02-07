import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function Developers() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingDeveloper, setEditingDeveloper] = useState<any>(null);
  const [name, setName] = useState('');

  const { data, isLoading } = useQuery('developers', async () => {
    const response = await api.get('/developers');
    return response.data.developers;
  });

  const createMutation = useMutation(
    async (name: string) => {
      const response = await api.post('/developers', { name });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Developer created successfully!');
        queryClient.invalidateQueries('developers');
        setShowModal(false);
        setName('');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create developer');
      }
    }
  );

  const updateMutation = useMutation(
    async ({ id, name }: { id: string; name: string }) => {
      const response = await api.put(`/developers/${id}`, { name });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Developer updated successfully!');
        queryClient.invalidateQueries('developers');
        setShowModal(false);
        setEditingDeveloper(null);
        setName('');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update developer');
      }
    }
  );

  const deleteMutation = useMutation(
    async (id: string) => {
      await api.delete(`/developers/${id}`);
    },
    {
      onSuccess: () => {
        toast.success('Developer deleted successfully!');
        queryClient.invalidateQueries('developers');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to delete developer');
      }
    }
  );

  const handleEdit = (developer: any) => {
    setEditingDeveloper(developer);
    setName(developer.name);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDeveloper) {
      updateMutation.mutate({ id: editingDeveloper.id, name });
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
          <h1 className="text-3xl font-bold text-gray-900">Developers</h1>
          <p className="text-gray-600 mt-1">Manage real-estate developers</p>
        </div>
        <button
          onClick={() => {
            setEditingDeveloper(null);
            setName('');
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          New Developer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((developer: any) => (
          <div key={developer.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{developer.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {developer._count?.cases || 0} cases
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(developer)}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this developer?')) {
                      deleteMutation.mutate(developer.id);
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
              {editingDeveloper ? 'Edit Developer' : 'Create Developer'}
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
                  {editingDeveloper ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingDeveloper(null);
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
