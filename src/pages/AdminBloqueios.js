import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import NavbarAdmin from '../components/NavbarAdmin.js';
import api from '../services/api.js';

function AdminBloqueios() {
  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [bloqueados, setBloqueados] = useState([]);
  const calendarRef = useRef(null);

  const horariosFixos = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  useEffect(() => {
    if (dataSelecionada) {
      buscarBloqueios(dataSelecionada);
    }
  }, [dataSelecionada]);

  const buscarBloqueios = async (data) => {
    try {
      const res = await api.get(`/api/agendamentos/bloqueios/${data}`);
      setBloqueados(res.data);
    } catch (err) {
      console.error('Erro ao buscar bloqueios:', err);
    }
  };

  const handleDateClick = (info) => {
    setDataSelecionada(info.dateStr);
    setHorarios(horariosFixos);
  };

  const toggleBloqueio = async (horario) => {
    if (!dataSelecionada) return;

    try {
      const res = await api.post('/api/agendamentos/toggle-bloqueio', {
        data: dataSelecionada,
        horario
      });

      if (res.data.status === 'bloqueado') {
        setBloqueados([...bloqueados, horario]);
      } else {
        setBloqueados(bloqueados.filter(h => h !== horario));
      }
    } catch (err) {
      console.error('Erro ao alternar bloqueio:', err);
    }
  };

  const bloquearDiaInteiro = async () => {
    if (!dataSelecionada) {
      alert('Selecione uma data no calendário primeiro.');
      return;
    }

    try {
      const res = await api.post('/api/agendamentos/bloquear-dia', {
        data: dataSelecionada
      });

      alert(res.data.message);
      buscarBloqueios(dataSelecionada);

      // Marcar data no calendário
      const dayEl = document.querySelector(`.fc-day[data-date='${dataSelecionada}']`);
      if (dayEl) {
        if (res.data.bloqueado) {
          dayEl.style.backgroundColor = '#ff2e63';
          dayEl.style.color = 'white';
        } else {
          dayEl.style.backgroundColor = '';
          dayEl.style.color = '';
        }
      }
    } catch (err) {
      console.error('Erro: ', err);
      alert('Erro ao bloquear/desbloquear dia');
    }
  };

  return (
    <>
      <NavbarAdmin />
      <main className="admin-container">
        <div className="lado-esquerdo">
          <section className="calendar-section">
            <h2>Selecionar Data</h2>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale="pt-br"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: ''
              }}
              buttonText={{ today: 'Hoje' }}
              dateClick={handleDateClick}
            />
          </section>
        </div>

        <div className="lado-direito">
          <section className="bloqueios-section">
            <h2>Gerenciar Horários</h2>
            <div id="horariosContainer">
              {horarios.map(horario => (
                <button
                  key={horario}
                  className={`horario-btn ${bloqueados.includes(horario) ? 'bloqueado' : ''}`}
                  onClick={() => toggleBloqueio(horario)}
                >
                  {horario}
                </button>
              ))}
            </div>
            <button
              id="bloquearDiaBtn"
              className="btn-dia-inteiro"
              onClick={bloquearDiaInteiro}
            >
              Bloquear / Desbloquear Dia Inteiro
            </button>
          </section>
        </div>
      </main>
    </>
  );
}

export default AdminBloqueios;