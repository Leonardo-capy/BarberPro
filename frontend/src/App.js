import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import PrivateRoute from './components/PrivateRoute.js';
import Login from './pages/Login.js';
import Agenda from './pages/Agenda.js';
import AgendaBarbearia from './pages/AgendaBarbearia.js';
import Admin from './pages/Admin.js';
import AdminBloqueios from './pages/AdminBloqueios.js';
import AdminTotal from './pages/AdminTotal.js';
import Perfil from './pages/Perfil.js';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          {/* Redireciona / para /agenda */}
          <Route path="/" element={<Navigate to="/agenda" />} />

          {/* Lista todas as barbearias */}
          <Route path="/agenda" element={<Agenda />} />

          {/* Página de agendamento de uma barbearia específica */}
          <Route path="/agenda/:slug" element={<AgendaBarbearia />} />

          {/* Login */}
          <Route path="/login" element={
            <PublicRoute><Login /></PublicRoute>
          } />

          {/* Admin */}
          <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
          <Route path="/admin-bloqueios" element={<PrivateRoute><AdminBloqueios /></PrivateRoute>} />
          <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
          <Route path="/admin-total" element={
            <PrivateRoute requiredRole={["admin", "superadmin"]}><AdminTotal /></PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/agenda" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#00ffd5', fontSize: '20px' }}>Carregando...</div>;
  if (user) return <Navigate to="/admin" />;
  return children;
}

export default App;