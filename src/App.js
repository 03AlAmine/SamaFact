import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { PrivateRoute } from './auth/PrivateRoute';
import { UiProvider } from './contexts/uiContext';

// ✅ Imports statiques (toujours nécessaires, légers)
import Login from './auth/Login';
import Register from './auth/Register';
import AccessDenied from './components/other/AccessDenied';
import ForgotPassword from './auth/ForgotPassword';
import NotFound from './components/other/NotFound';

// ✅ Lazy loading — ces pages ne sont chargées qu'à la demande
const Home = lazy(() => import('./Mentafact'));
const Facture = lazy(() => import('./data/bill/Fact'));
const Payroll = lazy(() => import('./data/payrolls/PayrollForm'));
const Profile = lazy(() => import('./profil/Profile'));
const Admin = lazy(() => import('./samafact/SamaFact'));

// Fallback minimaliste pendant le chargement d'une page lazy
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontFamily: 'Inter, sans-serif',
    color: '#64748b',
    fontSize: '14px',
    gap: '10px'
  }}>
    <div style={{
      width: '18px', height: '18px',
      border: '2px solid #e2e8f0',
      borderTop: '2px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    Chargement...
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      const handleContextMenu = (e) => e.preventDefault();
      document.addEventListener("contextmenu", handleContextMenu);

      const handleKeyDown = (e) => {
        if (
          e.key === "F12" ||
          (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i") ||
          (e.ctrlKey && e.key.toLowerCase() === "u")
        ) {
          e.preventDefault();
        }
      };
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("contextmenu", handleContextMenu);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, []);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <UiProvider>
          {/* ✅ Suspense englobe toutes les routes pour gérer les lazy imports */}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register_admin" element={<Register />} />
              <Route path="/access-denied" element={<AccessDenied />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />

              <Route
                path="/invoice"
                element={
                  <PrivateRoute requiredPermission="manageDocuments">
                    <Facture />
                  </PrivateRoute>
                }
              />
              <Route
                path="/payroll"
                element={
                  <PrivateRoute requiredPermission="managePayroll">
                    <Payroll />
                  </PrivateRoute>
                }
              />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/samafact" element={<PrivateRoute allowedRoles={['superadmin']}><Admin /></PrivateRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </UiProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;