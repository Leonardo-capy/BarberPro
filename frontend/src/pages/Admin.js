import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import NavbarAdmin from '../components/NavbarAdmin.js';
import api from '../services/api.js';

function Admin() {
  const { user } = useAuth();
  const [agendamentos, setAgendamentos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [total, setTotal] = useState(0);
  const [hoje, setHoje] = useState(0);
  const [faturamento, setFaturamento] = useState(0);
  const [novoServico, setNovoServico] = useState({ nome: '', preco: '' });

  useEffect(() => {
    if (user) {
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
      const countHoje = res.data.filter(item => item.data === hojeData).length;
      setHoje(countHoje);
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
    }
  };

  const carregarServicos = async () => {
    try {
      const res = await api.get('/api/servicos');
      setServicos(res.data);
    } catch (err) {
      console.error('Erro ao carregar serviços:', err);
    }
  };

  const carregarFaturamento = async () => {
    try {
      const res = await api.get('/api/agendamentos/faturamento');
      setFaturamento(res.data.total || 0);
    } catch (err) {
      console.error('Erro ao carregar faturamento:', err);
    }
  };

  const finalizar = async (id) => {
    try {
      await api.put(`/api/agendamentos/finalizar/${id}`);
      carregarAgendamentos();
      carregarFaturamento();
    } catch (err) {
      alert('Erro ao finalizar agendamento');
    }
  };

  const excluir = async (id) => {
    if (!window.confirm('Deseja realmente excluir?')) return;
    try {
      await api.delete(`/api/agendamentos/${id}`);
      carregarAgendamentos();
      carregarFaturamento();
    } catch (err) {
      alert('Erro ao excluir agendamento');
    }
  };

  const handleAddServico = async (e) => {
    e.preventDefault();
    if (!novoServico.nome || !novoServico.preco) return;

    try {
      await api.post('/api/servicos', novoServico);
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

  return (
    <>
      <NavbarAdmin />
      <main className="admin-layout">
        <div className="lado-esquerdo">
          <section className="dashboard">
            <div className="stat-card">
              <h3>Total de Agendamentos</h3>
              <p>{total}</p>
            </div>
            <div className="stat-card">
              <h3>Hoje</h3>
              <p>{hoje}</p>
            </div>
            <div className="stat-card">
              <h3>Faturamento Total</h3>
              <p>R$ {Number(faturamento).toFixed(2)}</p>
            </div>
          </section>

          <section className="table-container">
            <h2>Lista de Agendamentos</h2>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Serviço</th>
                  <th>Data</th>
                  <th>Horário</th>
                  <th>Ações</th>
                </tr>
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
                      {item.finalizado === 0 ? (
                        <button onClick={() => finalizar(item.id)}>Finalizar</button>
                      ) : (
                        <span style={{ color: 'green', fontWeight: 'bold' }}>✔ Pago</span>
                      )}
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
              <input
                type="text"
                placeholder="Nome do serviço"
                value={novoServico.nome}
                onChange={(e) => setNovoServico({ ...novoServico, nome: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Preço (R$)"
                step="0.01"
                value={novoServico.preco}
                onChange={(e) => setNovoServico({ ...novoServico, preco: e.target.value })}
                required
              />
              <button type="submit">Adicionar Serviço</button>
            </form>

            <ul id="listaServicos">
              {servicos.map(servico => (
                <li key={servico.id}>
                  {servico.nome} - R$ {Number(servico.preco).toFixed(2)}
                  <button onClick={() => excluirServico(servico.id)}>Excluir</button>
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