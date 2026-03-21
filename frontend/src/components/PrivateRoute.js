import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

function PrivateRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#00ffd5', fontSize: '20px' }}>
      Carregando...
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  if (requiredRole) {
    const rolesPermitidas = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!rolesPermitidas.includes(user.role)) return <Navigate to="/admin" />;
  }

  return children;
}

export default PrivateRoute;