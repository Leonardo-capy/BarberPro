import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../services/api.js';

function AgendaBarbearia() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [barbearia, setBarbearia] = useState(null);
  const [notFound, setNotFound] = useState(false);

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

  // Carrega barbearia pelo slug
  useEffect(() => {
    api.get(`/api/barbearias/${slug}`)
      .then(res => {
        setBarbearia(res.data);
        localStorage.setItem('ultima_barbearia_id', res.data.id);
        localStorage.setItem('ultima_barbearia_nome', res.data.nome);
        return api.get(`/api/barbearias/${slug}/barbeiros`);
      })
      .then(res => setBarbeiros(res.data))
      .catch(() => setNotFound(true));
  }, [slug]);

  // Carrega serviços ao trocar de barbeiro
  const carregarServicos = useCallback(async () => {
    if (!barbeiroId || !barbearia) return;
    try {
      const res = await api.get(`/api/agendamentos/servicos?user_id=${barbeiroId}&barbearia_id=${barbearia.id}`);
      setServicos(res.data);
    } catch (err) {
      console.error('Erro ao carregar serviços:', err);
    }
  }, [barbeiroId, barbearia]);

  useEffect(() => {
    if (barbeiroId) carregarServicos();
  }, [barbeiroId, carregarServicos]);

  const buscarHorarios = async (dataSelecionada) => {
    if (!barbeiroId || !barbearia) return;
    try {
      const res = await api.get(`/api/agendamentos/disponiveis/${dataSelecionada}?user_id=${barbeiroId}&barbearia_id=${barbearia.id}`);
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
    if (!barbeiroId) { alert('Selecione o barbeiro'); return; }
    if (!data || !horarioSelecionado) { alert('Selecione data e horário'); return; }

    try {
      await api.post('/api/agendamentos', {
        nome,
        telefone,
        servico: servicoId,
        data,
        horario: horarioSelecionado,
        user_id: barbeiroId,
        barbearia_id: barbearia.id
      });
      alert('Agendamento realizado com sucesso!');
      setNome(''); setTelefone(''); setData('');
      setHorarioSelecionado(null); setHorarios([]);
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao agendar');
    }
  };

  const hoje = new Date().toISOString().split('T')[0];

  if (notFound) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#fff' }}>
      <h2>Barbearia não encontrada</h2>
      <button onClick={() => navigate('/agenda')} style={{ marginTop: '16px' }}>Ver todas as barbearias</button>
    </div>
  );

  if (!barbearia) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#00ffd5' }}>
      Carregando...
    </div>
  );

  return (
    <>
      <header className="navbar navbar-cliente">
        <div className="container">
          <div className="logo">
            <a href="/agenda">✂ BarberPro</a>
          </div>
          <nav className="navp">
            <a href="/agenda">← Todas as barbearias</a>
            <a href="/login">Área do barbeiro</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="container">
            <h1>💈 {barbearia.nome}</h1>
            {barbearia.cidade && <p>📍 {barbearia.cidade}</p>}
            <p>Agende seu horário online — rápido, simples e sem espera.</p>
          </div>
        </section>

        <section className="agendamento-section">
          <div className="container">
            <div className="card">
              <h2>Agendamento</h2>
              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
                  <label>Nome</label>
                </div>

                <div className="input-group">
                  <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
                  <label>Telefone</label>
                </div>

                <div className="input-group">
                  <select value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)} required>
                    <option value="">Escolha quem cortará seu cabelo</option>
                    {barbeiros?.map(b => (
                      <option key={b.id} value={b.id}>{b.usuario}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <select value={servicoId} onChange={(e) => setServicoId(e.target.value)} required>
                    <option value="">Selecione o serviço</option>
                    {servicos?.map(s => (
                      <option key={s.id} value={s.id}>{s.nome} — R$ {Number(s.preco).toFixed(2)}</option>
                    ))}
                  </select>
                </div>

                <div className="agenda-area">
                  <div className="calendar-wrapper">
                    <FullCalendar
                      ref={calendarRef}
                      plugins={[dayGridPlugin, interactionPlugin]}
                      initialView="dayGridMonth"
                      locale="pt-br"
                      validRange={{ start: hoje }}
                      headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
                      buttonText={{ today: 'Hoje' }}
                      dateClick={handleDateClick}
                      height="auto"
                      contentHeight="auto"
                    />
                    <p className="info-domingo">❌ Não atendemos aos domingos</p>
                  </div>

                  <div className="horarios-wrapper">
                    {data ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {horarios?.map(horario => {
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

      <footer>
        <div className="container">
          © 2026 BarberPro - Sistema Profissional de Agendamento
        </div>
      </footer>
    </>
  );
}

export default AgendaBarbearia;