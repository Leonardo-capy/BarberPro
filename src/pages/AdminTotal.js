import React, { useState, useEffect } from 'react';
import NavbarAdmin from '../components/NavbarAdmin.js';
import ModalEditarUsuario from '../components/ModalEditarUsuario.js';
import api from '../services/api.js';

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
                    <td>
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
    </>
  );
}

export default AdminTotal;