import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { roadsService, zonesService } from '../services/supabaseService';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Navigation2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonTable } from '../components/ui/Skeleton';

export default function Roads() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingRoad, setEditingRoad] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [formData, setFormData] = useState({ name: '', zoneId: '' });

  const { data, isLoading } = useQuery('roads', () => roadsService.getAll().then((r) => r.roads));
  const { data: zones } = useQuery('zones', () => zonesService.getAll().then((r) => r.zones));

  const createMutation = useMutation(
    (data: { name: string; zoneId: string }) => roadsService.create({ name: data.name, zoneId: data.zoneId }),
    {
      onSuccess: () => {
        toast.success('Road created successfully!');
        queryClient.invalidateQueries('roads');
        setShowModal(false);
        resetForm();
      },
      onError: (err: any) => { toast.error(err.message || 'Failed to create road'); },
    }
  );
  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: { name: string; zoneId?: string } }) => roadsService.update(id, { name: data.name, zoneId: data.zoneId }),
    {
      onSuccess: () => {
        toast.success('Road updated successfully!');
        queryClient.invalidateQueries('roads');
        setShowModal(false);
        setEditingRoad(null);
        resetForm();
      },
      onError: (err: any) => { toast.error(err.message || 'Failed to update road'); },
    }
  );
  const deleteMutation = useMutation(
    (id: string) => roadsService.delete(id),
    {
      onSuccess: () => {
        toast.success('Road deleted successfully!');
        queryClient.invalidateQueries('roads');
        setDeleteTarget(null);
      },
      onError: (err: any) => { toast.error(err.message || 'Failed to delete road'); },
    }
  );

  const resetForm = () => setFormData({ name: '', zoneId: '' });
  const handleEdit = (road: any) => {
    setEditingRoad(road);
    setFormData({ name: road.name, zoneId: road.zone_id || road.zoneId });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoad) updateMutation.mutate({ id: editingRoad.id, data: formData });
    else createMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Roads</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage roads by zone</p>
        </div>
        <SkeletonTable rows={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Roads</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage roads by zone</p>
        </div>
        <button onClick={() => { setEditingRoad(null); resetForm(); setShowModal(true); }} className="btn btn-primary shrink-0">
          <Plus size={20} className="mr-2" />
          New Road
        </button>
      </div>

      {data?.length ? (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Zone</th>
                <th>Cases</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((road: any) => (
                <tr key={road.id}>
                  <td className="font-medium text-gray-900 dark:text-gray-100">{road.name}</td>
                  <td className="text-gray-600 dark:text-gray-400">{(road.zones as any)?.name || road.zone?.name}</td>
                  <td className="text-gray-600 dark:text-gray-400">{road._count?.cases || 0}</td>
                  <td className="text-right">
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => handleEdit(road)} className="btn btn-ghost p-2 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20" aria-label="Edit">
                        <Edit size={18} />
                      </button>
                      <button type="button" onClick={() => setDeleteTarget({ id: road.id, name: road.name })} className="btn btn-ghost p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" aria-label="Delete">
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
          <EmptyState icon={Navigation2} title="No roads yet" description="Create a road to get started." />
        </Card>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingRoad(null); resetForm(); }} title={editingRoad ? 'Edit Road' : 'Create Road'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Zone *</label>
            <select value={formData.zoneId} onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })} required className="input">
              <option value="">Select zone</option>
              {zones?.map((zone: any) => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="input" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn btn-primary flex-1" disabled={createMutation.isLoading || updateMutation.isLoading}>
              {editingRoad ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => { setShowModal(false); setEditingRoad(null); resetForm(); }} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete road"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"?` : ''}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isLoading}
      />
    </div>
  );
}
