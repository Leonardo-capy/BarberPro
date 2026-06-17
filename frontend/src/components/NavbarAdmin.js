import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

function NavbarAdmin() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
  };

  return (
    <header className="navbar navbar-admin">
      <div className="logo">✂ Barber Max Pro Admin</div>
      <nav className="admin-nav">
        <Link to="/agenda">Painel Cliente</Link>
        <Link to="/perfil" className={isActive('/perfil')}>Perfil</Link>
        <Link to="/admin" className={isActive('/admin')}>Agendamentos</Link>
        <Link to="/admin-bloqueios" className={isActive('/admin-bloqueios')}>Bloqueios</Link>
        {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <Link to="/admin-total" className={isActive('/admin-total')}>Painel Total</Link>
        )}
        <button
          onClick={handleLogout}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px', padding: '10px 18px', borderRadius: '10px', transition: '0.3s' }}
          onMouseEnter={(e) => { e.target.style.background = 'rgba(0,255,213,0.1)'; e.target.style.border = '1px solid #00ffd5'; e.target.style.color = '#00ffd5'; }}
          onMouseLeave={(e) => { e.target.style.background = 'none'; e.target.style.border = 'none'; e.target.style.color = 'white'; }}
        >
          Sair
        </button>
      </nav>
    </header>
  );
}

export default NavbarAdmin;