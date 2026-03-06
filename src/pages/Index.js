import React, { useState, useEffect, useRef, useCallback } from 'react'; // Adicionar useCallback
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../services/api.js';

function Index() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [data, setData] = useState('');
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const [barbeiros, setBarbeiros] = useState([]);
  const [barbeiroId, setBarbeiroId] = useState('');
  const [servicos, setServicos] = useState([]);
  const [servicoId, setServicoId] = useState('');
  const [horarios, setHorarios] = useState([]);
  const calendarRef = useRef(null);

  useEffect(() => {
    carregarBarbeiros();
  }, []);

  // Usar useCallback para memoizar a função
  const carregarServicos = useCallback(async () => {
    if (!barbeiroId) return;
    try {
      const res = await api.get(`/api/agendamentos/servicos?user_id=${barbeiroId}`);
      setServicos(res.data);
    } catch (err) {
      console.error('Erro ao carregar serviços:', err);
    }
  }, [barbeiroId]); // Dependência: barbeiroId

  useEffect(() => {
    if (barbeiroId) {
      carregarServicos();
    }
  }, [barbeiroId, carregarServicos]); // Adicionar carregarServicos às dependências

  const carregarBarbeiros = async () => {
    try {
      const res = await api.get('/api/barbeiros');
      setBarbeiros(res.data);
    } catch (err) {
      console.error('Erro ao carregar barbeiros:', err);
    }
  };

  // ... resto do código permanece igual

  // ✅ Função carregarServicos definida antes de ser usada

  const buscarHorarios = async (dataSelecionada) => {
    if (!barbeiroId) return;
    try {
      const res = await api.get(`/api/agendamentos/disponiveis/${dataSelecionada}?user_id=${barbeiroId}`);
      setHorarios(res.data);
      setHorarioSelecionado(null);
    } catch (err) {
      console.error('Erro ao buscar horários:', err);
    }
  };

  const handleDateClick = (info) => {
    const dataSelecionada = new Date(info.dateStr + 'T00:00:00');
    if (dataSelecionada.getDay() === 0) {
      alert('Não trabalhamos aos domingos!');
      return;
    }
    setData(info.dateStr);
    buscarHorarios(info.dateStr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!barbeiroId) {
      alert('Selecione o barbeiro');
      return;
    }
    if (!data || !horarioSelecionado) {
      alert('Selecione data e horário');
      return;
    }

    try {
      await api.post('/api/agendamentos', {
        nome,
        telefone,
        servico: servicoId,
        data,
        horario: horarioSelecionado,
        user_id: barbeiroId
      });
      alert('Agendamento realizado com sucesso!');
      setNome('');
      setTelefone('');
      setData('');
      setHorarioSelecionado(null);
      setHorarios([]);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao agendar');
    }
  };

  const hoje = new Date().toISOString().split('T')[0];

  return (
    <>
      <header className="navbar navbar-cliente">
        <div className="container">
          <div className="logo">
            <a href="/login">✂ BarberPro</a>
          </div>
          <nav className="navp">
            <a href="#inicio">Início</a>
            <a href="#servicos">Serviços</a>
            <a href="#contato">Contato</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="container">
            <h1>Agende seu horário online</h1>
            <p>Rápido, simples e sem espera.</p>
          </div>
        </section>

        <section className="servicos-info" id="servicos">
          <h2>Nossos Serviços</h2>
          <p>Cada barbeiro oferece serviços personalizados.</p>
          <p>Escolha o profissional para visualizar as opções disponíveis.</p>
        </section>

        <section className="agendamento-section">
          <div className="container">
            <div className="card">
              <h2>Agendamento</h2>
              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <input
                    type="text"
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                  <label>Nome</label>
                </div>

                <div className="input-group">
                  <input
                    type="text"
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    required
                  />
                  <label>Telefone</label>
                </div>

                <div className="input-group">
                  <select
                    value={barbeiroId}
                    onChange={(e) => setBarbeiroId(e.target.value)}
                    required
                  >
                    <option value="">Escolha quem cortará seu cabelo</option>
                    {barbeiros.map(barbeiro => (
                      <option key={barbeiro.id} value={barbeiro.id}>
                        {barbeiro.usuario}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <select
                    value={servicoId}
                    onChange={(e) => setServicoId(e.target.value)}
                    required
                  >
                    <option value="">Selecione o serviço</option>
                    {servicos.map(servico => (
                      <option key={servico.id} value={servico.id}>
                        {servico.nome} — R$ {Number(servico.preco).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <input type="hidden" id="data" value={data} />

                <div className="agenda-area">
                  <div className="calendar-wrapper">
                    <FullCalendar
                      ref={calendarRef}
                      plugins={[dayGridPlugin, interactionPlugin]}
                      initialView="dayGridMonth"
                      locale="pt-br"
                      validRange={{ start: hoje }}
                      headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: ''
                      }}
                      buttonText={{ today: 'Hoje' }}
                      dateClick={handleDateClick}
                      height="auto"
                      contentHeight="auto"
                    />
                    <p className="info-domingo">❌ Não atendemos aos domingos</p>
                  </div>

                  <div className="horarios-wrapper" id="horariosContainer">
                    {data ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {horarios.map(horario => {
                          const agora = new Date();
                          const hojeLocal = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
                          const [hora, minuto] = horario.split(':');
                          const dataHorario = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), parseInt(hora), parseInt(minuto));
                          const desativado = data === hojeLocal && dataHorario <= agora;

                          return (
                            <button
                              key={horario}
                              type="button"
                              className={`horario-btn ${horarioSelecionado === horario ? 'selecionado' : ''} ${desativado ? 'desativado' : ''}`}
                              onClick={() => setHorarioSelecionado(horario)}
                              disabled={desativado}
                            >
                              {horario}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p>Selecione uma data para ver horários disponíveis</p>
                    )}
                  </div>
                </div>

                <button type="submit">Agendar Horário</button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <section className="contato" id="contato">
        <div className="container">
          <h2>Contato</h2>
          <p>Telefone: (00) 00000-0000</p>
          <p>Endereço: Sua cidade</p>
        </div>
      </section>

      <footer>
        <div className="container">
          © 2026 BarberPro - Sistema Profissional de Agendamento
        </div>
      </footer>
    </>
  );
}

export default Index;