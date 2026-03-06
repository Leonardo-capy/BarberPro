import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    
    try {
      const data = await login(usuario, senha);
      if (data.role === 'admin' || data.role === 'barbeiro') {
        navigate('/admin');
      } else {
        setErro('Acesso não autorizado');
      }
    } catch (err) {
      setErro('Usuário ou senha incorreta!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Área Administrativa</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Digite o usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Digite a senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      {erro && <p style={{ color: 'red', marginTop: '15px' }}>{erro}</p>}
    </div>
  );
}

export default Login;