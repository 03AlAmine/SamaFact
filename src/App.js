import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import PrivateRoute from './auth/PrivateRoute';
import Login from './auth/Login';
import Register from './auth/Register';
import Fact from './Fact';
import Profile from './profil/Profile';
import Home from './Dashbill';
//import ForgotPassword from './auth/ForgotPassword';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
         {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/factures" element={<PrivateRoute><Fact /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}


export default App;