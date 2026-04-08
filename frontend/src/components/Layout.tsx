import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
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
  ChevronRight,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

const CONTRACTOR_LOGO = '/contractor-logo.png';
const OWNER_LOGO = '/owner-logo.jpg';

const logoImg = (src: string, alt: string, className: string) => (
  <img
    src={src}
    alt={alt}
    className={className}
    onError={(e) => {
      (e.target as HTMLImageElement).style.display = 'none';
    }}
  />
);

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/cases': 'Cases',
  '/cases/new': 'New Case',
  '/users': 'Users',
  '/zones': 'Zones',
  '/roads': 'Roads',
  '/developers': 'Developers',
  '/settings': 'Settings',
};

function getBreadcrumbs(pathname: string): { path: string; label: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { path: string; label: string }[] = [{ path: '/', label: routeLabels['/'] || 'Dashboard' }];
  let acc = '';
  for (const seg of segments) {
    acc += `/${seg}`;
    const label = routeLabels[acc] || (seg === 'new' ? 'New Case' : seg.length === 36 ? 'Case' : seg);
    crumbs.push({ path: acc, label });
  }
  return crumbs;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { language, setLanguage, isRTL } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);

  const mainNav = [
    { name: t('common.dashboard'), href: '/', icon: LayoutDashboard },
    { name: t('common.cases'), href: '/cases', icon: FileText },
  ];
  const adminNav = [
    { name: t('common.users'), href: '/users', icon: Users },
    { name: t('common.zones'), href: '/zones', icon: MapPin },
    { name: t('common.roads'), href: '/roads', icon: Navigation2 },
    { name: t('common.developers'), href: '/developers', icon: Building2 },
    { name: t('common.settings'), href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isWorker = user?.role === 'WORKER';
  const breadcrumbs = getBreadcrumbs(location.pathname);

  // Worker layout: minimal header
  if (isWorker) {
    return (
      <div
        className={clsx('min-h-screen bg-[var(--color-bg)]', isRTL ? 'rtl' : 'ltr')}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center min-w-0 h-10">
            {logoImg(CONTRACTOR_LOGO, 'Contractor', 'h-8 w-auto object-contain max-w-[120px]')}
          </div>
          <div className={clsx('flex items-center gap-2 sm:gap-4 flex-1 min-w-0 justify-end', isRTL ? 'flex-row-reverse' : '')}>
            <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px] sm:max-w-none">{user?.name}</span>
            <button
              type="button"
              onClick={toggleLanguage}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              title={language === 'en' ? 'العربية' : 'English'}
              aria-label="Toggle language"
            >
              <Languages size={20} />
            </button>
            <button
              type="button"
              onClick={logout}
              className="btn btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm gap-1.5 py-2"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">{t('common.logout')}</span>
            </button>
          </div>
          <div className="flex items-center min-w-0 h-10 justify-end">
            {logoImg(OWNER_LOGO, 'Owner', 'h-8 w-auto object-contain max-w-[120px]')}
          </div>
        </header>
        <main className="p-4 sm:p-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    );
  }

  const navItems = [...mainNav, ...(user?.role === 'ADMIN' ? adminNav : [])];

  return (
    <div
      className={clsx('min-h-screen bg-[var(--color-bg)]', isRTL ? 'rtl' : 'ltr')}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-14 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">Obstacles CMS</span>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((o) => !o)}
          className="p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={clsx(
            'fixed inset-y-0 z-40 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 pt-14 lg:pt-0 lg:sticky lg:h-screen transition-all duration-200 ease-out',
            isRTL ? 'right-0 border-l' : 'left-0 border-r',
            'w-64',
            sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-64',
            mobileMenuOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full',
            'lg:translate-x-0'
          )}
        >
          <div className="flex flex-col h-full">
            <div className={clsx('hidden lg:flex items-center border-b border-gray-200 dark:border-gray-700', sidebarCollapsed ? 'justify-center h-16 px-2' : 'justify-between h-16 px-4')}>
              {!sidebarCollapsed && (
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">Obstacles CMS</span>
              )}
              <button
                type="button"
                onClick={() => setSidebarCollapsed((c) => !c)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200',
                      active
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200',
                      isRTL ? 'flex-row-reverse' : '',
                      sidebarCollapsed && 'lg:justify-center lg:px-2'
                    )}
                  >
                    <Icon size={20} className="shrink-0" />
                    {!sidebarCollapsed && <span className="flex-1 truncate">{item.name}</span>}
                    {!sidebarCollapsed && active && (
                      <ChevronRight size={16} className={clsx('shrink-0 opacity-70', isRTL ? 'rotate-180' : '')} />
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className={clsx('p-4 border-t border-gray-200 dark:border-gray-700 space-y-2', sidebarCollapsed && 'lg:p-2')}>
              <div className={clsx('px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50', sidebarCollapsed && 'lg:px-2 lg:py-2')}>
                <p className={clsx('text-sm font-medium text-gray-900 dark:text-gray-100 truncate', sidebarCollapsed && 'lg:text-center lg:text-xs')}>
                  {sidebarCollapsed ? (user?.name || 'U').charAt(0).toUpperCase() : user?.name}
                </p>
                {!sidebarCollapsed && <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>}
              </div>
              <div className={clsx('flex gap-1', sidebarCollapsed && 'lg:flex-col')}>
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className={clsx('rounded-xl text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 transition-colors', sidebarCollapsed ? 'lg:w-full lg:p-2' : 'w-full flex items-center justify-center gap-2 py-2.5 text-sm')}
                  title={language === 'en' ? 'العربية' : 'English'}
                >
                  <Languages size={18} />
                  {!sidebarCollapsed && <span>{language === 'en' ? 'English' : 'العربية'}</span>}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className={clsx('btn btn-ghost justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400', sidebarCollapsed && 'lg:px-2')}
                  title={t('common.logout')}
                >
                  <LogOut size={18} className={isRTL ? 'ml-2' : 'mr-2'} />
                  {!sidebarCollapsed && <span>{t('common.logout')}</span>}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-[2px] z-30 animate-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden
          />
        )}

        <main className="flex-1 min-w-0 pt-14 lg:pt-0">
          {/* Top bar */}
          <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.path} className="flex items-center gap-2">
                    {i > 0 && <ChevronRight size={14} className={clsx('text-gray-400', isRTL && 'rotate-180')} />}
                    {i === breadcrumbs.length - 1 ? (
                      <span className="font-medium text-gray-900 dark:text-gray-100">{crumb.label}</span>
                    ) : (
                      <Link to={crumb.path} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
              <div className="flex items-center gap-2">
                <div className="relative hidden md:block">
                  <Search size={18} className={clsx('absolute top-1/2 -translate-y-1/2 text-gray-400', isRTL ? 'right-3' : 'left-3')} />
                  <input
                    type="search"
                    placeholder={t('common.search')}
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && globalSearch.trim()) {
                        navigate(`/cases?search=${encodeURIComponent(globalSearch.trim())}`);
                      }
                    }}
                    className={clsx(
                      'input py-2 text-sm w-48 lg:w-56',
                      isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'
                    )}
                  />
                </div>
                <button
                  type="button"
                  className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((o) => !o)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-sm">
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown size={16} className="text-gray-500 hidden sm:block" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 py-1 bg-white dark:bg-gray-800 rounded-xl shadow-soft-lg border border-gray-200 dark:border-gray-700 animate-in">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
                      </div>
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Settings size={16} />
                        {t('common.settings')}
                      </Link>
                      <button
                        type="button"
                        onClick={() => { setUserMenuOpen(false); logout(); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <LogOut size={16} />
                        {t('common.logout')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2 mt-2">
              {logoImg(CONTRACTOR_LOGO, 'Contractor', 'h-8 w-auto object-contain opacity-80')}
              <span className="text-gray-300 dark:text-gray-600">|</span>
              {logoImg(OWNER_LOGO, 'Owner', 'h-8 w-auto object-contain opacity-80')}
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
