import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const PrivateRoute = ({ children, allowedRoles = [], requiredPermission }) => {
  const { currentUser, checkPermission } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérification des rôles spécifiques
  if (allowedRoles.length > 0) {
    const userRole = currentUser.role?.toLowerCase() || 'guest';
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  // Vérification des permissions spécifiques
  if (requiredPermission && !checkPermission(requiredPermission)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
};