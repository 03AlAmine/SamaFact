import React, { useEffect } from 'react';
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
import { UiProvider } from './contexts/uiContext'; // Ajoutez cette importation


/*import bgStat from "./assets/bg/bg-stat.jpg";
import bgFact from "./assets/bg/bg-fact.jpg";
import bgTeam from "./assets/bg/bg-team.jpg";
import bgClient from "./assets/bg/bg-client.jpg";

import usePreloadImages from "./contexts/hook";*/

function App() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      // Bloquer le clic droit
      const handleContextMenu = (e) => e.preventDefault();
      document.addEventListener("contextmenu", handleContextMenu);

      // Bloquer certaines touches (F12, Ctrl+Shift+I, Ctrl+U…)
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

      // Nettoyage quand le composant est démonté
      return () => {
        document.removeEventListener("contextmenu", handleContextMenu);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, []);
  //usePreloadImages([bgStat, bgClient, bgFact, bgTeam]);
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <UiProvider>

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register_admin" element={<Register />} />
            <Route path="/access-denied" element={<AccessDenied />} />

            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route
              path="/bill"
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
        </UiProvider>

      </AuthProvider>
    </Router>
  );
}

export default App;