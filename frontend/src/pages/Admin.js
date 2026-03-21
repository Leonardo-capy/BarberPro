import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import NavbarAdmin from '../components/NavbarAdmin.js';
import api from '../services/api.js';

function Admin() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';

  const [agendamentos, setAgendamentos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [total, setTotal] = useState(0);
  const [hoje, setHoje] = useState(0);
  const [faturamento, setFaturamento] = useState({ total: 0, diario: 0, mensal: 0, anual: 0 });
  const [faturamentoPorBarbeiro, setFaturamentoPorBarbeiro] = useState([]);
  const [faturamentoPorBarbearia, setFaturamentoPorBarbearia] = useState([]);
  const [totalAtendimentos, setTotalAtendimentos] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [novoServico, setNovoServico] = useState({ nome: '', preco: '' });

  useEffect(() => {
    if (!user) return;
    if (isSuperAdmin) {
      carregarFaturamentoGeral();
    } else if (isAdmin) {
      carregarFaturamentoBarbearia();
      carregarAgendamentos();
      carregarServicos();
    } else {
      carregarAgendamentos();
      carregarServicos();
      carregarFaturamento();
    }
  }, [user]);

  const carregarAgendamentos = async () => {
    try {
      const res = await api.get('/api/agendamentos');
      setAgendamentos(res.data);
      setTotal(res.data.length);
      const hojeData = new Date().toISOString().split('T')[0];
      setHoje(res.data.filter(item => item.data === hojeData).length);
    } catch (err) {
      console.error(err);
    }
  };

  const carregarServicos = async () => {
    try {
      const res = await api.get('/api/servicos');
      setServicos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const carregarFaturamento = async () => {
    try {
      const res = await api.get('/api/agendamentos/faturamento');
      setFaturamento(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const carregarFaturamentoBarbearia = async () => {
    try {
      const res = await api.get('/api/admin/faturamento-barbearia');
      setFaturamento(res.data);
      setFaturamentoPorBarbeiro(res.data.porBarbeiro || []);
      setTotalAtendimentos(res.data.totalAtendimentos || 0);
      setTotalClientes(res.data.totalClientes || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const carregarFaturamentoGeral = async () => {
    try {
      const res = await api.get('/api/admin/faturamento-geral');
      setFaturamento(res.data);
      setFaturamentoPorBarbearia(res.data.porBarbearia || []);
      setTotalAtendimentos(res.data.totalAtendimentos || 0);
      setTotalClientes(res.data.totalClientes || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const finalizar = async (id) => {
    try {
      await api.put(`/api/agendamentos/finalizar/${id}`);
      carregarAgendamentos();
      isAdmin ? carregarFaturamentoBarbearia() : carregarFaturamento();
    } catch (err) {
      alert('Erro ao finalizar agendamento');
    }
  };

  const excluir = async (id) => {
    if (!window.confirm('Deseja realmente excluir?')) return;
    try {
      await api.delete(`/api/agendamentos/${id}`);
      carregarAgendamentos();
      isAdmin ? carregarFaturamentoBarbearia() : carregarFaturamento();
    } catch (err) {
      alert('Erro ao excluir agendamento');
    }
  };

  const handleAddServico = async (e) => {
    e.preventDefault();
    if (!novoServico.nome || !novoServico.preco) return;
    try {
      await api.post('/api/servicos', { nome: novoServico.nome, preco: parseFloat(novoServico.preco) });
      setNovoServico({ nome: '', preco: '' });
      carregarServicos();
    } catch (err) {
      alert('Erro ao adicionar serviço');
    }
  };

  const excluirServico = async (id) => {
    if (!window.confirm('Deseja realmente excluir este serviço?')) return;
    try {
      await api.delete(`/api/servicos/${id}`);
      carregarServicos();
    } catch (err) {
      alert('Erro ao excluir serviço');
    }
  };

  // ========================
  // View Superadmin
  // ========================
  if (isSuperAdmin) {
    return (
      <>
        <NavbarAdmin />
        <main className="admin-layout">
          <div className="lado-esquerdo">
            <section className="dashboard">
              <div className="stat-card"><h3>Atendimentos</h3><p>{totalAtendimentos}</p></div>
              <div className="stat-card"><h3>Clientes Únicos</h3><p>{totalClientes}</p></div>
              <div className="stat-card"><h3>Faturamento Hoje</h3><p>R$ {Number(faturamento.diario).toFixed(2)}</p></div>
              <div className="stat-card"><h3>Faturamento do Mês</h3><p>R$ {Number(faturamento.mensal).toFixed(2)}</p></div>
              <div className="stat-card"><h3>Faturamento do Ano</h3><p>R$ {Number(faturamento.anual).toFixed(2)}</p></div>
              <div className="stat-card"><h3>Faturamento Total</h3><p>R$ {Number(faturamento.total).toFixed(2)}</p></div>
            </section>

            {faturamentoPorBarbearia.length > 0 ? (
              <section className="table-container" style={{ marginTop: '24px' }}>
                <h2>Faturamento por Barbearia</h2>
                <table>
                  <thead><tr><th>Barbearia</th><th>Atendimentos</th><th>Faturamento</th></tr></thead>
                  <tbody>
                    {faturamentoPorBarbearia.map((b, i) => (
                      <tr key={i}>
                        <td>💈 {b.nome}</td>
                        <td>{b.atendimentos}</td>
                        <td style={{ color: '#00ffd5', fontWeight: 'bold' }}>R$ {Number(b.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : (
              <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
                <p>Nenhum atendimento finalizado ainda.</p>
              </div>
            )}
          </div>
          <div className="lado-direito">
            <section className="servicos-admin">
              <h2>Painel da Plataforma</h2>
              <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.7' }}>
                Você está logado como <strong style={{ color: '#00ffd5' }}>Superadmin</strong>.<br />
                Use o <strong>Painel Total</strong> para gerenciar barbearias e usuários.
              </p>
            </section>
          </div>
        </main>
      </>
    );
  }

  // ========================
  // View Admin da Barbearia
  // ========================
  if (isAdmin) {
    return (
      <>
        <NavbarAdmin />
        <main className="admin-layout">
          <div className="lado-esquerdo">
            <section className="dashboard">
              <div className="stat-card"><h3>Atendimentos</h3><p>{totalAtendimentos}</p></div>
              <div className="stat-card"><h3>Clientes Únicos</h3><p>{totalClientes}</p></div>
              <div className="stat-card"><h3>Faturamento Hoje</h3><p>R$ {Number(faturamento.diario).toFixed(2)}</p></div>
              <div className="stat-card"><h3>Faturamento do Mês</h3><p>R$ {Number(faturamento.mensal).toFixed(2)}</p></div>
              <div className="stat-card"><h3>Faturamento do Ano</h3><p>R$ {Number(faturamento.anual).toFixed(2)}</p></div>
              <div className="stat-card"><h3>Faturamento Total</h3><p>R$ {Number(faturamento.total).toFixed(2)}</p></div>
            </section>

            {faturamentoPorBarbeiro.length > 0 && (
              <section className="table-container" style={{ marginTop: '24px' }}>
                <h2>Faturamento por Barbeiro</h2>
                <table>
                  <thead><tr><th>Barbeiro</th><th>Atendimentos</th><th>Faturamento</th></tr></thead>
                  <tbody>
                    {faturamentoPorBarbeiro.map((b, i) => (
                      <tr key={i}>
                        <td>✂ {b.usuario}</td>
                        <td>{b.atendimentos}</td>
                        <td style={{ color: '#00ffd5', fontWeight: 'bold' }}>R$ {Number(b.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            <section className="table-container" style={{ marginTop: '24px' }}>
              <h2>Meus Agendamentos</h2>
              <table>
                <thead>
                  <tr><th>Nome</th><th>Telefone</th><th>Serviço</th><th>Data</th><th>Horário</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {agendamentos.map(item => (
                    <tr key={item.id} style={item.finalizado === 1 ? { backgroundColor: '#d4edda' } : {}}>
                      <td>{item.nome}</td>
                      <td>{item.telefone}</td>
                      <td>{item.servico}</td>
                      <td>{item.data}</td>
                      <td>{item.horario}</td>
                      <td>
                        {item.finalizado === 0
                          ? <button onClick={() => finalizar(item.id)}>Finalizar</button>
                          : <span style={{ color: 'green', fontWeight: 'bold' }}>✔ Pago</span>}
                        <button onClick={() => excluir(item.id)}>Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          <div className="lado-direito">
            <section className="servicos-admin">
              <h2>Gerenciar Serviços</h2>
              <form onSubmit={handleAddServico} className="form-servico">
                <input type="text" placeholder="Nome do serviço" value={novoServico.nome}
                  onChange={(e) => setNovoServico({ ...novoServico, nome: e.target.value })} required />
                <input type="number" placeholder="Preço (R$)" step="0.01" value={novoServico.preco}
                  onChange={(e) => setNovoServico({ ...novoServico, preco: e.target.value })} required />
                <button type="submit">Adicionar Serviço</button>
              </form>
              <ul id="listaServicos">
                {servicos.map(s => (
                  <li key={s.id}>{s.nome} - R$ {Number(s.preco).toFixed(2)}
                    <button onClick={() => excluirServico(s.id)}>Excluir</button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </main>
      </>
    );
  }

  // ========================
  // View Barbeiro
  // ========================
  return (
    <>
      <NavbarAdmin />
      <main className="admin-layout">
        <div className="lado-esquerdo">
          <section className="dashboard">
            <div className="stat-card"><h3>Total de Agendamentos</h3><p>{total}</p></div>
            <div className="stat-card"><h3>Hoje</h3><p>{hoje}</p></div>
            <div className="stat-card"><h3>Faturamento Hoje</h3><p>R$ {Number(faturamento.diario).toFixed(2)}</p></div>
            <div className="stat-card"><h3>Faturamento do Mês</h3><p>R$ {Number(faturamento.mensal).toFixed(2)}</p></div>
            <div className="stat-card"><h3>Faturamento do Ano</h3><p>R$ {Number(faturamento.anual).toFixed(2)}</p></div>
            <div className="stat-card"><h3>Faturamento Total</h3><p>R$ {Number(faturamento.total).toFixed(2)}</p></div>
          </section>

          <section className="table-container">
            <h2>Lista de Agendamentos</h2>
            <table>
              <thead>
                <tr><th>Nome</th><th>Telefone</th><th>Serviço</th><th>Data</th><th>Horário</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {agendamentos.map(item => (
                  <tr key={item.id} style={item.finalizado === 1 ? { backgroundColor: '#d4edda' } : {}}>
                    <td>{item.nome}</td>
                    <td>{item.telefone}</td>
                    <td>{item.servico}</td>
                    <td>{item.data}</td>
                    <td>{item.horario}</td>
                    <td>
                      {item.finalizado === 0
                        ? <button onClick={() => finalizar(item.id)}>Finalizar</button>
                        : <span style={{ color: 'green', fontWeight: 'bold' }}>✔ Pago</span>}
                      <button onClick={() => excluir(item.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <div className="lado-direito">
          <section className="servicos-admin">
            <h2>Gerenciar Serviços</h2>
            <form onSubmit={handleAddServico} className="form-servico">
              <input type="text" placeholder="Nome do serviço" value={novoServico.nome}
                onChange={(e) => setNovoServico({ ...novoServico, nome: e.target.value })} required />
              <input type="number" placeholder="Preço (R$)" step="0.01" value={novoServico.preco}
                onChange={(e) => setNovoServico({ ...novoServico, preco: e.target.value })} required />
              <button type="submit">Adicionar Serviço</button>
            </form>
            <ul id="listaServicos">
              {servicos.map(s => (
                <li key={s.id}>{s.nome} - R$ {Number(s.preco).toFixed(2)}
                  <button onClick={() => excluirServico(s.id)}>Excluir</button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}

export default Admin;