import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import CreateCase from './pages/CreateCase';
import Users from './pages/Users';
import Zones from './pages/Zones';
import Roads from './pages/Roads';
import Developers from './pages/Developers';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import { SocketProvider } from './contexts/SocketContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="cases" element={<Cases />} />
        <Route path="cases/new" element={<CreateCase />} />
        <Route path="cases/:id" element={<CaseDetail />} />
        {user?.role === 'ADMIN' && (
          <>
            <Route path="users" element={<Users />} />
            <Route path="zones" element={<Zones />} />
            <Route path="roads" element={<Roads />} />
            <Route path="developers" element={<Developers />} />
            <Route path="settings" element={<Settings />} />
          </>
        )}
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <AppRoutes />
              <Toaster position="top-right" />
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
