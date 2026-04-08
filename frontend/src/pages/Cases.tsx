import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { casesService, zonesService, developersService } from '../services/supabaseService';
import { Plus, Search, Filter, FileText, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../contexts/LanguageContext';
import { format } from 'date-fns';
import { formatCaseNumber } from '../lib/caseNumber';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonTable } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

const PAGE_SIZE = 20;

export default function Cases() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    zoneId: '',
    developerId: '',
    search: searchParams.get('search') || '',
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q != null) setFilters((prev) => ({ ...prev, search: q || '' }));
  }, [searchParams]);

  const { data, isLoading } = useQuery(
    ['cases', filters, page],
    async () => {
      const filterParams: any = {};
      if (filters.type) filterParams.type = filters.type;
      if (filters.status) filterParams.status = filters.status;
      if (filters.zoneId) filterParams.zoneId = filters.zoneId;
      if (filters.developerId) filterParams.developerId = filters.developerId;
      if (filters.search.trim()) filterParams.search = filters.search.trim();
      return await casesService.getAll(filterParams, page, PAGE_SIZE);
    }
  );

  const { data: zones } = useQuery('zones', () => zonesService.getAll().then((r) => r.zones));
  const { data: developers } = useQuery('developers', () => developersService.getAll().then((r) => r.developers));

  const total = data?.pagination?.total ?? 0;
  const pages = data?.pagination?.pages ?? 1;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const handleExport = async () => {
    try {
      const filterParams: any = {};
      if (filters.type) filterParams.type = filters.type;
      if (filters.status) filterParams.status = filters.status;
      if (filters.zoneId) filterParams.zoneId = filters.zoneId;
      if (filters.developerId) filterParams.developerId = filters.developerId;
      if (filters.search.trim()) filterParams.search = filters.search.trim();
      const { cases: list, pagination: p } = await casesService.getAll(filterParams, 1, 10000);
      const cases = list || [];
      const totalExport = p?.total ?? cases.length;
      if (totalExport > 10000) {
        toast.error('Too many cases to export. Apply filters.');
        return;
      }
      const headers = ['Case #', t('common.type'), t('common.status'), t('cases.zone'), t('cases.road'), t('cases.developer'), t('common.created')];
      const csvRows = [headers.join(',')];
      cases.forEach((c: any) => {
        const zoneName = (c.zones as any)?.name || '';
        const roadName = (c.roads as any)?.name || '';
        const devName = (c.developers as any)?.name || '';
        csvRows.push([
          `"${formatCaseNumber(c.case_number ?? c.caseNumber)}"`,
          `"${c.type === 'OBSTACLE' ? t('common.obstacle') : t('common.damage')}"`,
          `"${c.status === 'OPEN' ? t('common.open') : t('common.closed')}"`,
          `"${zoneName}"`,
          `"${roadName}"`,
          `"${devName}"`,
          `"${format(new Date(c.created_at || c.createdAt), 'yyyy-MM-dd')}"`,
        ].join(','));
      });
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cases-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(t('common.success'));
    } catch (err: any) {
      toast.error(err?.message || 'Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">{t('cases.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage and track all cases</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn btn-secondary shrink-0">
            <Download size={18} className={isRTL ? 'ml-2' : 'mr-2'} />
            {t('common.export')}
          </button>
          {(user?.role === 'ADMIN' || user?.role === 'WORKER') && (
            <Link to="/cases/new" className="btn btn-primary shrink-0">
              <Plus size={20} className={isRTL ? 'ml-2' : 'mr-2'} />
              {t('cases.createCase')}
            </Link>
          )}
        </div>
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <p className="section-title flex items-center gap-2">
            <Filter size={16} />
            {t('common.filter')}
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 relative">
              <Search size={18} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none ${isRTL ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder={t('common.search')}
                className={`input py-2.5 ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'}`}
              />
            </div>
            <div>
              <label className="label">{t('common.type')}</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                className="input py-2.5"
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
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="input py-2.5"
              >
                <option value="">All</option>
                <option value="OPEN">{t('common.open')}</option>
                <option value="CLOSED">{t('common.closed')}</option>
              </select>
            </div>
            <div>
              <label className="label">{t('common.zones')}</label>
              <select
                value={filters.zoneId}
                onChange={(e) => setFilters((prev) => ({ ...prev, zoneId: e.target.value }))}
                className="input py-2.5"
              >
                <option value="">{t('dashboard.allZones')}</option>
                {zones?.map((zone: any) => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('common.developers')}</label>
              <select
                value={filters.developerId}
                onChange={(e) => setFilters((prev) => ({ ...prev, developerId: e.target.value }))}
                className="input py-2.5"
              >
                <option value="">All</option>
                {developers?.map((dev: any) => (
                  <option key={dev.id} value={dev.id}>{dev.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <SkeletonTable rows={10} />
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th className={isRTL ? 'text-right' : 'text-left'}>Case #</th>
                  <th className={isRTL ? 'text-right' : 'text-left'}>{t('common.type')}</th>
                  <th className={isRTL ? 'text-right' : 'text-left'}>{t('common.zones')}</th>
                  <th className={isRTL ? 'text-right' : 'text-left'}>{t('common.roads')}</th>
                  <th className={isRTL ? 'text-right' : 'text-left'}>{t('common.status')}</th>
                  <th className={isRTL ? 'text-right' : 'text-left'}>{t('common.created')}</th>
                  <th className={isRTL ? 'text-left' : 'text-right'}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data?.cases?.map((caseItem: any) => (
                  <tr key={caseItem.id}>
                    <td className="text-gray-900 dark:text-gray-100 font-medium text-sm">
                      {formatCaseNumber(caseItem.case_number ?? caseItem.caseNumber)}
                    </td>
                    <td>
                      <Badge variant={caseItem.type === 'OBSTACLE' ? 'obstacle' : 'damage'}>
                        {caseItem.type === 'OBSTACLE' ? t('common.obstacle') : t('common.damage')}
                      </Badge>
                    </td>
                    <td className="text-gray-700 dark:text-gray-300">{(caseItem.zones as any)?.name || caseItem.zone?.name || '—'}</td>
                    <td className="text-gray-700 dark:text-gray-300">{(caseItem.roads as any)?.name || caseItem.road?.name || '—'}</td>
                    <td>
                      <Badge variant={caseItem.status === 'OPEN' ? 'open' : 'closed'}>
                        {caseItem.status === 'OPEN' ? t('common.open') : t('common.closed')}
                      </Badge>
                    </td>
                    <td className="text-gray-600 dark:text-gray-400 text-sm">
                      {format(new Date(caseItem.created_at || caseItem.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className={isRTL ? 'text-left' : 'text-right'}>
                      <Link
                        to={`/cases/${caseItem.id}`}
                        className="link inline-flex items-center gap-1 text-sm"
                      >
                        View
                        <span aria-hidden>→</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data?.cases?.length === 0 && (
            <Card>
              <EmptyState
                icon={FileText}
                title="No cases found"
                description={
                  filters.type || filters.status || filters.zoneId || filters.developerId || filters.search
                    ? 'Try adjusting your filters.'
                    : 'Create a case to get started.'
                }
                action={
                  !filters.type && !filters.status && !filters.zoneId && !filters.developerId && !filters.search &&
                  (user?.role === 'ADMIN' || user?.role === 'WORKER') ? (
                    <Link to="/cases/new" className="btn btn-primary">
                      <Plus size={18} className={isRTL ? 'ml-2' : 'mr-2'} />
                      {t('cases.createCase')}
                    </Link>
                  ) : null
                }
              />
            </Card>
          )}

          {pages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-medium text-gray-700 dark:text-gray-300">{from}</span>–<span className="font-medium text-gray-700 dark:text-gray-300">{to}</span> of <span className="font-medium text-gray-700 dark:text-gray-300">{total}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary text-sm gap-1"
                >
                  <ChevronLeft size={18} />
                  {t('common.previous')}
                </button>
                <span className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {pages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pages}
                  className="btn btn-secondary text-sm gap-1"
                >
                  {t('common.next')}
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
