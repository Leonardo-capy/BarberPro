document.addEventListener("DOMContentLoaded", function () {


  let dataSelecionada = null;

  const bloquearDiaBtn = document.getElementById("bloquearDiaBtn");

  bloquearDiaBtn.addEventListener("click", async () => {
    if (!dataSelecionada) {
      alert("Selecione uma data no calendário primeiro.");
      return;
    }

    try {
      const resposta = await fetch("/api/agendamentos/bloquear-dia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dataSelecionada })
      });

      if (!resposta.ok) throw new Error("Erro ao bloquear dia");

      const resultado = await resposta.json();
      alert(resultado.message);

      // Atualiza os horários
      buscarHorariosAdmin(dataSelecionada);

      // Marca a data no calendário como bloqueada (vermelho)
      const dayEl = document.querySelector(`.fc-day[data-date='${dataSelecionada}']`);
      if (dayEl) {
        dayEl.style.backgroundColor = "#ff2e63";
        dayEl.style.color = "white";
      }

    } catch (error) {
      console.error("Erro: ", error);
      alert("O servidor retornou erro 500. Verifique o backend.");
    }
  });

  const horariosContainer = document.getElementById("horariosContainer");

  const calendar = new FullCalendar.Calendar(document.getElementById("calendar"), {
    initialView: "dayGridMonth",
    locale: "pt-br",

    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: ""
    },

    buttonText: { today: "Hoje" },

    dateClick: function (info) {
      dataSelecionada = info.dateStr;
      buscarHorariosAdmin(info.dateStr);
    }
  });

  calendar.render();

  async function buscarHorariosAdmin(data) {

    const respostaBloqueados = await fetch(`/api/agendamentos/bloqueios/${data}`);
    const bloqueados = await respostaBloqueados.json();

    const horariosFixos = [
      "09:00", "10:00", "11:00",
      "13:00", "14:00", "15:00",
      "16:00", "17:00"
    ];

    horariosContainer.innerHTML = "";

    horariosFixos.forEach(horario => {

      const btn = document.createElement("button");
      btn.textContent = horario;
      btn.classList.add("horario-btn");

      if (bloqueados.includes(horario)) {
        btn.classList.add("bloqueado");
      }

      btn.onclick = async () => {

        const resposta = await fetch("/api/agendamentos/toggle-bloqueio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data, horario })
        });

        const resultado = await resposta.json();

        if (resultado.status === "bloqueado") {
          btn.classList.add("bloqueado");
        } else {
          btn.classList.remove("bloqueado");
        }
      };

      horariosContainer.appendChild(btn);
    });
  }

});