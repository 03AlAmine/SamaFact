import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Rôle avec valeur par défaut
  const userRole = currentUser.role?.toLowerCase() || 'guest';

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    console.warn(`Access denied for you !!!`);
   // console.warn(`Access denied for ${userRole}. Required: ${allowedRoles.join(', ')}`);
    return <Navigate to="/access-denied" state={{ 
      requiredRoles: allowedRoles,
      userRole
    }} replace />;
  }

  return children;
};