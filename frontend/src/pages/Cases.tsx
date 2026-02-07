import { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Plus, Search, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../contexts/LanguageContext';
import { format } from 'date-fns';

export default function Cases() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    zoneId: '',
    search: ''
  });
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery(
    ['cases', filters, page],
    async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const response = await api.get(`/cases?${params.toString()}`);
      return response.data;
    }
  );

  const { data: zones } = useQuery('zones', async () => {
    const response = await api.get('/zones');
    return response.data.zones;
  });

  const getStatusBadge = (status: string) => {
    return status === 'OPEN' ? (
      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
        {t('common.open')}
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
        {t('common.closed')}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === 'OBSTACLE' ? (
      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
        {t('common.obstacle')}
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
        {t('common.damage')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('cases.title')}</h1>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'WORKER') && (
          <Link to="/cases/new" className={`btn btn-primary flex items-center`}>
            <Plus size={20} className={isRTL ? 'ml-2' : 'mr-2'} />
            {t('cases.createCase')}
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className={`flex items-center mb-4`}>
          <Filter size={20} className={`${isRTL ? 'ml-2' : 'mr-2'} text-gray-600`} />
          <h2 className="text-lg font-semibold">{t('common.filter')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">{t('common.search')}</label>
            <div className="relative">
              <Search size={16} className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400`} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder={t('common.search')}
                className={`input ${isRTL ? 'pr-10' : 'pl-10'}`}
              />
            </div>
          </div>
          <div>
            <label className="label">{t('common.type')}</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="input"
            >
              <option value="">{t('dashboard.allTypes')}</option>
              <option value="OBSTACLE">{t('common.obstacle')}</option>
              <option value="DAMAGE">{t('common.damage')}</option>
            </select>
          </div>
          <div>
            <label className="label">{t('common.status')}</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="input"
            >
              <option value="">{t('common.status')}</option>
              <option value="OPEN">{t('common.open')}</option>
              <option value="CLOSED">{t('common.closed')}</option>
            </select>
          </div>
          <div>
            <label className="label">{t('common.zones')}</label>
            <select
              value={filters.zoneId}
              onChange={(e) => setFilters(prev => ({ ...prev, zoneId: e.target.value }))}
              className="input"
            >
              <option value="">{t('dashboard.allZones')}</option>
              {zones?.map((zone: any) => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cases List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('common.type')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('common.zones')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('common.roads')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('common.status')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('common.created')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.cases?.map((caseItem: any) => (
                    <tr key={caseItem.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-gray-600">
                          {caseItem.id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="py-3 px-4">{getTypeBadge(caseItem.type)}</td>
                      <td className="py-3 px-4">{caseItem.zone?.name}</td>
                      <td className="py-3 px-4">{caseItem.road?.name}</td>
                      <td className="py-3 px-4">{getStatusBadge(caseItem.status)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {format(new Date(caseItem.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/cases/${caseItem.id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data?.cases?.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No cases found
              </div>
            )}
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.pagination.total)} of {data.pagination.total} cases
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={page >= data.pagination.pages}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
