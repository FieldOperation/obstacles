import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { casesService } from '../services/supabaseService';
import { supabaseUrl } from '../lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, CheckCircle, User, FileText } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../contexts/LanguageContext';
import { format } from 'date-fns';
import { formatCaseNumber } from '../lib/caseNumber';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';

function getPhotoUrl(filename: string): string {
  if (!filename || typeof filename !== 'string') return '';
  const path = filename.trim().replace(/^\//, '').replace(/^cases\//, '');
  if (!path) return '';
  const base = supabaseUrl.replace(/\/$/, '');
  return `${base}/storage/v1/object/public/cases/${encodeURIComponent(path)}`;
}

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closureNotes, setClosureNotes] = useState('');
  const [closurePhotos, setClosurePhotos] = useState<File[]>([]);

  const { data, isLoading } = useQuery(
    ['case', id],
    async () => {
      if (!id) throw new Error('Case ID is required');
      const result = await casesService.getById(id);
      return result.case;
    }
  );

  const closeCaseMutation = useMutation(
    async () => {
      if (!id) throw new Error('Case ID is required');
      return await casesService.close(id, closureNotes, closurePhotos);
    },
    {
      onSuccess: () => {
        toast.success(t('cases.caseClosedSuccess'));
        queryClient.invalidateQueries(['case', id]);
        setShowCloseModal(false);
        setClosureNotes('');
        setClosurePhotos([]);
      },
      onError: (error: any) => {
        toast.error(error.message || t('cases.failedToClose'));
      },
    }
  );

  const handleCloseCase = () => {
    if (!closureNotes.trim()) {
      toast.error(t('cases.closureNotesRequired'));
      return;
    }
    closeCaseMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <EmptyState
          title={t('cases.caseNotFound')}
          action={
            <Link to="/cases" className="btn btn-primary">
              {t('cases.backToCases')}
            </Link>
          }
        />
      </Card>
    );
  }

  const canClose = (user?.role === 'ADMIN' || user?.role === 'WORKER') && data.status === 'OPEN';
  const photos = data.photos || [];
  const closurePhotosData = data.closure_photos || data.closurePhotos || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/cases"
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Back to cases"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="page-title">
              {t('cases.caseDetails')} — {formatCaseNumber(data.case_number ?? data.caseNumber)}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              {t('cases.zone')}: {(data.zones as any)?.name} · {t('cases.road')}: {(data.roads as any)?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={data.status === 'OPEN' ? 'open' : 'closed'}>
            {data.status === 'OPEN' ? t('common.open') : t('common.closed')}
          </Badge>
          <Badge variant={data.type === 'OBSTACLE' ? 'obstacle' : 'damage'}>
            {data.type === 'OBSTACLE' ? t('common.obstacle') : t('common.damage')}
          </Badge>
          {canClose && (
            <button
              onClick={() => setShowCloseModal(true)}
              className="btn btn-primary"
            >
              <CheckCircle size={20} className={isRTL ? 'ml-2' : 'mr-2'} />
              {t('cases.closeCase')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="section-title mb-4 flex items-center gap-2">
              <FileText size={18} />
              {t('cases.caseDetails')}
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.type')}</dt>
                <dd className="mt-1">
                  <Badge variant={data.type === 'OBSTACLE' ? 'obstacle' : 'damage'}>
                    {data.type === 'OBSTACLE' ? t('common.obstacle') : t('common.damage')}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.status')}</dt>
                <dd className="mt-1">
                  <Badge variant={data.status === 'OPEN' ? 'open' : 'closed'}>
                    {data.status === 'OPEN' ? t('common.open') : t('common.closed')}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('cases.zone')}</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100">{(data.zones as any)?.name || data.zone?.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('cases.road')}</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100">{(data.roads as any)?.name || data.road?.name}</dd>
              </div>
              {data.developers && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('cases.developer')}</dt>
                  <dd className="mt-1 text-gray-900 dark:text-gray-100">{(data.developers as any)?.name || data.developer?.name}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.created')}</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100">
                  {format(new Date(data.created_at || data.createdAt), 'PPpp')}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('cases.createdBy')}</dt>
                <dd className="mt-1 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <User size={14} className="text-gray-400" />
                  {(data.created_by as any)?.name || data.createdBy?.name}
                </dd>
              </div>
              {data.status === 'CLOSED' && (
                <>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.closed')}</dt>
                    <dd className="mt-1 text-gray-900 dark:text-gray-100">
                      {data.closed_at || data.closedAt ? format(new Date(data.closed_at || data.closedAt), 'PPpp') : 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('cases.closedBy')}</dt>
                    <dd className="mt-1 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <User size={14} className="text-gray-400" />
                      {(data.closed_by as any)?.name || data.closedBy?.name}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </Card>

          <Card>
            <h2 className="section-title mb-2">Description</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{data.description}</p>
          </Card>

          {(data.planned_work || data.plannedWork) && (
            <Card>
              <h2 className="section-title mb-2">Planned Work</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{data.planned_work || data.plannedWork}</p>
            </Card>
          )}

          {photos.length > 0 && (
            <Card>
              <h2 className="section-title mb-4">Photos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((photo: any) => {
                  const name = photo.filename ?? photo.file_name;
                  const photoUrl = photo.url || getPhotoUrl(name);
                  const linkUrl = getPhotoUrl(name) || photoUrl;
                  if (!photoUrl) return null;
                  return (
                    <a
                      key={photo.id}
                      href={linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 hover:shadow-soft transition-shadow"
                    >
                      <img
                        src={photoUrl}
                        alt="Case photo"
                        className="w-full h-32 object-cover"
                        referrerPolicy="no-referrer"
                        decoding="async"
                      />
                    </a>
                  );
                })}
              </div>
            </Card>
          )}

          {data.status === 'CLOSED' && (data.closure_notes || data.closureNotes) && (
            <Card>
              <h2 className="section-title mb-2">Closure Notes</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{data.closure_notes || data.closureNotes}</p>
            </Card>
          )}

          {data.status === 'CLOSED' && closurePhotosData.length > 0 && (
            <Card>
              <h2 className="section-title mb-4">Closure Photos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {closurePhotosData.map((photo: any) => {
                  const name = photo.filename ?? photo.file_name;
                  const photoUrl = photo.url || getPhotoUrl(name);
                  const linkUrl = getPhotoUrl(name) || photoUrl;
                  if (!photoUrl) return null;
                  return (
                    <a
                      key={photo.id}
                      href={linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 hover:shadow-soft transition-shadow"
                    >
                      <img
                        src={photoUrl}
                        alt="Closure photo"
                        className="w-full h-32 object-cover"
                        referrerPolicy="no-referrer"
                        decoding="async"
                      />
                    </a>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="section-title mb-4 flex items-center gap-2">
              <MapPin size={18} />
              {t('cases.location')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Lat: {Number(data.latitude).toFixed(6)}, Lng: {Number(data.longitude).toFixed(6)}
            </p>
            <a
              href={`https://www.google.com/maps?q=${data.latitude},${data.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary w-full"
            >
              View on Google Maps →
            </a>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title={t('cases.closeCase')}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="label">{t('cases.closureNotes')} *</label>
            <textarea
              value={closureNotes}
              onChange={(e) => setClosureNotes(e.target.value)}
              rows={4}
              className="input"
              placeholder={t('cases.closureNotesPlaceholder')}
            />
          </div>
          <div>
            <label className="label">{t('cases.closurePhotos')}</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) setClosurePhotos(Array.from(e.target.files));
              }}
              className="input py-2"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCloseCase}
              disabled={closeCaseMutation.isLoading}
              className="btn btn-primary flex-1"
            >
              {closeCaseMutation.isLoading ? t('cases.closing') : t('cases.closeCase')}
            </button>
            <button onClick={() => setShowCloseModal(false)} className="btn btn-secondary">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
