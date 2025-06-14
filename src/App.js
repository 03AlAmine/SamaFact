import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import PrivateRoute from './auth/PrivateRoute';
import Login from './auth/Login';
import Register from './auth/Register';
import Fact from './Fact';
import Profile from './profil/Profile';
import Home from './Mentafact';
import NotFound from './components/NotFound'; // importation du composant NotFound
//import AccessDenied from './components/AccessDenied'; // importation du composant NotFound

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register_admin" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/bill" element={<PrivateRoute><Fact /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          {/* <Route path="/register" element={<AccessDenied />} />
          Route pour toutes les pages non trouvées */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
