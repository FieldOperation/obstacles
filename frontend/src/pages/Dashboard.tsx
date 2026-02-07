import { useQuery } from 'react-query';
import { api } from '../services/api';
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
  Cell
} from 'recharts';
import { Calendar, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    zoneId: '',
    roadId: '',
    developerId: '',
    type: ''
  });

  const { data: stats, isLoading, error, refetch } = useQuery(
    ['dashboard-stats', filters],
    async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const response = await api.get(`/dashboard/stats?${params.toString()}`);
      return response.data;
    },
    {
      retry: 1,
      staleTime: 30000, // Cache for 30 seconds
      refetchOnWindowFocus: false
    }
  );

  const { data: zones } = useQuery('zones', async () => {
    const response = await api.get('/zones');
    return response.data.zones;
  });

  const { data: developers } = useQuery('developers', async () => {
    const response = await api.get('/developers');
    return response.data.developers;
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    try {
      // Fetch all cases with current filters for export
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      // Use a high limit to get all cases (backend max is 10000)
      params.append('limit', '10000');
      params.append('page', '1'); // Start from page 1
      
      const response = await api.get(`/cases?${params.toString()}`);
      const cases = response.data.cases || [];
      
      // If there are more cases, fetch them in batches
      const total = response.data.pagination?.total || cases.length;
      if (total > 10000) {
        toast.error(`Too many cases to export (${total}). Please apply filters to reduce the number.`);
        return;
      }

      // Prepare CSV data
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
        t('common.closed')
      ];

      const csvRows = [
        headers.join(',')
      ];

      cases.forEach((caseItem: any) => {
        const row = [
          `"${caseItem.id}"`,
          `"${caseItem.type === 'OBSTACLE' ? t('common.obstacle') : t('common.damage')}"`,
          `"${caseItem.status === 'OPEN' ? t('common.open') : t('common.closed')}"`,
          `"${caseItem.zone?.name || ''}"`,
          `"${caseItem.road?.name || ''}"`,
          `"${caseItem.developer?.name || ''}"`,
          `"${(caseItem.description || '').replace(/"/g, '""')}"`,
          `"${(caseItem.plannedWork || '').replace(/"/g, '""')}"`,
          `"${caseItem.latitude}, ${caseItem.longitude}"`,
          `"${caseItem.createdBy?.name || ''}"`,
          `"${format(new Date(caseItem.createdAt), 'yyyy-MM-dd HH:mm:ss')}"`,
          `"${caseItem.closedBy?.name || ''}"`,
          `"${caseItem.closedAt ? format(new Date(caseItem.closedAt), 'yyyy-MM-dd HH:mm:ss') : ''}"`
        ];
        csvRows.push(row.join(','));
      });

      // Create CSV content
      const csvContent = csvRows.join('\n');
      
      // Add BOM for UTF-8 to support Arabic characters in Excel
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      link.download = `dashboard-export-${dateStr}.csv`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(t('dashboard.exportReport') + ' ' + t('common.success'));
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(t('common.error') + ': ' + (error.response?.data?.error || 'Failed to export data'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{t('dashboard.failedToLoad')}</p>
          <button onClick={() => refetch()} className="btn btn-primary">
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-600 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <button onClick={handleExport} className={`btn btn-secondary flex items-center`}>
          <Download size={16} className={isRTL ? 'ml-2' : 'mr-2'} />
          {t('dashboard.exportReport')}
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className={`flex items-center mb-4`}>
          <Filter size={20} className={`${isRTL ? 'ml-2' : 'mr-2'} text-gray-600`} />
          <h2 className="text-lg font-semibold">{t('common.filter')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
              onClick={() => setFilters({
                startDate: '',
                endDate: '',
                zoneId: '',
                roadId: '',
                developerId: '',
                type: ''
              })}
              className="btn btn-secondary w-full"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">{t('dashboard.openCases')} + {t('dashboard.closedCases')}</div>
          <div className="text-3xl font-bold text-gray-900">{stats?.totalCases || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">{t('dashboard.openCases')}</div>
          <div className="text-3xl font-bold text-red-600">{stats?.openCases || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">{t('dashboard.closedCases')}</div>
          <div className="text-3xl font-bold text-green-600">{stats?.closedCases || 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">{t('dashboard.avgResolutionTime')}</div>
          <div className="text-3xl font-bold text-primary-600">
            {stats?.averageResolutionTimeHours
              ? `${Math.round(stats.averageResolutionTimeHours)} ${t('dashboard.hours')}`
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cases by Zone */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{t('dashboard.casesByZone')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.casesByZone || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="zoneName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cases by Type */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{t('dashboard.casesByType')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats?.casesByType || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {(stats?.casesByType || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Cases Over Time */}
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">{t('dashboard.casesOverTime')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.casesOverTime || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'MMM dd')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
              />
              <Legend />
              <Line type="monotone" dataKey="created" stroke="#0ea5e9" name={t('common.created')} />
              <Line type="monotone" dataKey="closed" stroke="#10b981" name={t('common.closed')} />
              <Line type="monotone" dataKey="obstacle" stroke="#f59e0b" name={t('common.obstacle')} />
              <Line type="monotone" dataKey="damage" stroke="#ef4444" name={t('common.damage')} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cases by Developer */}
        {stats?.casesByDeveloper?.length > 0 && (
          <div className="card lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">{t('dashboard.casesByDeveloper')}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.casesByDeveloper}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="developerName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
