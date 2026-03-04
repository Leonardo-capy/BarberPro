document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("formAgendamento");
  const dataInput = document.getElementById("data");
  const horariosContainer = document.getElementById("horariosContainer");

  const nome = document.getElementById("nome");
  const telefone = document.getElementById("telefone");
  const servico = document.getElementById("servicoSelect");
  const barbeiroSelect = document.getElementById("barbeiroNome");

  let horarioSelecionado = null;

  const hoje = new Date().toISOString().split("T")[0];

  const calendar = new FullCalendar.Calendar(document.getElementById("calendar"), {
    initialView: "dayGridMonth",
    height: 'auto',
    contentHeight: 'auto',
    locale: "pt-br",
    validRange: { start: hoje },

    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: ""
    },

    buttonText: { today: "Hoje" },

    dateClick: function (info) {

      const dataSelecionada = new Date(info.dateStr + "T00:00:00");

      if (dataSelecionada.getDay() === 0) {
        alert("Não trabalhamos aos domingos!");
        return;
      }

      dataInput.value = info.dateStr;
      buscarHorarios(info.dateStr);
    }
  });

  calendar.render();

  window.addEventListener("resize", () => {
    calendar.updateSize();
  });

  async function buscarHorarios(data) {


    if (!barbeiroSelect) {
      console.log("Select de barbeiro nao encontrado");
      return;
    }
    const barbeiroId = barbeiroSelect.value;

    const resposta = await fetch(`/api/agendamentos/disponiveis/${data}?user_id=${barbeiroId}`);
    const horarios = await resposta.json();

    console.log("Horarios recebidos: ", horarios);

    horariosContainer.innerHTML = "";
    horarioSelecionado = null;

    if (horarios.length === 0) {
      horariosContainer.innerHTML = "<p>Sem horários disponíveis</p>";
      return;
    }

    horarios.forEach(horario => {

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = horario;
      btn.classList.add("horario-btn");


      const agora = new Date();

      // pega data local correta (evita bug UTC)
      const ano = agora.getFullYear();
      const mes = String(agora.getMonth() + 1).padStart(2, "0");
      const dia = String(agora.getDate()).padStart(2, "0");
      const hojeLocal = `${ano}-${mes}-${dia}`;

      if (data === hojeLocal) {

        const [hora, minuto] = horario.split(":");

        const dataHorario = new Date(
          ano,
          agora.getMonth(),
          agora.getDate(),
          parseInt(hora),
          parseInt(minuto)
        );

        if (dataHorario <= agora) {
          btn.disabled = true;
          btn.classList.add("desativado");
        }
      }

      btn.onclick = () => {
        document.querySelectorAll(".horario-btn")
          .forEach(b => b.classList.remove("selecionado"));

        btn.classList.add("selecionado");
        horarioSelecionado = horario;
      };

      horariosContainer.appendChild(btn);
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!barbeiroSelect.value) {
      alert("Selecione o barbeiro");
      return;
    }

    if (!dataInput.value || !horarioSelecionado) {
      alert("Selecione data e horário.");
      return;
    }

    if (dataInput.value < hoje) {
      alert("Não é possível agendar para datas anteriores.");
      return;
    }

    const resposta = await fetch("/api/agendamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: nome.value,
        telefone: telefone.value,
        servico: document.getElementById("servicoSelect").value,
        data: dataInput.value,
        horario: horarioSelecionado,
        user_id: barbeiroSelect.value
      })
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      alert(resultado.error);
      return;
    }

    alert(resultado.message);
    form.reset();
    horariosContainer.innerHTML =
      "<p>Selecione uma data para ver horários disponíveis</p>";
  });

  async function carregarBarbeiros() {
    try {
      const res = await fetch("/api/barbeiros");
      const barbeiros = await res.json();

      const select = document.getElementById("barbeiroNome");

      barbeiros.forEach(barbeiro => {
        const option = document.createElement("option");
        option.value = barbeiro.id;
        option.textContent = barbeiro.usuario;
        select.appendChild(option);
      });

    } catch (err) {
      console.error("Erro ao carregar barbeiros:", err);
    }
  }

  carregarBarbeiros();

  // Quando o barbeiro muda, atualiza os serviços disponíveis
  document.getElementById("barbeiroNome").addEventListener("change", carregarServicos);

  async function carregarServicos() {
    const barbeiroId = document.getElementById("barbeiroNome").value;

    if (!barbeiroId) return; // nenhum barbeiro selecionado

    try {
      // Busca serviços do barbeiro
      const resposta = await fetch(`/api/agendamentos/servicos?user_id=${barbeiroId}`);

      if (!resposta.ok) {
        console.error("Falha ao buscar serviços:", resposta.status, await resposta.text());
        return;
      }

      const servicos = await resposta.json();

      // Certifica que é um array
      if (!Array.isArray(servicos)) {
        console.error("Serviços inválidos:", servicos);
        return;
      }

      // Preenche select
      const select = document.getElementById("servicoSelect");
      select.innerHTML = '<option value="">Selecione o serviço</option>';

      servicos.forEach(servico => {
        const option = document.createElement("option");
        option.value = servico.id;
        option.textContent = `${servico.nome} — R$ ${Number(servico.preco).toFixed(2)}`;
        select.appendChild(option);
      });

    } catch (erro) {
      console.error("Erro ao carregar serviços:", erro);
    }
  }

  // Carrega serviços se já tiver algum barbeiro selecionado
  carregarServicos();

});

