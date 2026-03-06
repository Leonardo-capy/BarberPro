import React, { useState, useEffect, useCallback } from 'react'; // Adicionar useCallback
import { useAuth } from '../context/AuthContext.js';
import NavbarAdmin from '../components/NavbarAdmin.js';
import Toast from '../components/Toast.js';
import api from '../services/api.js';
import { useSearchParams } from 'react-router-dom';

function Perfil() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [perfil, setPerfil] = useState(null);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [descricao, setDescricao] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', success: true });

  // Usar useCallback para memoizar a função
  const carregarPerfil = useCallback(async () => {
    const idAlvo = searchParams.get('id') || user?.id;
    if (!idAlvo) return;
    
    try {
      const res = await api.get(`/api/usuarios/${idAlvo}`);
      setPerfil(res.data);
      setDescricao(res.data.descricao || '');
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
    }
  }, [searchParams, user?.id]);

  useEffect(() => {
    if (user) {
      carregarPerfil();
    }
  }, [user, carregarPerfil]); // Adicionar carregarPerfil às dependências

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/api/usuarios/${perfil.id}/perfil-completo`, {
        senhaAtual,
        novaSenha: novaSenha || undefined,
        descricao
      });

      mostrarToast('✅ Perfil atualizado com sucesso!', true);
      setSenhaAtual('');
      setNovaSenha('');
    } catch (err) {
      mostrarToast('❌ ' + (err.response?.data?.error || 'Erro ao atualizar'), false);
    }
  };

  const mostrarToast = (message, success) => {
    setToast({ show: true, message, success });
    setTimeout(() => setToast({ show: false, message: '', success: true }), 3000);
  };

  if (!perfil) return null;

  return (
    <>
      <NavbarAdmin />
      <Toast show={toast.show} message={toast.message} success={toast.success} />

      <main className="admin-layout">
        <div className="lado-esquerdo">
          <section className="dashboard">
            <div className="stat-card">
              <h3>Usuário</h3>
              <p>{perfil.usuario}</p>
            </div>
            <div className="stat-card">
              <h3>Cargo / Role</h3>
              <p>{perfil.role}</p>
            </div>
            <div className="stat-card">
              <h3>Status da Conta</h3>
              <p style={{ color: '#00ffd5' }}>Ativo</p>
            </div>
          </section>

          <div className="stat-card" style={{ width: '100%', textAlign: 'left', minHeight: '100px' }}>
            <h3>Minha Bio / Descrição</h3>
            <p style={{ fontSize: '16px', color: '#bbb', fontStyle: 'italic', marginTop: '10px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {descricao || 'Nenhuma descrição definida...'}
            </p>
          </div>
        </div>

        <div className="lado-direito">
          <section className="servicos-admin">
            <h2>Alterar Meus Dados</h2>
            <form onSubmit={handleSubmit} className="form-servico" style={{ flexDirection: 'column' }}>
              <div>
                <input
                  type="password"
                  placeholder="Senha Atual"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#00ffd5', fontSize: '14px', display: 'block', marginBottom: '5px' }}>
                  Minha Descrição / Bio:
                </label>
                <textarea
                  placeholder="Escreva algo sobre você..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#111',
                    border: '1px solid #444',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none',
                    transition: '0.3s',
                    resize: 'vertical',
                    minHeight: '80px'
                  }}
                />
              </div>

              <input
                type="password"
                placeholder="Nova Senha (deixe vazio para não alterar)"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                minLength="3"
              />

              <button type="submit">Salvar Alterações</button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}

export default Perfil;