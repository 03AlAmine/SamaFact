import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { PrivateRoute } from './auth/PrivateRoute';
import Login from './auth/Login';
import Register from './auth/Register';
import Facture from './bill/Fact';
import Payroll from './payrolls/PayrollForm';
import Profile from './profil/Profile';
import Home from './Mentafact';
import NotFound from './components/NotFound';
import Admin from './samafact/SamaFact';
import AccessDenied from './components/AccessDenied';
import ForgotPassword from './auth/ForgotPassword';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register_admin" element={<Register />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/bill" element={<PrivateRoute><Facture /></PrivateRoute>} />
          <Route path="/payroll" element={<PrivateRoute><Payroll /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/samafact" element={<PrivateRoute allowedRoles={['superadmin']}><Admin /></PrivateRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;