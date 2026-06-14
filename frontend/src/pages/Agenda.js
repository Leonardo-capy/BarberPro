import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

function Agenda() {
  const [barbearias, setBarbearias] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/barbearias')
      .then(res => setBarbearias(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <header className="navbar navbar-cliente">
        <div className="container">
          <div className="logo">
            <a href="/login">✂ BarberPro</a>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="container">
            <h1>Escolha sua Barbearia</h1>
            <p>Selecione uma barbearia para agendar seu horário.</p>
          </div>
        </section>

        <section className="agendamento-section">
          <div className="container">
            {loading ? (
              <p style={{ textAlign: 'center', color: '#aaa' }}>Carregando barbearias...</p>
            ) : barbearias.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#aaa' }}>Nenhuma barbearia disponível.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px', margin: '0 auto' }}>
                {barbearias?.map(b => (
                  <div
                    key={b.id}
                    className="card"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => navigate(`/agenda/${b.slug}`)}
                  >
                    <div>
                      <h3 style={{ margin: 0, color: '#00ffd5' }}>💈 {b.nome}</h3>
                      {b.cidade && <p style={{ margin: '4px 0 0', color: '#aaa', fontSize: '14px' }}>📍 {b.cidade}</p>}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/agenda/${b.slug}`); }}>
                      Agendar
                    </button>
                  </div>
                ))}
              </div>
            )}
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

export default Agenda;