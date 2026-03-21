import React, { useState, useEffect } from 'react';
import NavbarAdmin from '../components/NavbarAdmin.js';
import ModalEditarUsuario from '../components/ModalEditarUsuario.js';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';

function ModalVerPerfil({ usuario, onClose }) {
  const [perfil, setPerfil] = useState(null);
  const [agendamentos, setAgendamentos] = useState([]);
  const [faturamento, setFaturamento] = useState(0);

  useEffect(() => {
    if (!usuario) return;
    const carregar = async () => {
      try {
        const [resPerfil, resFat] = await Promise.all([
          api.get(`/api/usuarios/${usuario.id}`),
          api.get(`/api/admin/barbeiro/${usuario.id}/faturamento`)
        ]);
        setPerfil(resPerfil.data);
        setFaturamento(resFat.data.total || 0);
        setAgendamentos(resFat.data.agendamentos || []);
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
      }
    };
    carregar();
  }, [usuario]);

  if (!usuario) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.fechar} onClick={onClose}>✕</button>
        {perfil ? (
          <>
            <div style={styles.cabecalho}>
              <div style={styles.avatar}>{perfil.usuario.charAt(0).toUpperCase()}</div>
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
                <p style={{ color: '#bbb', fontStyle: 'italic', lineHeight: '1.6' }}>"{perfil.descricao}"</p>
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
        ) : <p style={{ textAlign: 'center', color: '#aaa' }}>Carregando...</p>}
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1a1a1a', border: '1px solid #333', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '520px', position: 'relative', maxHeight: '85vh', overflowY: 'auto' },
  fechar: { position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#aaa', fontSize: '18px', cursor: 'pointer' },
  cabecalho: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
  avatar: { width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #00ffd5, #00a896)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: '#000', flexShrink: 0 },
  nome: { fontSize: '22px', marginBottom: '4px' },
  badge: { background: '#00ffd520', color: '#00ffd5', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' },
  stats: { display: 'flex', gap: '12px', marginBottom: '24px' },
  statItem: { flex: 1, background: '#111', borderRadius: '12px', padding: '14px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' },
  statValor: { fontSize: '18px', fontWeight: 'bold', color: '#00ffd5' },
  statLabel: { fontSize: '11px', color: '#666', textTransform: 'uppercase' },
  bio: { background: '#111', borderRadius: '12px', padding: '16px', marginBottom: '20px' },
  historico: { background: '#111', borderRadius: '12px', padding: '16px' },
  itemHistorico: { display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px', gap: '8px', padding: '8px 0', borderBottom: '1px solid #222', fontSize: '13px', alignItems: 'center' }
};

function AdminTotal() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  const [barbearias, setBarbearias] = useState([]);
  const [barbeariaAtiva, setBarbeariaAtiva] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [usuarioVerPerfil, setUsuarioVerPerfil] = useState(null);
  const [novaBarbearia, setNovaBarbearia] = useState({ nome: '', slug: '', cidade: '' });
  const [novoUsuario, setNovoUsuario] = useState({ usuario: '', senha: '', role: 'barbeiro' });

  useEffect(() => {
    if (isSuperAdmin) {
      // Superadmin carrega todas as barbearias
      carregarBarbearias();
    } else {
      // Admin carrega direto os usuários da sua barbearia
      carregarUsuarios(user.barbearia_id);
    }
  }, [isSuperAdmin, user]);

  const carregarBarbearias = async () => {
    try {
      const res = await api.get('/api/barbearias/admin/todas');
      setBarbearias(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const carregarUsuarios = async (barbeariaId) => {
    try {
      const res = await api.get(`/api/admin/usuarios?barbearia_id=${barbeariaId}`);
      setUsuarios(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBarbearia = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/barbearias', novaBarbearia);
      setNovaBarbearia({ nome: '', slug: '', cidade: '' });
      carregarBarbearias();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao criar barbearia');
    }
  };

  const toggleAtivoBarbearia = async (b) => {
    try {
      await api.put(`/api/barbearias/${b.id}`, { ...b, ativo: b.ativo ? 0 : 1 });
      carregarBarbearias();
    } catch (err) {
      alert('Erro ao atualizar barbearia');
    }
  };

  const excluirBarbearia = async (id) => {
    if (!window.confirm('Excluir barbearia? Isso não pode ser desfeito.')) return;
    try {
      await api.delete(`/api/barbearias/${id}`);
      if (barbeariaAtiva?.id === id) setBarbeariaAtiva(null);
      carregarBarbearias();
    } catch (err) {
      alert('Erro ao excluir barbearia');
    }
  };

  const handleAddUsuario = async (e) => {
    e.preventDefault();
    const barbeariaId = isSuperAdmin ? barbeariaAtiva?.id : user.barbearia_id;
    try {
      await api.post('/api/admin/usuarios', { ...novoUsuario, barbearia_id: barbeariaId });
      setNovoUsuario({ usuario: '', senha: '', role: 'barbeiro' });
      carregarUsuarios(barbeariaId);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao criar usuário');
    }
  };

  const excluirUsuario = async (id) => {
    if (!window.confirm('Excluir usuário?')) return;
    const barbeariaId = isSuperAdmin ? barbeariaAtiva?.id : user.barbearia_id;
    try {
      await api.delete(`/api/admin/usuarios/${id}`);
      carregarUsuarios(barbeariaId);
    } catch (err) {
      alert('Erro ao excluir usuário');
    }
  };

  const salvarEdicao = async (dados) => {
    const barbeariaId = isSuperAdmin ? barbeariaAtiva?.id : user.barbearia_id;
    try {
      await api.put(`/api/admin/usuarios/${dados.id}`, dados);
      setModalAberto(false);
      setUsuarioEditando(null);
      carregarUsuarios(barbeariaId);
    } catch (err) {
      alert('Erro ao atualizar usuário');
    }
  };

  // Quando superadmin clica em "Usuários" de uma barbearia
  const selecionarBarbearia = (b) => {
    setBarbeariaAtiva(b);
    carregarUsuarios(b.id);
  };

  // Barbearia sendo gerenciada no momento
  const barbeariaGerenciada = isSuperAdmin ? barbeariaAtiva : { id: user?.barbearia_id, nome: 'Minha Barbearia' };

  return (
    <>
      <NavbarAdmin />
      <main className="admin-layout">
        <div className="lado-esquerdo">

          {/* Tabela de barbearias — só superadmin vê */}
          {isSuperAdmin && (
            <section className="table-container">
              <h2>Barbearias</h2>
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Slug</th>
                    <th>Cidade</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {barbearias.map(b => (
                    <tr key={b.id} style={barbeariaAtiva?.id === b.id ? { background: '#00ffd510' } : {}}>
                      <td>{b.nome}</td>
                      <td style={{ color: '#aaa', fontSize: '13px' }}>{b.slug}</td>
                      <td>{b.cidade || '-'}</td>
                      <td>
                        <span style={{ color: b.ativo ? '#00ffd5' : '#ff4d4d', fontSize: '13px' }}>
                          {b.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => selecionarBarbearia(b)}
                          style={{ background: '#00ffd520', color: '#00ffd5', border: '1px solid #00ffd540' }}
                        >
                          Usuários
                        </button>
                        <button onClick={() => toggleAtivoBarbearia(b)}>
                          {b.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                        <button onClick={() => excluirBarbearia(b.id)}>Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Tabela de usuários */}
          {(barbeariaGerenciada || !isSuperAdmin) && (
            <section className="table-container" style={{ marginTop: isSuperAdmin ? '24px' : '0' }}>
              <h2>
                {isSuperAdmin && barbeariaAtiva
                  ? `Usuários — ${barbeariaAtiva.nome}`
                  : 'Usuários da Barbearia'}
              </h2>

              {isSuperAdmin && !barbeariaAtiva ? (
                <p style={{ color: '#aaa' }}>Selecione uma barbearia para ver os usuários.</p>
              ) : (
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
                    {usuarios.map(u => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.usuario}</td>
                        <td>{u.role}</td>
                        <td style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => setUsuarioVerPerfil(u)}
                            style={{ background: '#00ffd520', color: '#00ffd5', border: '1px solid #00ffd540' }}
                          >
                            Ver Perfil
                          </button>
                          {u.role !== 'superadmin' && (
                            <button onClick={() => { setUsuarioEditando(u); setModalAberto(true); }}>Editar</button>
                          )}
                          {u.role !== 'superadmin' && (
                            <button onClick={() => excluirUsuario(u.id)}>Excluir</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </div>

        <div className="lado-direito">

          {/* Criar barbearia — só superadmin */}
          {isSuperAdmin && (
            <section className="servicos-admin">
              <h2>Nova Barbearia</h2>
              <form onSubmit={handleAddBarbearia} className="form-servico" style={{ flexDirection: 'column' }}>
                <input
                  type="text" placeholder="Nome da barbearia"
                  value={novaBarbearia.nome}
                  onChange={(e) => setNovaBarbearia({ ...novaBarbearia, nome: e.target.value })}
                  required
                />
                <input
                  type="text" placeholder="Slug (ex: joao-barber)"
                  value={novaBarbearia.slug}
                  onChange={(e) => setNovaBarbearia({ ...novaBarbearia, slug: e.target.value })}
                  required
                />
                <input
                  type="text" placeholder="Cidade"
                  value={novaBarbearia.cidade}
                  onChange={(e) => setNovaBarbearia({ ...novaBarbearia, cidade: e.target.value })}
                />
                <button type="submit">Criar Barbearia</button>
              </form>
            </section>
          )}

          {/* Criar usuário — admin vê sempre, superadmin só após selecionar barbearia */}
          {(!isSuperAdmin || barbeariaAtiva) && (
            <section className="servicos-admin" style={{ marginTop: isSuperAdmin ? '24px' : '0' }}>
              <h2>
                {isSuperAdmin
                  ? `Novo Usuário — ${barbeariaAtiva?.nome}`
                  : 'Adicionar Usuário'}
              </h2>
              <form onSubmit={handleAddUsuario} className="form-servico" style={{ flexDirection: 'column' }}>
                <input
                  type="text" placeholder="Usuário"
                  value={novoUsuario.usuario}
                  onChange={(e) => setNovoUsuario({ ...novoUsuario, usuario: e.target.value })}
                  required
                />
                <input
                  type="password" placeholder="Senha"
                  value={novoUsuario.senha}
                  onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
                  required
                />
                <select
                  value={novoUsuario.role}
                  onChange={(e) => setNovoUsuario({ ...novoUsuario, role: e.target.value })}
                >
                  <option value="barbeiro">Barbeiro</option>
                  <option value="admin">Admin da Barbearia</option>
                </select>
                <button type="submit">Adicionar Usuário</button>
              </form>
            </section>
          )}
        </div>
      </main>

      <ModalEditarUsuario
        isOpen={modalAberto}
        usuario={usuarioEditando}
        onClose={() => { setModalAberto(false); setUsuarioEditando(null); }}
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