import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import toast from 'react-hot-toast';
import { LogIn } from 'lucide-react';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success(t('login.loginSuccessful'));
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || t('login.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full">
        <div className="card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <LogIn className="text-primary-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('login.title')}
            </h1>
            <p className="text-gray-600">{t('login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="label">
                {t('login.emailAddress')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder={t('login.emailPlaceholder')}
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
                className="input"
                placeholder={t('login.passwordPlaceholder')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3"
            >
              {loading ? t('login.signingIn') : t('login.signIn')}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">{t('login.demoCredentials')}:</p>
            <div className="text-xs space-y-1">
              <p><strong>{t('login.admin')}:</strong> admin@example.com / password123</p>
              <p><strong>{t('login.worker')}:</strong> worker@example.com / password123</p>
              <p><strong>{t('login.others')}:</strong> others@example.com / password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
