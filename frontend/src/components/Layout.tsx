import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  MapPin, 
  Navigation2, 
  Building2,
  LogOut,
  Menu,
  X,
  Languages,
  Settings
} from 'lucide-react';
import { useState } from 'react';
import { useQuery } from 'react-query';
import { api } from '../services/api';

export default function Layout() {
  const { user, logout } = useAuth();
  const { language, setLanguage, isRTL } = useLanguage();
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch settings for logos
  const { data: settings } = useQuery('settings', async () => {
    const response = await api.get('/settings');
    return response.data.settings;
  }, {
    enabled: !!user, // Only fetch when user is logged in
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const navigation = [
    { name: t('common.dashboard'), href: '/', icon: LayoutDashboard },
    { name: t('common.cases'), href: '/cases', icon: FileText },
    ...(user?.role === 'ADMIN' ? [
      { name: t('common.users'), href: '/users', icon: Users },
      { name: t('common.zones'), href: '/zones', icon: MapPin },
      { name: t('common.roads'), href: '/roads', icon: Navigation2 },
      { name: t('common.developers'), href: '/developers', icon: Building2 },
      { name: 'Settings', href: '/settings', icon: Settings },
    ] : []),
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary-600">Obstacles CMS</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            mobileMenuOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 ${isRTL ? 'right-0 border-l' : 'left-0 border-r'} z-40 w-64 bg-white border-gray-200 transition-transform duration-300 ease-in-out lg:transition-none pt-16 lg:pt-0`}
        >
          <div className="h-full flex flex-col">
            <div className="hidden lg:flex items-center justify-center h-16 border-b border-gray-200">
              <h1 className="text-xl font-bold text-primary-600">Obstacles CMS</h1>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} className={isRTL ? 'ml-3' : 'mr-3'} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="px-4 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              </div>
              
              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mb-2"
                title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
              >
                <Languages size={16} className={isRTL ? 'ml-2' : 'mr-2'} />
                <span>{language === 'en' ? 'English' : 'العربية'}</span>
              </button>

              <button
                onClick={logout}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={16} className={isRTL ? 'ml-2' : 'mr-2'} />
                {t('common.logout')}
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-0 pt-16 lg:pt-0">
          {/* Header with logos */}
          {(settings?.contractorLogoUrl || settings?.ownerLogoUrl) && (
            <div className={`bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="flex items-center gap-4">
                {settings?.contractorLogoUrl && (
                  <img
                    src={settings.contractorLogoUrl}
                    alt="Contractor Logo"
                    className="h-12 object-contain"
                  />
                )}
              </div>
              <div className="flex items-center gap-4">
                {settings?.ownerLogoUrl && (
                  <img
                    src={settings.ownerLogoUrl}
                    alt="Owner Logo"
                    className="h-12 object-contain"
                  />
                )}
              </div>
            </div>
          )}
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
