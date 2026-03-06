import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api.js';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('/api/usuario-logado');
      setUser(response.data);
    } catch (error) {
      // Apenas loga o erro, não redireciona
      console.log('Usuário não está logado');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (usuario, senha) => {
    try {
      const response = await api.post('/login', { usuario, senha });
      await checkAuth();
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Erro ao fazer login' };
    }
  };

  const logout = async () => {
    try {
      await api.get('/logout');
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      setUser(null);
      navigate('/')
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};