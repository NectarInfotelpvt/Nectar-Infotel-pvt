import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const isAuthenticated = localStorage.getItem('erpId') || localStorage.getItem('adminToken');
  const userRole = localStorage.getItem('userRole');

  console.log("ProtectedRoute - isAuthenticated:", isAuthenticated);
  console.log("ProtectedRoute - userRole (from localStorage):", userRole);
  console.log("ProtectedRoute - allowedRoles for this route:", allowedRoles);

  if (!isAuthenticated) {
    console.log("ProtectedRoute: User is NOT authenticated. Redirecting to /.");
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    console.warn(`ProtectedRoute: User with role "${userRole}" is authenticated but NOT allowed for this route. Redirecting to /.`);
    return <Navigate to="/" replace />;
  }

  console.log(`ProtectedRoute: Access granted for role "${userRole}" to this route.`);
  return <Outlet />;
};

export default ProtectedRoute;