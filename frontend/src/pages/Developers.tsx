import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { developersService, casesService } from '../services/supabaseService';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, FileText, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

export default function Developers() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingDeveloper, setEditingDeveloper] = useState<any>(null);
  const [name, setName] = useState('');
  const [expandedDeveloperId, setExpandedDeveloperId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery('developers', () => developersService.getAll().then((r) => r.developers));
  const { data: linkedCases, isLoading: casesLoading } = useQuery(
    ['cases', 'developer', expandedDeveloperId],
    () => (expandedDeveloperId ? casesService.getAll({ developerId: expandedDeveloperId }, 1, 100) : Promise.resolve({ cases: [], pagination: { page: 1, limit: 100, total: 0, pages: 0 } })),
    { enabled: !!expandedDeveloperId }
  );

  const createMutation = useMutation(
    (name: string) => developersService.create({ name }),
    {
      onSuccess: () => {
        toast.success('Developer created successfully!');
        queryClient.invalidateQueries('developers');
        setShowModal(false);
        setName('');
      },
      onError: (err: any) => { toast.error(err.message || 'Failed to create developer'); },
    }
  );
  const updateMutation = useMutation(
    ({ id, name }: { id: string; name: string }) => developersService.update(id, { name }),
    {
      onSuccess: () => {
        toast.success('Developer updated successfully!');
        queryClient.invalidateQueries('developers');
        setShowModal(false);
        setEditingDeveloper(null);
        setName('');
      },
      onError: (err: any) => { toast.error(err.message || 'Failed to update developer'); },
    }
  );
  const deleteMutation = useMutation(
    (id: string) => developersService.delete(id),
    {
      onSuccess: () => {
        toast.success('Developer deleted successfully!');
        queryClient.invalidateQueries('developers');
        setDeleteTarget(null);
      },
      onError: (err: any) => { toast.error(err.message || 'Failed to delete developer'); },
    }
  );

  const handleEdit = (developer: any) => {
    setEditingDeveloper(developer);
    setName(developer.name);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDeveloper) updateMutation.mutate({ id: editingDeveloper.id, name });
    else createMutation.mutate(name);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Developers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage real-estate developers</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Developers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage real-estate developers</p>
        </div>
        <button onClick={() => { setEditingDeveloper(null); setName(''); setShowModal(true); }} className="btn btn-primary shrink-0">
          <Plus size={20} className="mr-2" />
          New Developer
        </button>
      </div>

      {data?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((developer: any) => {
            const isExpanded = expandedDeveloperId === developer.id;
            const caseCount = developer._count?.cases || 0;
            const cases = isExpanded ? (linkedCases?.cases || []) : [];
            const loadingCases = isExpanded && casesLoading;
            return (
              <Card key={developer.id}>
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{developer.name}</h3>
                    <button
                      type="button"
                      onClick={() => setExpandedDeveloperId(isExpanded ? null : developer.id)}
                      className="flex items-center gap-1.5 mt-1 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {caseCount} cases
                      {caseCount > 0 && (isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </button>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => handleEdit(developer)} className="btn btn-ghost p-2 rounded-lg text-primary-600" aria-label="Edit">
                      <Edit size={18} />
                    </button>
                    <button type="button" onClick={() => setDeleteTarget({ id: developer.id, name: developer.name })} className="btn btn-ghost p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" aria-label="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {loadingCases ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : cases.length === 0 ? (
                      <div className="flex flex-col items-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                        <FileText size={24} className="mb-2 opacity-50" />
                        No cases linked
                      </div>
                    ) : (
                      <ul className="space-y-2 max-h-48 overflow-y-auto">
                        {cases.map((c: any) => (
                          <li key={c.id}>
                            <Link
                              to={`/cases/${c.id}`}
                              className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-sm transition-colors"
                            >
                              <span className="truncate text-gray-700 dark:text-gray-300">
                                {c.type} · {(c.zones as any)?.name || '—'} · {(c.roads as any)?.name || '—'} · {c.status}
                              </span>
                              <span className="text-gray-400 shrink-0 text-xs">{format(new Date(c.created_at), 'MMM d')}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState icon={Building2} title="No developers yet" description="Create a developer to get started." />
        </Card>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingDeveloper(null); setName(''); }} title={editingDeveloper ? 'Edit Developer' : 'Create Developer'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn btn-primary flex-1" disabled={createMutation.isLoading || updateMutation.isLoading}>
              {editingDeveloper ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => { setShowModal(false); setEditingDeveloper(null); setName(''); }} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete developer"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"?` : ''}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isLoading}
      />
    </div>
  );
}
