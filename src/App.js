import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import PrivateRoute from './auth/PrivateRoute';
import Login from './auth/Login';
import Register from './auth/Register';
import Fact from './Fact';
import Profile from './profil/Profile';
//import HomeZero from './Dashbill';
import Home from './Mentafact';
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
       {/*   <Route path="home_0" element={<PrivateRoute><HomeZero /></PrivateRoute>} /> */}
          <Route path="/bill" element={<PrivateRoute><Fact /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}


export default App;