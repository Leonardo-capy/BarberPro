import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import PrivateRoute from './components/PrivateRoute.js';
import Login from './pages/Login.js';
import Index from './pages/Index.js';
import Admin from './pages/Admin.js';
import AdminBloqueios from './pages/AdminBloqueios.js';
import AdminTotal from './pages/AdminTotal.js';
import Perfil from './pages/Perfil.js';

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <Routes>
          {/* ROTA PÚBLICA */}
          <Route path="/" element={<Index />} />
          
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          
          <Route path="/admin" element={
            <PrivateRoute>
              <Admin />
            </PrivateRoute>
          } />
          <Route path="/admin-bloqueios" element={
            <PrivateRoute>
              <AdminBloqueios />
            </PrivateRoute>
          } />
          <Route path="/perfil" element={
            <PrivateRoute>
              <Perfil />
            </PrivateRoute>
          } />
          
          <Route path="/admin-total" element={
            <PrivateRoute requiredRole="admin">
              <AdminTotal />
            </PrivateRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      color: '#00ffd5',
      fontSize: '20px'
    }}>
      Carregando...
    </div>;
  }

  if (user) {
    return <Navigate to="/admin" />;
  }

  return children;
}

export default App;