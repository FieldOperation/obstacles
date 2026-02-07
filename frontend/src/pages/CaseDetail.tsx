import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, Camera, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../contexts/LanguageContext';
import { format } from 'date-fns';

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
      const response = await api.get(`/cases/${id}`);
      return response.data.case;
    }
  );

  const closeCaseMutation = useMutation(
    async (formData: FormData) => {
      const response = await api.post(`/cases/${id}/close`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success(t('cases.caseClosedSuccess'));
        queryClient.invalidateQueries(['case', id]);
        setShowCloseModal(false);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || t('cases.failedToClose'));
      }
    }
  );

  const handleCloseCase = () => {
    if (!closureNotes.trim()) {
      toast.error(t('cases.closureNotesRequired'));
      return;
    }

    const formData = new FormData();
    formData.append('closureNotes', closureNotes);
    closurePhotos.forEach(photo => {
      formData.append('closurePhotos', photo);
    });

    closeCaseMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{t('cases.caseNotFound')}</p>
        <Link to="/cases" className="text-primary-600 hover:text-primary-700 mt-4 inline-block">
          {t('cases.backToCases')}
        </Link>
      </div>
    );
  }

  const canClose = (user?.role === 'ADMIN' || user?.role === 'WORKER') && data.status === 'OPEN';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/cases" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{t('cases.caseDetails')}</h1>
          <p className="text-gray-600 mt-1">{t('cases.caseId')}: {data.id.slice(0, 8)}...</p>
        </div>
        {canClose && (
          <button
            onClick={() => setShowCloseModal(true)}
            className={`btn btn-primary flex items-center`}
          >
            <CheckCircle size={20} className={isRTL ? 'ml-2' : 'mr-2'} />
            {t('cases.closeCase')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{t('cases.caseDetails')}</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('common.type')}</dt>
              <dd className="mt-1">
                {data.type === 'OBSTACLE' ? (
                  <span className="px-2 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    {t('common.obstacle')}
                  </span>
                ) : (
                  <span className="px-2 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                    {t('common.damage')}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('common.status')}</dt>
              <dd className="mt-1">
                {data.status === 'OPEN' ? (
                  <span className="px-2 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">
                    {t('common.open')}
                  </span>
                ) : (
                  <span className="px-2 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                    {t('common.closed')}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('cases.zone')}</dt>
              <dd className="mt-1 text-gray-900">{data.zone?.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('cases.road')}</dt>
              <dd className="mt-1 text-gray-900">{data.road?.name}</dd>
            </div>
            {data.developer && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{t('cases.developer')}</dt>
                <dd className="mt-1 text-gray-900">{data.developer.name}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('common.created')}</dt>
              <dd className="mt-1 text-gray-900">
                {format(new Date(data.createdAt), 'PPpp')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('cases.createdBy')}</dt>
              <dd className="mt-1 text-gray-900">{data.createdBy?.name}</dd>
            </div>
            {data.status === 'CLOSED' && (
              <>
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t('common.closed')}</dt>
                  <dd className="mt-1 text-gray-900">
                    {data.closedAt ? format(new Date(data.closedAt), 'PPpp') : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">{t('cases.closedBy')}</dt>
                  <dd className="mt-1 text-gray-900">{data.closedBy?.name}</dd>
                </div>
              </>
            )}
          </dl>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{t('cases.location')}</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <MapPin size={16} />
            <span>Lat: {data.latitude.toFixed(6)}, Lng: {data.longitude.toFixed(6)}</span>
          </div>
          <a
            href={`https://www.google.com/maps?q=${data.latitude},${data.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            View on Google Maps →
          </a>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Description</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{data.description}</p>
      </div>

      {data.plannedWork && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Planned Work</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{data.plannedWork}</p>
        </div>
      )}

      {data.photos && data.photos.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Photos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.photos.map((photo: any) => (
              <a
                key={photo.id}
                href={`http://localhost:3001/uploads/cases/${photo.filename}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={`http://localhost:3001/uploads/cases/${photo.filename}`}
                  alt="Case photo"
                  className="w-full h-32 object-cover rounded-lg hover:opacity-80 transition-opacity"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {data.status === 'CLOSED' && (
        <>
          {data.closureNotes && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Closure Notes</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{data.closureNotes}</p>
            </div>
          )}

          {data.closurePhotos && data.closurePhotos.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Closure Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.closurePhotos.map((photo: any) => (
                  <a
                    key={photo.id}
                    href={`http://localhost:3001/uploads/cases/${photo.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={`http://localhost:3001/uploads/cases/${photo.filename}`}
                      alt="Closure photo"
                      className="w-full h-32 object-cover rounded-lg hover:opacity-80 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Close Case Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4">
            <h2 className="text-2xl font-bold">{t('cases.closeCase')}</h2>
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
                  if (e.target.files) {
                    setClosurePhotos(Array.from(e.target.files));
                  }
                }}
                className="input"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleCloseCase}
                disabled={closeCaseMutation.isLoading}
                className="btn btn-primary flex-1"
              >
                {closeCaseMutation.isLoading ? t('cases.closing') : t('cases.closeCase')}
              </button>
              <button
                onClick={() => setShowCloseModal(false)}
                className="btn btn-secondary"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
