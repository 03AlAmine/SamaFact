import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { PrivateRoute } from './auth/PrivateRoute';
import Login from './auth/Login';
import Register from './auth/Register';
//import Fact from './Fact';
import Facture from  './bill/Fact'
import Profile from './profil/Profile';
import Home from './Mentafact';
import NotFound from './components/NotFound'; // importation du composant NotFound
//import AccessDenied from './components/AccessDenied'; // importation du composant NotFound
import Admin from './samafact/SamaFact'; // importation du composant Admin
import AccessDenied from './components/AccessDenied';
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register_admin" element={<Register />} />
          <Route path="/access-denied" element={<AccessDenied />} />
          
          {/* Routes protégées */}
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/bill" element={<PrivateRoute><Facture /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/samafact" element={<PrivateRoute allowedRoles={['superadmin']}><Admin /></PrivateRoute>} />
          
          {/* Route pour 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
