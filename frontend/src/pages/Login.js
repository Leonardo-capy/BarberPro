import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

function Login() {
  const [barbearias, setBarbearias] = useState([]);
  const [barbeariaId, setBarbeariaId] = useState('');
  const [barbeariaPreSelecionada, setBarbeariaPreSelecionada] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const idSalvo = localStorage.getItem('ultima_barbearia_id');

    api.get('/api/barbearias').then(res => {
      setBarbearias(res.data);

      // Só pré-seleciona se o id salvo for um número válido
      if (idSalvo && idSalvo !== 'undefined' && !isNaN(Number(idSalvo))) {
        const encontrada = res.data.find(b => String(b.id) === idSalvo);
        if (encontrada) {
          setBarbeariaId(String(encontrada.id));
          setBarbeariaPreSelecionada(encontrada.nome);
        } else {
          localStorage.removeItem('ultima_barbearia_id');
        }
      } else {
        // Limpa valor inválido
        localStorage.removeItem('ultima_barbearia_id');
        localStorage.removeItem('ultima_barbearia_nome');
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!barbeariaId) {
      setErro('Selecione a barbearia');
      return;
    }
    setLoading(true);
    setErro('');

    try {
      // Garantir que o valor seja válido
      let barbeariaIdFinal;
      if (!barbeariaId || barbeariaId === 'undefined') {
        setErro('Selecione a barbearia');
        setLoading(false);
        return;
      } else if (barbeariaId === 'superadmin') {
        barbeariaIdFinal = 'superadmin';
      } else {
        barbeariaIdFinal = Number(barbeariaId);
        if (isNaN(barbeariaIdFinal)) {
          setErro('Barbearia inválida. Selecione novamente.');
          setLoading(false);
          return;
        }
      }
      console.log('[LOGIN FRONTEND] enviando barbearia_id:', barbeariaIdFinal, 'usuario:', usuario);
      const data = await login(usuario, senha, barbeariaIdFinal);
      if (['barbeiro', 'admin', 'superadmin'].includes(data.role)) {
        navigate('/admin');
      } else {
        setErro('Acesso não autorizado');
      }
    } catch (err) {
      setErro(err.erro || err.error || 'Usuário ou senha incorreta!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Área Administrativa</h2>

      {barbeariaPreSelecionada && (
        <p style={{ color: '#00ffd5', fontSize: '14px', marginBottom: '12px', textAlign: 'center' }}>
          💈 {barbeariaPreSelecionada}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <select
          value={barbeariaId}
          onChange={(e) => {
            setBarbeariaId(e.target.value);
            setBarbeariaPreSelecionada('');
          }}
          required
          disabled={loading}
          style={{ marginBottom: '16px' }}
        >
          <option value="">Selecione a barbearia</option>
          <option value="superadmin">⚙ Superadmin (plataforma)</option>
          {barbearias.map(b => (
            <option key={b.id} value={b.id}>{b.nome}{b.cidade ? ` — ${b.cidade}` : ''}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Usuário"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Senha"
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