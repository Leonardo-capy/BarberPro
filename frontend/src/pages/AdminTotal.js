import React, { useState, useEffect } from 'react';
import NavbarAdmin from '../components/NavbarAdmin.js';
import ModalEditarUsuario from '../components/ModalEditarUsuario.js';
import api from '../services/api.js';

function ModalVerPerfil({ usuario, onClose }) {
  const [perfil, setPerfil] = useState(null);
  const [agendamentos, setAgendamentos] = useState([]);
  const [faturamento, setFaturamento] = useState(0);

  useEffect(() => {
    if (!usuario) return;

    const carregarDados = async () => {
      try {
        const [resPerfil, resFaturamento] = await Promise.all([
          api.get(`/api/usuarios/${usuario.id}`),
          api.get(`/api/admin/barbeiro/${usuario.id}/faturamento`)
        ]);
        setPerfil(resPerfil.data);
        setFaturamento(resFaturamento.data.total || 0);
        setAgendamentos(resFaturamento.data.agendamentos || []);
      } catch (err) {
        console.error('Erro ao carregar perfil do barbeiro:', err);
      }
    };

    carregarDados();
  }, [usuario]);

  if (!usuario) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.fechar} onClick={onClose}>✕</button>

        {perfil ? (
          <>
            <div style={styles.cabecalho}>
              <div style={styles.avatar}>
                {perfil.usuario.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={styles.nome}>{perfil.usuario}</h2>
                <span style={styles.badge}>{perfil.role}</span>
              </div>
            </div>

            <div style={styles.stats}>
              <div style={styles.statItem}>
                <span style={styles.statValor}>R$ {Number(faturamento).toFixed(2)}</span>
                <span style={styles.statLabel}>Faturamento Total</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statValor}>{agendamentos.length}</span>
                <span style={styles.statLabel}>Atendimentos</span>
              </div>
              <div style={styles.statItem}>
                <span style={{ ...styles.statValor, color: '#00ffd5' }}>Ativo</span>
                <span style={styles.statLabel}>Status</span>
              </div>
            </div>

            {perfil.descricao && (
              <div style={styles.bio}>
                <h4 style={{ color: '#00ffd5', marginBottom: '8px' }}>Bio</h4>
                <p style={{ color: '#bbb', fontStyle: 'italic', lineHeight: '1.6' }}>
                  "{perfil.descricao}"
                </p>
              </div>
            )}

            {agendamentos.length > 0 && (
              <div style={styles.historico}>
                <h4 style={{ color: '#00ffd5', marginBottom: '12px' }}>Últimos atendimentos</h4>
                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  {agendamentos.slice(0, 10).map((ag, i) => (
                    <div key={i} style={styles.itemHistorico}>
                      <span>{ag.nome}</span>
                      <span style={{ color: '#aaa' }}>{ag.servico}</span>
                      <span style={{ color: '#00ffd5' }}>R$ {Number(ag.preco).toFixed(2)}</span>
                      <span style={{ color: '#666', fontSize: '12px' }}>{ag.data} {ag.horario}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p style={{ textAlign: 'center', color: '#aaa' }}>Carregando...</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '520px',
    position: 'relative',
    maxHeight: '85vh',
    overflowY: 'auto'
  },
  fechar: {
    position: 'absolute', top: '16px', right: '16px',
    background: 'none', border: 'none',
    color: '#aaa', fontSize: '18px', cursor: 'pointer'
  },
  cabecalho: {
    display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px'
  },
  avatar: {
    width: '60px', height: '60px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #00ffd5, #00a896)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '24px', fontWeight: 'bold', color: '#000', flexShrink: 0
  },
  nome: { fontSize: '22px', marginBottom: '4px' },
  badge: {
    background: '#00ffd520', color: '#00ffd5',
    padding: '2px 10px', borderRadius: '20px', fontSize: '12px'
  },
  stats: {
    display: 'flex', gap: '12px', marginBottom: '24px'
  },
  statItem: {
    flex: 1, background: '#111', borderRadius: '12px',
    padding: '14px', textAlign: 'center',
    display: 'flex', flexDirection: 'column', gap: '4px'
  },
  statValor: { fontSize: '18px', fontWeight: 'bold', color: '#00ffd5' },
  statLabel: { fontSize: '11px', color: '#666', textTransform: 'uppercase' },
  bio: {
    background: '#111', borderRadius: '12px',
    padding: '16px', marginBottom: '20px'
  },
  historico: {
    background: '#111', borderRadius: '12px', padding: '16px'
  },
  itemHistorico: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px',
    gap: '8px', padding: '8px 0',
    borderBottom: '1px solid #222', fontSize: '13px',
    alignItems: 'center'
  }
};

function AdminTotal() {
  const [dashboard, setDashboard] = useState({
    totalAgendamentos: 0,
    faturamentoTotal: 0,
    totalClientes: 0,
    barbeiroTop: null,
    servicoTop: null
  });
  const [usuarios, setUsuarios] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [usuarioVerPerfil, setUsuarioVerPerfil] = useState(null);
  const [novoUsuario, setNovoUsuario] = useState({
    usuario: '',
    senha: '',
    role: 'barbeiro'
  });

  useEffect(() => {
    carregarDashboard();
    carregarUsuarios();
  }, []);

  const carregarDashboard = async () => {
    try {
      const res = await api.get('/api/admin/dashboard');
      setDashboard(res.data);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    }
  };

  const carregarUsuarios = async () => {
    try {
      const res = await api.get('/api/admin/usuarios');
      setUsuarios(res.data);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    }
  };

  const handleAddUsuario = async (e) => {
    e.preventDefault();
    if (!novoUsuario.usuario || !novoUsuario.senha) return;

    try {
      await api.post('/api/admin/usuarios', novoUsuario);
      setNovoUsuario({ usuario: '', senha: '', role: 'barbeiro' });
      carregarUsuarios();
    } catch (err) {
      alert('Erro ao criar usuário');
    }
  };

  const excluirUsuario = async (id) => {
    if (id === 1) {
      alert('Não é permitido excluir o admin principal');
      return;
    }
    if (!window.confirm('Tem certeza que deseja excluir?')) return;

    try {
      await api.delete(`/api/admin/usuarios/${id}`);
      carregarUsuarios();
    } catch (err) {
      alert('Erro ao excluir usuário');
    }
  };

  const abrirModalEdicao = (usuario) => {
    setUsuarioEditando(usuario);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setUsuarioEditando(null);
  };

  const salvarEdicao = async (dados) => {
    try {
      await api.put(`/api/admin/usuarios/${dados.id}`, dados);
      fecharModal();
      carregarUsuarios();
    } catch (err) {
      alert('Erro ao atualizar usuário');
    }
  };

  return (
    <>
      <NavbarAdmin />
      <main className="admin-layout">
        <div className="lado-esquerdo">
          <section className="dashboard">
            <div className="stat-card">
              <h3>Total de Agendamentos</h3>
              <p>{dashboard.totalAgendamentos}</p>
            </div>
            <div className="stat-card">
              <h3>Faturamento Total</h3>
              <p>R$ {Number(dashboard.faturamentoTotal).toFixed(2)}</p>
            </div>
            <div className="stat-card">
              <h3>Total de Clientes</h3>
              <p>{dashboard.totalClientes}</p>
            </div>
            <div className="stat-card">
              <h3>Barbeiro Top</h3>
              <p>
                {dashboard.barbeiroTop
                  ? `${dashboard.barbeiroTop.usuario} (R$ ${Number(dashboard.barbeiroTop.total).toFixed(2)})`
                  : 'Nenhum'}
              </p>
            </div>
            <div className="stat-card">
              <h3>Serviço Mais Vendido</h3>
              <p>
                {dashboard.servicoTop
                  ? `${dashboard.servicoTop.servico} (${dashboard.servicoTop.total} vendas)`
                  : 'Nenhum'}
              </p>
            </div>
          </section>

          <section className="table-container">
            <h2>Gerenciar Usuários</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuário</th>
                  <th>Role</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.usuario}</td>
                    <td>{user.role}</td>
                    <td style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setUsuarioVerPerfil(user)}
                        style={{ background: '#00ffd520', color: '#00ffd5', border: '1px solid #00ffd540' }}
                      >
                        Ver Perfil
                      </button>
                      <button onClick={() => abrirModalEdicao(user)}>Editar</button>
                      {user.id !== 1 ? (
                        <button onClick={() => excluirUsuario(user.id)}>Excluir</button>
                      ) : (
                        <span>Admin Principal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <div className="lado-direito">
          <section className="servicos-admin">
            <h2>Adicionar Novo Usuário</h2>
            <form onSubmit={handleAddUsuario} className="form-servico">
              <input
                type="text"
                placeholder="Usuário"
                value={novoUsuario.usuario}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, usuario: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Senha"
                value={novoUsuario.senha}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
                required
              />
              <select
                value={novoUsuario.role}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, role: e.target.value })}
              >
                <option value="barbeiro">Barbeiro</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit">Adicionar</button>
            </form>
          </section>
        </div>
      </main>

      <ModalEditarUsuario
        isOpen={modalAberto}
        usuario={usuarioEditando}
        onClose={fecharModal}
        onSave={salvarEdicao}
      />

      <ModalVerPerfil
        usuario={usuarioVerPerfil}
        onClose={() => setUsuarioVerPerfil(null)}
      />
    </>
  );
}

export default AdminTotal;