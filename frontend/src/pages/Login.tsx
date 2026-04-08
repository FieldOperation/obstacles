import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import toast from 'react-hot-toast';
import { LogIn } from 'lucide-react';

export default function Login() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate(user.role === 'WORKER' ? '/cases' : '/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success(t('login.loginSuccessful'));
    } catch (error: any) {
      toast.error(error.message || t('login.loginFailed'));
      setLoading(false);
    }
  };

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 border-2 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">{t('login.signingIn')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="card p-8 shadow-soft-lg animate-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-6">
              <LogIn size={32} strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
              {t('login.title')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              {t('login.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="label">
                {t('login.username')}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="input"
                placeholder={t('login.usernamePlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="password" className="label">
                {t('common.password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="input"
                placeholder={t('login.passwordPlaceholder')}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3 rounded-xl text-base"
            >
              {loading ? t('login.signingIn') : t('login.signIn')}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {t('login.manualLoginNote')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
              {t('login.manualLoginHint')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
