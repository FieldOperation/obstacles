import { useQuery } from 'react-query';
import { dashboardService, zonesService, roadsService, developersService, casesService } from '../services/supabaseService';
import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Filter, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton';
import { Card } from '../components/ui/Card';
import { Link } from 'react-router-dom';
import { formatCaseNumber } from '../lib/caseNumber';

const CHART_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Dashboard() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    zoneId: '',
    roadId: '',
    developerId: '',
    type: '',
  });

  const { data: stats, isLoading, error, refetch } = useQuery(
    ['dashboard-stats', filters],
    async () => {
      const filterParams: any = {};
      if (filters.startDate) filterParams.startDate = filters.startDate;
      if (filters.endDate) filterParams.endDate = filters.endDate;
      if (filters.zoneId) filterParams.zoneId = filters.zoneId;
      if (filters.roadId) filterParams.roadId = filters.roadId;
      if (filters.developerId) filterParams.developerId = filters.developerId;
      if (filters.type) filterParams.type = filters.type;
      return await dashboardService.getStats(filterParams);
    },
    { retry: 1, staleTime: 30000, refetchOnWindowFocus: false }
  );

  const { data: zones } = useQuery('zones', () => zonesService.getAll().then((r) => r.zones));
  const { data: developers } = useQuery('developers', () => developersService.getAll().then((r) => r.developers));
  const { data: roads } = useQuery('roads', () => roadsService.getAll().then((r) => r.roads));

  const { data: recentCases } = useQuery(
    ['recent-cases'],
    () => casesService.getAll({}, 1, 5).then((r) => r.cases || []),
    { enabled: !isLoading && !error }
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    try {
      const filterParams: Record<string, string> = {};
      if (filters.startDate) filterParams.startDate = filters.startDate;
      if (filters.endDate) filterParams.endDate = filters.endDate;
      if (filters.zoneId) filterParams.zoneId = filters.zoneId;
      if (filters.roadId) filterParams.roadId = filters.roadId;
      if (filters.developerId) filterParams.developerId = filters.developerId;
      if (filters.type) filterParams.type = filters.type;

      const { cases: casesList, pagination: paginationResult } = await casesService.getAll(
        filterParams as any,
        1,
        10000
      );
      const cases = casesList || [];
      const total = paginationResult?.total ?? cases.length;
      if (total > 10000) {
        toast.error(`Too many cases to export (${total}). Please apply filters.`);
        return;
      }

      const headers = [
        'ID',
        t('common.type'),
        t('common.status'),
        t('cases.zone'),
        t('cases.road'),
        t('cases.developer'),
        t('common.description'),
        t('cases.plannedWork'),
        t('cases.location'),
        t('cases.createdBy'),
        t('common.created'),
        t('cases.closedBy'),
        t('common.closed'),
      ];
      const csvRows = [headers.join(',')];
      cases.forEach((caseItem: any) => {
        const zone = caseItem.zones || caseItem.zone_id;
        const zoneName = typeof zone === 'object' && zone?.name != null ? zone.name : '';
        const road = caseItem.roads || caseItem.road_id;
        const roadName = typeof road === 'object' && road?.name != null ? road.name : '';
        const row = [
          `"${caseItem.id}"`,
          `"${caseItem.type === 'OBSTACLE' ? t('common.obstacle') : t('common.damage')}"`,
          `"${caseItem.status === 'OPEN' ? t('common.open') : t('common.closed')}"`,
          `"${zoneName}"`,
          `"${roadName}"`,
          `"${caseItem.developers?.name ?? ''}"`,
          `"${(caseItem.description || '').replace(/"/g, '""')}"`,
          `"${(caseItem.planned_work || '').replace(/"/g, '""')}"`,
          `"${caseItem.latitude}, ${caseItem.longitude}"`,
          `"${caseItem.created_by?.name ?? ''}"`,
          `"${format(new Date(caseItem.created_at), 'yyyy-MM-dd HH:mm:ss')}"`,
          `"${caseItem.closed_by?.name ?? ''}"`,
          `"${caseItem.closed_at ? format(new Date(caseItem.closed_at), 'yyyy-MM-dd HH:mm:ss') : ''}"`,
        ];
        csvRows.push(row.join(','));
      });
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(t('dashboard.exportReport') + ' ' + t('common.success'));
    } catch (err: any) {
      toast.error(t('common.error') + ': ' + (err?.message || 'Failed to export'));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="empty-state">
        <p className="empty-state-title text-red-600 dark:text-red-400">{t('dashboard.failedToLoad')}</p>
        <button onClick={() => refetch()} className="btn btn-primary mt-4">
          {t('common.retry')}
        </button>
      </Card>
    );
  }

  const casesByTypeForPie = (stats?.casesByType || []).map((item: any) => ({
    name: item.type === 'OBSTACLE' ? t('common.obstacle') : t('common.damage'),
    count: item.count,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">{t('dashboard.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('dashboard.subtitle')}</p>
        </div>
        <button onClick={handleExport} className="btn btn-secondary shrink-0">
          <Download size={18} className={isRTL ? 'ml-2' : 'mr-2'} />
          {t('dashboard.exportReport')}
        </button>
      </div>

      {/* Filters - collapsible */}
      <Card>
        <button
          type="button"
          onClick={() => setFiltersExpanded((e) => !e)}
          className="w-full flex items-center justify-between px-6 py-4 text-left"
        >
          <span className="section-title flex items-center gap-2">
            <Filter size={16} />
            {t('common.filter')}
          </span>
          {filtersExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        {filtersExpanded && (
          <div className="px-6 pb-6 pt-0 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4">
              <div>
                <label className="label">{t('dashboard.startDate')}</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">{t('dashboard.endDate')}</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">{t('common.zones')}</label>
                <select
                  value={filters.zoneId}
                  onChange={(e) => handleFilterChange('zoneId', e.target.value)}
                  className="input"
                >
                  <option value="">{t('dashboard.allZones')}</option>
                  {zones?.map((zone: any) => (
                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t('common.roads')}</label>
                <select
                  value={filters.roadId}
                  onChange={(e) => handleFilterChange('roadId', e.target.value)}
                  className="input"
                >
                  <option value="">{t('dashboard.allRoads') || 'All Roads'}</option>
                  {roads?.map((road: any) => (
                    <option key={road.id} value={road.id}>{road.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t('common.developers')}</label>
                <select
                  value={filters.developerId}
                  onChange={(e) => handleFilterChange('developerId', e.target.value)}
                  className="input"
                >
                  <option value="">{t('dashboard.allDevelopers')}</option>
                  {developers?.map((dev: any) => (
                    <option key={dev.id} value={dev.id}>{dev.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t('common.type')}</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="input"
                >
                  <option value="">{t('dashboard.allTypes')}</option>
                  <option value="OBSTACLE">{t('common.obstacle')}</option>
                  <option value="DAMAGE">{t('common.damage')}</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() =>
                    setFilters({
                      startDate: '',
                      endDate: '',
                      zoneId: '',
                      roadId: '',
                      developerId: '',
                      type: '',
                    })
                  }
                  className="btn btn-secondary w-full"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-hover transition-shadow duration-200">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            {t('dashboard.openCases')} + {t('dashboard.closedCases')}
          </p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats?.totalCases ?? 0}</p>
        </Card>
        <Card className="border-l-4 border-l-amber-400 dark:border-l-amber-500 hover:shadow-hover transition-shadow duration-200">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            {t('dashboard.openCases')}
          </p>
          <p className="text-2xl font-semibold text-amber-700 dark:text-amber-400">{stats?.openCases ?? 0}</p>
        </Card>
        <Card className="border-l-4 border-l-emerald-400 dark:border-l-emerald-500 hover:shadow-hover transition-shadow duration-200">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            {t('dashboard.closedCases')}
          </p>
          <p className="text-2xl font-semibold text-emerald-700 dark:text-emerald-400">{stats?.closedCases ?? 0}</p>
        </Card>
        <Card className="border-l-4 border-l-primary-500 hover:shadow-hover transition-shadow duration-200">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            SLA Breaches
          </p>
          <p className="text-2xl font-semibold text-primary-700 dark:text-primary-400">—</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="section-title mb-4">{t('dashboard.casesByZone')}</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats?.casesByZone || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                <XAxis dataKey="zoneName" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                  }}
                />
                <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h2 className="section-title mb-4">{t('dashboard.casesOverTime')}</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={stats?.casesOverTime || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="created" stroke="#4F46E5" name={t('common.created')} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="closed" stroke="#10B981" name={t('common.closed')} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="section-title mb-4">{t('dashboard.casesByType')}</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={casesByTypeForPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(casesByTypeForPie || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h2 className="section-title mb-4">Recent Activity</h2>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {recentCases?.length ? (
                recentCases.map((c: any) => (
                  <li key={c.id}>
                    <Link
                      to={`/cases/${c.id}`}
                      className="flex items-center justify-between gap-2 py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {formatCaseNumber(c.case_number ?? c.caseNumber)} · {(c.zones as any)?.name || '—'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                        {format(new Date(c.created_at || c.createdAt), 'MMM d')}
                      </span>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No recent cases
                </li>
              )}
            </ul>
            <Link
              to="/cases"
              className="mt-3 block text-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              View all cases →
            </Link>
          </Card>
        </div>
      </div>

      {(stats?.casesByDeveloper?.length ?? 0) > 0 && (
        <Card>
          <h2 className="section-title mb-4">{t('dashboard.casesByDeveloper')}</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats!.casesByDeveloper}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
              <XAxis dataKey="developerName" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '10px',
                  border: '1px solid var(--color-border)',
                }}
              />
              <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
